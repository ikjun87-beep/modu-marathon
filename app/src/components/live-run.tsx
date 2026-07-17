/**
 * LiveRunModal — expo-location 기반 실시간 러닝 트래킹.
 * 시작 → 실시간 거리·페이스·시간 누적 → 종료 시 통합 Run(source:'gps')으로 저장.
 * 포그라운드 추적은 Expo Go/웹에서도 동작. 화면잠금 백그라운드는 EAS dev build 필요.
 */
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { RunMap } from "@/components/run-map";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { saveRunPath } from "@/lib/run-path";
import { fmtDuration, haversine, paceLabel, saveRun, type LatLng } from "@/lib/run";

type Props = { visible: boolean; name: string; onClose: (saved: boolean) => void };
type Phase = "idle" | "running" | "paused" | "saving";

// 사람 러닝 속도 상한(m/s). 9m/s≈32km/h — 스프린트도 포함, 이 이상은 GPS 튐으로 간주해 거리 미가산.
const MAX_SPEED_MS = 9;

// ── 누적 상승고도 ──────────────────────────────────────────────────
// GPS 고도는 수평보다 2~3배 부정확해서 **가만히 서 있어도 ±6m씩 흔들린다.**
// 들어오는 값을 그냥 더하면 앉아만 있어도 수천 m가 쌓인다(시뮬레이션: ±6m 잔떨림 30분 → 3003m).
//
// 그래서 두 단계로 거른다.
//  ① **EMA 저역통과**로 값을 매끈하게 — 문턱만으로는 못 막는다(잔떨림이 문턱보다 크면 그대로 샌다).
//  ② **골짜기→봉우리**로 센다: 방향이 ALT_REVERSAL_M만큼 뒤집혀야 전환을 확정하고, 그때
//     골짜기부터 봉우리까지 **상승분 전체**를 더한다. 내리막은 안 뺀다(러닝계 표준 "gain").
//     ※ 단순 문턱 방식은 봉우리 직전 구간을 통째로 놓쳐 60m 언덕을 33m로 세더라(그래서 폐기).
//
// 파라미터는 시뮬레이션으로 고름(scratchpad alt-final.mjs). EMA 0.12 + 반전 4m 기준:
//   평지 1m · 정지(현실) 8m · 정지(최악 30분) 16m · 언덕60m→61 · 오르내림60m→55 · 짧은언덕60m→38
// 짧고 가파른 언덕은 적게 세지만 **부풀리는 것보다 낫다** — 평지에서 큰 숫자가 뜨면 신뢰를 잃는다.
const ALT_ACC_MAX_M = 8; // altitudeAccuracy가 이보다 나쁘면 그 고도값은 안 믿는다
const ALT_EMA_ALPHA = 0.12; // 저역통과 계수(작을수록 매끈하지만 짧은 언덕에 둔감)
const ALT_REVERSAL_M = 4; // 이만큼 반대로 움직여야 오르막↔내리막 전환 확정(잔떨림이 봉우리를 만드는 것 방지)

