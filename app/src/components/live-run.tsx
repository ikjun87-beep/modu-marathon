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
import { Brand } from "@/lib/brand";
import { fmtDuration, haversine, paceLabel, saveRun, type LatLng } from "@/lib/run";

type Props = { visible: boolean; name: string; onClose: (saved: boolean) => void };
type Phase = "idle" | "running" | "paused" | "saving";

export function LiveRunModal({ visible, name, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [distanceM, setDistanceM] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const sub = useRef<Location.LocationSubscription | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const last = useRef<LatLng | null>(null);
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

  function reset() {
    setDistanceM(0);
    setElapsed(0);
    setErr(null);
    last.current = null;
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
          if (last.current && acc <= 30) {
            const d = haversine(last.current, cur);
            // 1.5m~60m 구간만 채택 — 정지 드리프트·GPS 튐 제거
            if (d >= 1.5 && d <= 60) setDistanceM((m) => m + d);
          }
          if (acc <= 30) last.current = cur;
        }
      );
    } catch {
      setErr("위치 추적을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPhase("idle");
      stopAll();
    }
  }

  function pause() {
    setPhase("paused");
    last.current = null; // 재개 시 튐 방지
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
    try {
      await saveRun({
        source: "gps",
        name: name.trim() || "익명",
        distanceKm: km,
        durationSec: elapsed,
        startedAt: startedAt.current || Date.now(),
      });
      reset();
      setPhase("idle");
      onClose(true);
    } catch {
      setErr("저장에 실패했어요. 다시 시도해 주세요.");
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

        <View style={styles.hero}>
          <Text style={styles.bigNum}>{km.toFixed(2)}</Text>
          <Text style={styles.bigUnit}>km</Text>
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
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 3, color: Brand.brand },
  who: { fontSize: 15, color: Brand.soft, fontWeight: "600" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  bigNum: { fontSize: 96, fontWeight: "900", color: Brand.ink, letterSpacing: -3, fontFamily: mono },
  bigUnit: { fontSize: 28, fontWeight: "800", color: Brand.soft, marginBottom: 18, marginLeft: 6 },
  stats: {
    flexDirection: "row",
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statDiv: { width: 1, alignSelf: "stretch", backgroundColor: Brand.line2, marginVertical: 6 },
  statNum: { fontSize: 24, fontWeight: "900", color: Brand.ink, fontFamily: mono },
  statLab: { fontSize: 12, color: Brand.soft, fontWeight: "600" },
  err: { color: Brand.brandDeep, fontSize: 13, textAlign: "center", marginTop: 14, fontWeight: "600" },
  hint: { color: Brand.faint, fontSize: 12, textAlign: "center", marginTop: 14 },
  controls: { paddingVertical: 26 },
  ctrl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 18,
    minHeight: 60,
  },
  ctrlStart: { backgroundColor: Brand.brand },
  ctrlStartText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  ctrlPause: { backgroundColor: Brand.warm, borderWidth: 1, borderColor: Brand.line2 },
  ctrlPauseText: { color: Brand.ink, fontWeight: "800", fontSize: 17 },
  pausedRow: { flexDirection: "row", gap: 12 },
  ctrlResume: { flex: 1, backgroundColor: Brand.accent },
  ctrlStop: { flex: 1.4, backgroundColor: Brand.brand },
});
