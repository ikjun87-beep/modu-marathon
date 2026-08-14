/**
 * LiveRunModal — expo-location 기반 실시간 러닝 트래킹.
 * 시작 → 실시간 거리·페이스·시간 누적 → 종료 시 통합 Run(source:'gps')으로 저장.
 *
 * 거리·경로·상승고도 계산은 `lib/live-tracking.ts`로 옮겼다(S5, 2026-08-15) — 화면이 꺼진 동안은
 * `expo-task-manager`가 모듈 스코프 콜백으로 위치를 받는데, 그 콜백은 이 컴포넌트의 state에
 * 직접 못 닿는다. 이 화면은 이제 **그 모듈을 구독해 값을 받아 그리는 쪽**이다.
 */
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { AppState, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { RunMap, type RunMapHandle } from "@/components/run-map";
import { ShareSheet } from "@/components/share-sheet";
import { Brand, FONT, FONT_DISPLAY, Weight, Radius, Shadow, leading } from "@/lib/brand";
import type { Row } from "@/lib/crew";
import {
  getSnapshot,
  pauseTracking,
  resetTracking,
  resumeTracking,
  settleGain,
  startBackgroundTask,
  startForegroundWatch,
  stopBackgroundTask,
  stopTracking,
  subscribe,
} from "@/lib/live-tracking";
import { saveRunPath } from "@/lib/run-path";
import { fmtDuration, paceLabel, saveRun, type LatLng } from "@/lib/run";

type Props = { visible: boolean; name: string; onClose: (saved: boolean) => void };
/** `done` = 저장까지 끝나고 **결과 요약**을 보여주는 단계.
 *
 *  예전엔 [종료·저장] → 모달이 그냥 닫혔다. 방금 뛴 걸 확인하려면 러닝 탭에서 목록을 찾아
 *  다시 들어가야 했고, 그 사이에 성취감이 식는다. 티맵·카카오네비가 주행 끝에 요약을 띄우고
 *  삼성헬스가 운동 끝에 결과를 보여주는 이유가 그것이다(회장 지시 2026-07-31).
 *  자랑 동기도 여기서 가장 크므로 [공유하기]를 같은 화면에 둔다. */
type Phase = "idle" | "running" | "paused" | "saving" | "done";

/** 요약 화면이 쓰는 확정 결과. `reset()`이 지워버리면 지도가 사라지므로 따로 들고 있는다. */
type RunResult = { id: string; km: number; sec: number; gain: number; startedAt: number; path: LatLng[] };

export function LiveRunModal({ visible, name, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [distanceM, setDistanceM] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [path, setPath] = useState<LatLng[]>([]); // 실시간 경로(온디바이스 표시용, 서버 미저장)
  const [result, setResult] = useState<RunResult | null>(null); // 요약 화면용 확정 결과
  const [sharing, setSharing] = useState(false);
  const [mapShot, setMapShot] = useState<string | null>(null); // 공유 카드에 넣을 지도 스냅샷
  const [here, setHere] = useState<LatLng | null>(null); // 시작 전 지도를 놓을 현재 위치
  // 지금 백그라운드 태스크로 도는지 — 안내 문구를 사실과 다르게 띄우지 않기 위해 화면에서 안다.
  const [bgActive, setBgActive] = useState(false);
  const mapRef = useRef<RunMapHandle>(null);

  // foreground 폴백 구독(백그라운드 태스크 시작에 실패했을 때만 쓴다 — armTracking 참조).
  const sub = useRef<Location.LocationSubscription | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0); // 이 러닝의 최초 시작 시각(ms) — 저장 sourceId·startedAt에 씀
  // ⏱ 경과시간은 setInterval로 "누적"하지 않고 시각 차로 "파생 계산"한다(runStartedAt·accumulatedSec).
  // 화면이 꺼지면 JS 타이머(setInterval)가 함께 멈출 수 있어서다 — TaskManager 콜백은 네이티브가
  // 깨워 실행해 주지만 setInterval은 그 보장이 없다. 파생 계산이면 화면을 다시 켰을 때
  // Date.now() 기준으로 정확한 값이 즉시 나온다(2026-08-15 S5).
  const runStartedAt = useRef<number>(0); // 현재 러닝 구간(resume 이후) 시작 시각
  const accumulatedSec = useRef<number>(0); // 이전 구간까지 확정된 경과초(pause마다 갱신)
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  function calcElapsed(): number {
    if (phaseRef.current !== "running" || !runStartedAt.current) return accumulatedSec.current;
    return accumulatedSec.current + Math.floor((Date.now() - runStartedAt.current) / 1000);
  }

  // live-tracking 모듈 구독 — 화면이 켜져 있는 동안 위치가 들어올 때마다(foreground 구독이든
  // TaskManager 콜백이든 소스 무관) 최신 거리·경로를 받아 그린다.
  useEffect(() => {
    const unsub = subscribe(() => {
      const snap = getSnapshot();
      setDistanceM(snap.distanceM);
      setPath(snap.path);
    });
    return unsub;
  }, []);

  // 화면이 꺼졌다 켜지면(잠금 해제 등) 그 사이 쌓인 값을 즉시 반영 — 다음 위치 업데이트를
  // 기다리지 않고 복귀 순간 바로 맞는 숫자가 보이게 한다.
  useEffect(() => {
    const s = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      const snap = getSnapshot();
      setDistanceM(snap.distanceM);
      setPath(snap.path);
      setElapsed(calcElapsed());
    });
    return () => s.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모달이 닫히면 항상 정리
  useEffect(() => {
    if (!visible) {
      stopAll();
      void stopBackgroundTask();
    }
    return () => {
      stopAll();
      void stopBackgroundTask();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /** 모달을 열면 **시작 전에도** 현재 위치를 한 번 잡아 지도를 거기로 옮긴다.
   *
   *  이게 없으면 [러닝 시작]을 누르기 전까지 지도가 서울 기본 좌표에 머물러, "내가 어디서
   *  출발하는지"가 안 보였다(실기기 확인 — 서울시청이 떠 있었다). 티맵·카카오네비가 열자마자
   *  현재 위치를 보여주는 것과 같은 이유다.
   *
   *  ⚠️ 여기서 **권한을 요청하지 않는다.** 이미 허용한 사람에게만 미리보기를 주고, 아직 안 물어본
   *  사람에게는 [러닝 시작]을 누르는 순간에 묻는다 — 화면을 열자마자 권한 창이 뜨면 놀란다. */
  useEffect(() => {
    if (!visible || phase !== "idle") return;
    let alive = true;
    void (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getLastKnownPositionAsync();
        const pos = loc ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (alive && pos) setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* 위치를 못 잡아도 지도는 기본 좌표로 뜬다 — 러닝 시작에 지장 없다 */
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, phase]);

  // foreground 구독만 끊는다(백그라운드 태스크는 별도 stopBackgroundTask() — 저장 실패 재개
  // 경로에서 태스크는 살려두고 이 구독만 정리해야 할 때가 있어 분리했다).
  function stopAll() {
    sub.current?.remove();
    sub.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  function reset() {
    setDistanceM(0);
    setElapsed(0);
    setErr(null);
    setPath([]);
    resetTracking();
    startedAt.current = 0;
    runStartedAt.current = 0;
    accumulatedSec.current = 0;
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
    runStartedAt.current = startedAt.current;
    setPhase("running");
    if (!(await armTracking())) {
      setErr("위치 추적을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPhase("idle");
    }
  }

  /**
   * 위치 추적을 건다. **백그라운드 태스크를 우선**하고, 실패할 때만 foreground 구독으로
   * 폴백한다 — 둘을 동시에 걸면 같은 GPS를 이중 구독하게 돼 배터리를 두 배로 쓰고, 두
   * 소스가 살짝 다른 타이밍으로 같은 좌표를 두 번 넘겨 거리가 미세하게 어긋날 수 있다.
   *
   * 백그라운드 태스크가 성공하면 화면이 켜져 있을 때도 위치는 **TaskManager 콜백 하나**로만
   * 들어온다(`live-tracking.ts`) — 화면 상태가 바뀌어도 계산 경로가 안 갈린다.
   * start()·저장 실패 후 재개 양쪽에서 재사용.
   */
  async function armTracking(): Promise<boolean> {
    stopAll(); // 중복 구독 방지
    timer.current = setInterval(() => {
      if (phaseRef.current === "running") setElapsed(calcElapsed());
    }, 1000);

    const bgOk = await startBackgroundTask();
    setBgActive(bgOk);
    if (bgOk) return true;

    // 백그라운드 실패(권한·기기 미지원 등) — 화면을 켜둔 채로는 계속 러닝할 수 있게 폴백.
    // ⚠️ 이 경로면 화면 OFF에서 추적이 끊긴다 — S5 조사에 남긴 알려진 한계.
    const foreSub = await startForegroundWatch();
    if (foreSub) {
      sub.current = foreSub;
      return true;
    }
    stopAll();
    return false;
  }

  function pause() {
    setPhase("paused");
    accumulatedSec.current = calcElapsed(); // 지금까지 구간을 확정 — resume 전까지 이 값 유지
    setElapsed(accumulatedSec.current); // 화면·저장값을 이 확정치와 정확히 맞춘다(다음 tick까지 최대 1초 기다리지 않음)
    pauseTracking(); // 재앵커 + 상승고도 확정(모듈 쪽 상태)
  }
  function resume() {
    runStartedAt.current = Date.now(); // 새 구간 시작 — calcElapsed가 여기부터 다시 잰다
    resumeTracking();
    setPhase("running");
  }

  async function finish() {
    stopAll();
    const km = distanceM / 1000;
    if (km < 0.01 || elapsed < 3) {
      // 기록할 게 없음
      void stopBackgroundTask();
      reset();
      setPhase("idle");
      onClose(false);
      return;
    }
    setPhase("saving");
    const sid = String(startedAt.current || Date.now()); // 멱등 upsert 키 = runs 문서 id의 sourceId
    const startMs = startedAt.current || Date.now();
    const gain = settleGain();
    try {
      await saveRun({
        source: "gps",
        sourceId: sid, // 재탭·재시도 시 중복 저장 방지
        name: name.trim() || "익명",
        distanceKm: km,
        durationSec: elapsed,
        startedAt: startMs,
        elevationGainM: gain || undefined, // 평지면 0 → 저장 안 함(문서 경량·타일 숨김)
      });
      // 완주 경로를 이 기기에만 저장(서버 미저장) → 상세 페이지 지도용. 문서 id(gps_<sid>)와 키를 맞춤.
      await saveRunPath(`gps_${sid}`, path);
      // 여기서 닫지 않는다 — 결과 요약을 보여준 뒤 [확인]에서 닫는다(Phase 주석 참조).
      // 경로는 `reset()`이 지우므로 요약이 쓸 사본을 먼저 떠둔다.
      setResult({ id: `gps_${sid}`, km, sec: elapsed, gain, startedAt: startMs, path });
      stopTracking();
      void stopBackgroundTask();
      setPhase("done");
    } catch {
      setErr("저장에 실패했어요. '계속'으로 이어 달리거나, 다시 [종료·저장]으로 재시도할 수 있어요.");
      accumulatedSec.current = elapsed; // 지금까지 잰 시간은 확정(재개 시 이어서)
      pauseTracking(); // 재앵커 + 상승고도 확정(중단된 사이 위치가 크게 변했을 수 있으니)
      await armTracking(); // 트래킹을 되살려 '계속'이 실제로 이어 달리게 한다(거리·시간 유실 방지)
      setPhase("paused");
    }
  }

  function cancel() {
    stopAll();
    stopTracking();
    void stopBackgroundTask();
    reset();
    setPhase("idle");
    onClose(false);
  }

  /** 요약을 닫고 러닝 모달을 끝낸다. 여기서 비로소 상태를 비운다. */
  function doneAndClose() {
    reset();
    setResult(null);
    setPhase("idle");
    onClose(true);
  }

  const km = distanceM / 1000;

  // ── 결과 요약 (저장 완료 후) ─────────────────────────────────────────
  if (phase === "done" && result) {
    const hasPath = result.path.length > 1;
    // 공유 카드가 기대하는 Row 모양으로 맞춘다 — 방금 저장한 문서와 같은 값이라
    // 목록에서 열었을 때와 카드가 정확히 같은 숫자를 보여준다.
    const runRow = {
      id: result.id,
      source: "gps",
      name: name.trim() || "익명",
      distanceKm: result.km,
      durationSec: result.sec,
      startedAt: result.startedAt,
      ...(result.gain ? { elevationGainM: result.gain } : {}),
    } as Row;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={doneAndClose}
        statusBarTranslucent>
        <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
          <View style={styles.doneTop}>
            <Text style={styles.doneEyebrow}>러닝 완료</Text>
            <Text style={styles.doneTitle}>수고했어요!</Text>
          </View>

          {/* 방금 그린 그림 — 경로가 있으면 지도를, 없으면(실내·신호 불량) 자리를 비운다. */}
          {hasPath && (
            <View style={styles.doneMap}>
              <RunMap ref={mapRef} path={result.path} follow={false} />
            </View>
          )}

          <View style={styles.doneHero}>
            <Text style={styles.doneLabel}>이번 러닝 거리</Text>
            <View style={styles.doneNumRow}>
              <Text style={styles.doneNum}>{result.km.toFixed(2)}</Text>
              <Text style={styles.doneUnit}>km</Text>
            </View>
          </View>

          <View style={styles.doneStats}>
            <View style={styles.doneStat}>
              <Text style={styles.doneStatLab}>시간</Text>
              <Text style={styles.doneStatVal}>{fmtDuration(result.sec)}</Text>
            </View>
            <View style={styles.doneStat}>
              <Text style={styles.doneStatLab}>평균 페이스</Text>
              {/* ⚠️ numberOfLines={1} 필수 — 값과 단위가 중첩 Text라 좁은 칸에서 단위만 다음 줄로
                  떨어진다(실기기: "77'53" /" + "km"으로 갈렸다). 느린 페이스일수록 길어진다. */}
              <Text style={styles.doneStatVal} numberOfLines={1}>
                {paceLabel(result.km, result.sec).replace("/km", "")}
                <Text style={styles.doneStatUnit}> /km</Text>
              </Text>
            </View>
            {/* 반올림해서 0이면 숨긴다 — "0 m"는 정보가 아니라 잡음이다(러닝 상세와 같은 규칙).
                gain이 0.3처럼 작은 값이면 `!!gain`은 통과하지만 화면엔 0이 찍힌다. */}
            {Math.round(result.gain) > 0 && (
              <View style={styles.doneStat}>
                <Text style={styles.doneStatLab}>상승고도</Text>
                <Text style={styles.doneStatVal} numberOfLines={1}>
                  {Math.round(result.gain)}
                  <Text style={styles.doneStatUnit}> m</Text>
                </Text>
              </View>
            )}
          </View>

          {/* 배지 축하와 같은 문법 — 주 액션은 [확인] 하나, 공유는 톤온톤 보조. */}
          <View style={styles.doneActions}>
            <Pressable
              style={styles.doneShare}
              hitSlop={8}
              onPress={async () => {
                // 화면에 떠 있는 지도를 그대로 찍어 카드에 넣는다. 실패해도 카드는
                // 벡터 경로로 그려지므로 공유 자체는 막지 않는다.
                setMapShot(await mapRef.current?.snapshot().catch(() => null) ?? null);
                setSharing(true);
              }}>
              <Icon name="share" size={17} color={Brand.brandDeep} />
              <Text style={styles.doneShareText}>자랑하기</Text>
            </Pressable>
            <Pressable style={styles.donePrimary} onPress={doneAndClose} hitSlop={8}>
              <Text style={styles.donePrimaryText}>확인</Text>
            </Pressable>
          </View>

          <ShareSheet
            visible={sharing}
            onClose={() => setSharing(false)}
            subject={{ kind: "run", run: runRow, path: result.path }}
            mapImage={mapShot}
          />
        </SafeAreaView>
      </Modal>
    );
  }

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
          <RunMap path={path} center={here} />
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
        {(phase === "running" || phase === "paused") && (
          <Text style={styles.hint}>
            {bgActive
              ? "화면을 꺼도 계속 기록돼요. 기기 배터리 절약 설정에 따라 중간에 멈출 수 있어요."
              : "화면을 켜 둔 채로 달려주세요."}
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
              {/* 위계 교정: [계속]이 골드, [종료·저장]이 블루 솔리드였다 —
                  ①골드는 순위·챌린지·성과 전용이라 액션 버튼에 쓰면 규칙이 깨진다
                  ②둘 다 솔리드라 위계가 없는데, 되돌릴 수 없는 쪽(종료)이 더 눈에 띄었다.
                  → 이어 달리기를 주 액션(블루 솔리드·더 넓게), 종료는 톤온톤으로 신중하게. */}
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
                <Icon name="stop" size={18} color={Brand.brandDeep} />
                <Text style={styles.ctrlStopText}>
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
    fontSize: 12, lineHeight: leading(12), fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  who: { fontFamily: FONT,
    fontSize: 15, lineHeight: leading(15), color: Brand.soft, fontWeight: Weight.regular },
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
  bigNum: { fontSize: 48, lineHeight: leading(48), fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -1.5, fontFamily: mono },
  // 전역 규칙: 숫자=본문색 + 단위=브랜드 블루. 트래킹 화면의 주인공 숫자 옆 단위가
  // 회색이라 다른 화면(홈·러닝·랭킹·상세)과 갈려 있었다.
  bigUnit: { fontFamily: FONT,
    fontSize: 18, fontWeight: Weight.bold, color: Brand.brand, marginBottom: 8, marginLeft: 5 },
  // 카드는 그림자로 띄운다 — 테두리만 두르면 납작하다(전역 규칙).
  stats: {
    flexDirection: "row",
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    paddingVertical: 18,
    alignItems: "center",
    ...Shadow.soft,
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statDiv: { width: 1, alignSelf: "stretch", backgroundColor: Brand.line2, marginVertical: 6 },
  statNum: { fontSize: 21, lineHeight: leading(21), fontWeight: Weight.bold, color: Brand.ink, fontFamily: mono },
  statLab: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.soft, fontWeight: Weight.regular },
  err: { color: Brand.brandDeep, fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), textAlign: "center", marginTop: 14, fontWeight: Weight.regular },
  hint: { color: Brand.faint, fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), textAlign: "center", marginTop: 14 },
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
    fontSize: 17, lineHeight: leading(17) },
  ctrlPause: { backgroundColor: Brand.warm, borderWidth: 1, borderColor: Brand.line2 },
  ctrlPauseText: { color: Brand.ink, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 17, lineHeight: leading(17) },
  pausedRow: { flexDirection: "row", gap: 12 },
  ctrlResume: { flex: 1.4, backgroundColor: Brand.brand },
  ctrlStop: { flex: 1, backgroundColor: Brand.brandSoft },
  ctrlStopText: { color: Brand.brandDeep, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 17, lineHeight: leading(17) },

  // ── 결과 요약 ─────────────────────────────────────────────────────
  doneTop: { paddingTop: 8, paddingBottom: 14, alignItems: "center" },
  doneEyebrow: { fontFamily: FONT, fontSize: 12, fontWeight: Weight.bold, letterSpacing: 2, color: Brand.accent },
  doneTitle: { fontFamily: FONT, fontSize: 24, lineHeight: leading(24), fontWeight: Weight.bold, color: Brand.ink, marginTop: 4 },
  // 지도가 요약의 주인공이다 — 방금 그린 그림을 보러 목록까지 들어가지 않아도 되게.
  doneMap: { flex: 1, minHeight: 180, borderRadius: Radius.card, overflow: "hidden", marginBottom: 16 },
  doneHero: { alignItems: "center" },
  doneLabel: { fontFamily: FONT, fontSize: 13, lineHeight: leading(13), color: Brand.soft },
  doneNumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 2 },
  doneNum: { fontFamily: FONT_DISPLAY, fontSize: 54, lineHeight: 58, color: Brand.ink, letterSpacing: -1.5 },
  doneUnit: { fontFamily: FONT, fontSize: 22, fontWeight: Weight.bold, color: Brand.brand, marginLeft: 6, marginBottom: 8 },
  doneStats: { flexDirection: "row", marginTop: 16, marginBottom: 20 },
  doneStat: { flex: 1, alignItems: "center", gap: 3 },
  doneStatLab: { fontFamily: FONT, fontSize: 12, color: Brand.soft },
  doneStatVal: { fontFamily: FONT, fontSize: 20, fontWeight: Weight.bold, color: Brand.ink },
  doneStatUnit: { fontFamily: FONT, fontSize: 13, fontWeight: Weight.bold, color: Brand.brand },
  doneActions: { flexDirection: "row", gap: 10, paddingBottom: 10 },
  doneShare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    flex: 1,
    minHeight: 54,
    borderRadius: Radius.card,
    backgroundColor: Brand.brandSoft,
  },
  doneShareText: { fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold, color: Brand.brandDeep },
  donePrimary: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 54,
    borderRadius: Radius.card,
    backgroundColor: Brand.brand,
  },
  donePrimaryText: { fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold, color: "#fff" },
});