export function LiveRunModal({ visible, name, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [distanceM, setDistanceM] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [path, setPath] = useState<LatLng[]>([]); // 실시간 경로(온디바이스 표시용, 서버 미저장)

  const sub = useRef<Location.LocationSubscription | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const last = useRef<LatLng | null>(null);
  const lastAt = useRef<number>(0); // 직전 채택 좌표의 시각(ms) — 속도 게이트용
  // 상승고도 상태(위 설명 참조) — 매끈해진 고도(ema)와 직전 골짜기·봉우리, 현재 방향
  const alt = useRef<{ ema: number; valley: number; peak: number; rising: boolean } | null>(null);
  const gainM = useRef<number>(0); // 확정된 누적 상승고도(m)
  const startedAt = useRef<number>(0);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  // 모달이 닫히면 항상 정리
  useEffect(() => {
    if (!visible) stopAll();
    return stopAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function stopAll() {
    sub.current?.remove();
    sub.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  /** 아직 확정 안 된 오르막(봉우리에서 멈춘 경우)까지 합친 최종 상승고도.
   *  이걸 안 하면 언덕 꼭대기에서 종료했을 때 마지막 오르막이 통째로 사라진다. */
  function settleGain(): number {
    const a = alt.current;
    if (a?.rising) return gainM.current + Math.max(0, a.peak - a.valley);
    return gainM.current;
  }

  function reset() {
    setDistanceM(0);
    setElapsed(0);
    setErr(null);
    setPath([]);
    last.current = null;
    lastAt.current = 0;
    alt.current = null;
    gainM.current = 0;
    startedAt.current = 0;
  }

  async function start() {
    setErr(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErr("위치 권한이 필요해요. 설정에서 허용해 주세요.");
      return;
    }
    reset();
    startedAt.current = Date.now();
    setPhase("running");
    if (!(await armTracking())) {
      setErr("위치 추적을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPhase("idle");
    }
  }

  // 타이머 + 위치 구독을 건다. 성공 시 true. start()와 저장 실패 후 재개 양쪽에서 재사용.
  async function armTracking(): Promise<boolean> {
    stopAll(); // 중복 구독 방지
    timer.current = setInterval(() => {
      if (phaseRef.current === "running") setElapsed((e) => e + 1);
    }, 1000);
    try {
      sub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 4,
        },
        (loc) => {
          if (phaseRef.current !== "running") return;
          const cur: LatLng = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          const acc = loc.coords.accuracy ?? 999;
          const t = loc.timestamp || Date.now();
          if (last.current && lastAt.current && acc <= 30) {
            const d = haversine(last.current, cur);
            const dt = (t - lastAt.current) / 1000; // 초
            // dt>0일 때만 속도로 판정 — 타임스탬프가 안 흐르거나(0) 역행(<0)하면 이 구간은 건너뛴다(유령거리 방지).
            // 상한은 고정 60m가 아니라 속도(≤9m/s)로 — 신호가 끊겨 넓게 벌어진 정상 구간을 버리지 않는다.
            if (dt > 0 && d >= 1.5 && d / dt <= MAX_SPEED_MS) {
              setDistanceM((m) => m + d);
              setPath((p) => [...p, cur]); // 채택된 이동만 경로에 추가 → 깨끗한 라인
            }
          }
          if (acc <= 30) {
            if (!last.current) setPath((p) => (p.length ? p : [cur])); // 첫 좋은 픽스 = 시작점
            last.current = cur;
            lastAt.current = t;
          }

          // 누적 상승고도 — 수평 정확도와 별개로 **고도 정확도(altitudeAccuracy)**로 판정한다.
          const rawAlt = loc.coords.altitude;
          const altAcc = loc.coords.altitudeAccuracy ?? Infinity;
          if (rawAlt != null && altAcc <= ALT_ACC_MAX_M) {
            const a = alt.current;
            if (!a) {
              alt.current = { ema: rawAlt, valley: rawAlt, peak: rawAlt, rising: true };
            } else {
              a.ema += ALT_EMA_ALPHA * (rawAlt - a.ema); // ① 저역통과
              if (a.rising) {
                if (a.ema > a.peak) a.peak = a.ema; // 계속 오르는 중 — 봉우리 갱신
                else if (a.ema < a.peak - ALT_REVERSAL_M) {
                  gainM.current += a.peak - a.valley; // ② 내려가기 시작 → 이번 오르막 확정
                  a.rising = false;
                  a.valley = a.ema;
                }
              } else {
                if (a.ema < a.valley) a.valley = a.ema; // 계속 내려가는 중 — 골짜기 갱신
                else if (a.ema > a.valley + ALT_REVERSAL_M) {
                  a.rising = true; // 다시 오르기 시작 — 여기가 새 오르막의 출발점
                  a.peak = a.ema;
                }
              }
            }
          }
        }
      );
      return true;
    } catch {
      stopAll();
      return false;
    }
  }

  function pause() {
    setPhase("paused");
    last.current = null; // 재개 시 튐 방지
    lastAt.current = 0;
    // 고도 추적도 확정하고 버린다 — 쉬는 동안 이동(차·엘리베이터)했다면
    // 낡은 기준점이 가짜 상승을 만든다. 지금까지 오른 건 잃지 않게 먼저 확정.
    gainM.current = settleGain();
    alt.current = null;
  }
  function resume() {
    setPhase("running");
  }

  async function finish() {
    stopAll();
    const km = distanceM / 1000;
    if (km < 0.01 || elapsed < 3) {
      // 기록할 게 없음
      reset();
      setPhase("idle");
      onClose(false);
      return;
    }
    setPhase("saving");
    const sid = String(startedAt.current || Date.now()); // 멱등 upsert 키 = runs 문서 id의 sourceId
    try {
      await saveRun({
        source: "gps",
        sourceId: sid, // 재탭·재시도 시 중복 저장 방지
        name: name.trim() || "익명",
        distanceKm: km,
        durationSec: elapsed,
        startedAt: startedAt.current || Date.now(),
        elevationGainM: settleGain() || undefined, // 평지면 0 → 저장 안 함(문서 경량·타일 숨김)
      });
      // 완주 경로를 이 기기에만 저장(서버 미저장) → 상세 페이지 지도용. 문서 id(gps_<sid>)와 키를 맞춤.
      await saveRunPath(`gps_${sid}`, path);
      reset();
      setPhase("idle");
      onClose(true);
    } catch {
      setErr("저장에 실패했어요. '계속'으로 이어 달리거나, 다시 [종료·저장]으로 재시도할 수 있어요.");
      last.current = null; // 중단된 사이 위치가 크게 변했을 수 있으니 재개 시 재앵커(튐 방지)
      lastAt.current = 0;
      gainM.current = settleGain(); // 고도도 같은 이유로 확정 후 재시작(가짜 상승 방지)
      alt.current = null;
      await armTracking(); // 트래킹을 되살려 '계속'이 실제로 이어 달리게 한다(거리·시간 유실 방지)
      setPhase("paused");
    }
  }

  function cancel() {
    stopAll();
    reset();
    setPhase("idle");
    onClose(false);
  }

  const km = distanceM / 1000;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={cancel}
      statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.top}>
          <Pressable style={styles.closeBtn} onPress={cancel} hitSlop={12}>
            <Icon name="close" size={24} color={Brand.soft} />
          </Pressable>
          <View style={styles.eyebrowRow}>
            <Icon name="run" size={16} color={Brand.brand} />
            <Text style={styles.eyebrow}>LIVE RUN</Text>
          </View>
          <Text style={styles.who}>{name.trim() || "익명"} 님의 러닝</Text>
        </View>

        <View style={styles.mapArea}>
          <RunMap path={path} />
          <View style={styles.kmOverlay} pointerEvents="none">
            <Text style={styles.bigNum}>{km.toFixed(2)}</Text>
            <Text style={styles.bigUnit}>km</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{fmtDuration(elapsed)}</Text>
            <Text style={styles.statLab}>시간</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{paceLabel(km, elapsed)}</Text>
            <Text style={styles.statLab}>페이스</Text>
          </View>
        </View>

        {err && <Text style={styles.err}>{err}</Text>}
        {phase === "running" && (
          <Text style={styles.hint}>
            화면을 켜 둔 채로 달려주세요. 백그라운드 자동기록은 추후 dev build에서 열려요.
          </Text>
        )}

        <View style={styles.controls}>
          {phase === "idle" && (
            <Pressable style={[styles.ctrl, styles.ctrlStart]} onPress={start}>
              <Icon name="play" size={22} color="#fff" />
              <Text style={styles.ctrlStartText}>러닝 시작</Text>
            </Pressable>
          )}
          {phase === "running" && (
            <Pressable style={[styles.ctrl, styles.ctrlPause]} onPress={pause}>
              <Icon name="pause" size={22} color={Brand.ink} />
              <Text style={styles.ctrlPauseText}>일시정지</Text>
            </Pressable>
          )}
          {(phase === "paused" || phase === "saving") && (
            <View style={styles.pausedRow}>
              <Pressable
                style={[styles.ctrl, styles.ctrlResume]}
                onPress={resume}
                disabled={phase === "saving"}>
                <Icon name="play" size={20} color="#fff" />
                <Text style={styles.ctrlStartText}>계속</Text>
              </Pressable>
              <Pressable
                style={[styles.ctrl, styles.ctrlStop]}
                onPress={finish}
                disabled={phase === "saving"}>
                <Icon name="stop" size={18} color="#fff" />
                <Text style={styles.ctrlStartText}>
                  {phase === "saving" ? "저장 중…" : "종료·저장"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const mono = Platform.select({ ios: "ui-rounded", default: "sans-serif-medium" });

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg, paddingHorizontal: 24 },
  top: { paddingTop: 8, alignItems: "center", gap: 4 },
  closeBtn: { position: "absolute", left: 0, top: 4, padding: 8 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  eyebrow: { fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  who: { fontFamily: FONT,
    fontSize: 15, color: Brand.soft, fontWeight: Weight.regular },
  mapArea: { flex: 1, marginVertical: 12, position: "relative" },
  kmOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bigNum: { fontSize: 54, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -2, fontFamily: mono },
  bigUnit: { fontFamily: FONT,
    fontSize: 18, fontWeight: Weight.bold, color: Brand.soft, marginBottom: 8, marginLeft: 5 },
  stats: {
    flexDirection: "row",
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    paddingVertical: 18,
    alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statDiv: { width: 1, alignSelf: "stretch", backgroundColor: Brand.line2, marginVertical: 6 },
  statNum: { fontSize: 24, fontWeight: Weight.bold, color: Brand.ink, fontFamily: mono },
  statLab: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, fontWeight: Weight.regular },
  err: { color: Brand.brandDeep, fontFamily: FONT,
    fontSize: 13, textAlign: "center", marginTop: 14, fontWeight: Weight.regular },
  hint: { color: Brand.faint, fontFamily: FONT,
    fontSize: 12, textAlign: "center", marginTop: 14 },
  controls: { paddingVertical: 26 },
  ctrl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.card,
    paddingVertical: 18,
    minHeight: 60,
  },
  ctrlStart: { backgroundColor: Brand.brand },
  ctrlStartText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 17 },
  ctrlPause: { backgroundColor: Brand.warm, borderWidth: 1, borderColor: Brand.line2 },
  ctrlPauseText: { color: Brand.ink, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 17 },
  pausedRow: { flexDirection: "row", gap: 12 },
  ctrlResume: { flex: 1, backgroundColor: Brand.accent },
  ctrlStop: { flex: 1.4, backgroundColor: Brand.brand },
});
