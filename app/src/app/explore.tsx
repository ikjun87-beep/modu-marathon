/**
 * 러닝 — 오늘 뛴 거리 + 실시간 GPS 트래킹 + 갤럭시워치(Health Connect) 불러오기 + 수동 기록.
 * 통합 Run 스키마(runs 컬렉션, 웹과 공유). 홈페이지(web/index.html)와 같은 아이콘·색·카드 형태.
 */
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icon";
import { LiveRunModal } from "@/components/live-run";
import { NameField } from "@/components/name-field";
import { Brand } from "@/lib/brand";
import { fmtDate, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";
import { hasHealthConsent, setHealthConsent } from "@/lib/health-consent";
import { HC_SUPPORTED, syncTodayRuns } from "@/lib/healthconnect";
import { fmtDuration, paceLabel, saveRun, todayKm } from "@/lib/run";

function runSeconds(r: Row): number {
  return Number(r.durationSec) || (Number(r.durationMin) || 0) * 60;
}
function sourceIcon(src?: string): IconName {
  if (src === "gps") return "run";
  if (src === "healthconnect" || src === "garmin") return "watch";
  return "plus";
}
function sourceLabel(src?: string): string {
  if (src === "gps") return "GPS 러닝";
  if (src === "healthconnect") return "갤럭시워치";
  if (src === "garmin") return "가민";
  return "직접 입력";
}

export default function RunScreen() {
  const [name, setName] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [runs, setRuns] = useState<Row[]>([]);
  const [live, setLive] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);

  const totalKm = useMemo(
    () => runs.reduce((a, r) => a + (Number(r.distanceKm) || 0), 0),
    [runs]
  );
  const today = useMemo(() => todayKm(runs, name || undefined), [runs, name]);

  async function submitManual() {
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요");
      return;
    }
    const km = parseFloat(distance);
    const min = parseFloat(duration);
    if (!(km > 0) || !(min > 0)) {
      Alert.alert("거리(km)와 시간(분)을 숫자로 입력해 주세요");
      return;
    }
    await saveRun({ source: "manual", name: name.trim(), distanceKm: km, durationSec: min * 60 });
    setDistance("");
    setDuration("");
  }

  async function syncWatch() {
    if (syncing) return; // 이중 실행 방지 — 동의창이 떠 있는 동안 재탭 차단(네이티브 중복 호출 방지)
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요");
      return;
    }
    if (!HC_SUPPORTED) {
      Alert.alert(
        "갤럭시워치 연동",
        "워치 자동 연동은 안드로이드 실기기(dev build)에서 열려요. 폰에 Health Connect 설치 + 삼성헬스 동기화가 필요합니다."
      );
      return;
    }
    setSyncing(true); // 흐름 시작 즉시 잠금(동의창 표시 중에도 버튼 비활성)
    // 심박은 민감정보(건강) — 별도 동의가 있을 때만 함께 수집. 최초 1회 명시 동의.
    const consented = await hasHealthConsent();
    if (consented) {
      await runWatchSync(true);
      return;
    }
    Alert.alert(
      "건강정보 수집 동의",
      "워치 러닝을 불러올 때 심박 등 건강정보(민감정보)를 함께 저장하려면 별도 동의가 필요해요. 동의하지 않아도 거리·시간·페이스는 불러올 수 있어요.",
      [
        { text: "취소", style: "cancel", onPress: () => setSyncing(false) },
        { text: "심박 없이 불러오기", onPress: () => void runWatchSync(false) },
        {
          text: "동의하고 불러오기",
          onPress: async () => {
            await setHealthConsent(true);
            await runWatchSync(true);
          },
        },
      ],
      { onDismiss: () => setSyncing(false) }
    );
  }

  async function runWatchSync(withHeartRate: boolean) {
    setSyncing(true);
    try {
      const r = await syncTodayRuns(name.trim(), { readHeartRate: withHeartRate });
      Alert.alert(
        r.ok ? "워치 동기화 완료" : "워치 동기화",
        r.reason ?? `오늘 러닝 ${r.synced}개 · ${r.totalKm.toFixed(2)}km 불러왔어요`
      );
    } finally {
      setSyncing(false);
    }
  }

  function onDelete(id: string) {
    Alert.alert("이 기록을 삭제할까요?", "", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => void remove(COLLECTIONS.runs, id) },
    ]);
  }

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Icon name="activity" size={15} color={Brand.brand} />
          <Text style={styles.eyebrow}>RUNNING</Text>
        </View>
        <Text style={styles.title}>러닝 기록</Text>

        {/* 오늘 뛴 거리 — 실시간 집계 */}
        <View style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={styles.todayLab}>오늘 뛴 거리</Text>
            <View style={styles.todayNumRow}>
              <Text style={styles.todayNum}>{today.toFixed(2)}</Text>
              <Text style={styles.todayUnit}>km</Text>
            </View>
          </View>
          <View style={styles.todayDiv} />
          <View style={styles.todayMeta}>
            <Text style={styles.todayMetaNum}>{totalKm.toFixed(1)}km</Text>
            <Text style={styles.todayMetaLab}>누적</Text>
            <Text style={[styles.todayMetaNum, { marginTop: 8 }]}>{runs.length}</Text>
            <Text style={styles.todayMetaLab}>기록</Text>
          </View>
        </View>

        {/* 실시간 GPS + 워치 불러오기 */}
        <View style={styles.ctaRow}>
          <Pressable style={[styles.cta, styles.ctaPrimary]} onPress={() => setLive(true)}>
            <Icon name="play" size={20} color="#fff" />
            <Text style={styles.ctaPrimaryText}>러닝 시작</Text>
          </Pressable>
          <Pressable style={[styles.cta, styles.ctaSecondary]} onPress={syncWatch} disabled={syncing}>
            <Icon name="watch" size={20} color={Brand.ink} />
            <Text style={styles.ctaSecondaryText}>
              {syncing ? "불러오는 중…" : "워치 불러오기"}
            </Text>
          </Pressable>
        </View>
        {!HC_SUPPORTED && (
          <Text style={styles.watchHint}>
            갤럭시워치 자동 연동은 안드로이드 dev build에서 열려요.
          </Text>
        )}

        {!HAS_FIREBASE && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Firebase 미설정 — 이 기기에만 저장됩니다.</Text>
          </View>
        )}

        <NameField onName={setName} />

        {/* 수동 기록 */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>직접 입력</Text>
          <View style={styles.formRow}>
            <View style={styles.field}>
              <Text style={styles.formLabel}>거리 (km)</Text>
              <TextInput
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
                placeholder="5"
                placeholderTextColor={Brand.faint}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.formLabel}>시간 (분)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                placeholderTextColor={Brand.faint}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Pressable style={styles.addBtn} onPress={submitManual}>
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>기록 추가</Text>
          </Pressable>
        </View>

        <Text style={styles.listTitle}>지난 러닝</Text>
      </View>
    ),
    [distance, duration, name, runs.length, totalKm, today, syncing]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={runs}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>아직 러닝 기록이 없어요. 러닝을 시작해 보세요!</Text>
        }
        renderItem={({ item }) => {
          const km = Number(item.distanceKm) || 0;
          const sec = runSeconds(item);
          return (
            <View style={styles.item}>
              <View style={styles.itemHead}>
                <View style={styles.srcBadge}>
                  <Icon name={sourceIcon(item.source)} size={15} color={Brand.brandDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.who}>{item.name}</Text>
                  <Text style={styles.date}>
                    {sourceLabel(item.source)} · {fmtDate(item.startedAt ?? item.createdAt)}
                  </Text>
                </View>
                <Pressable style={styles.del} onPress={() => onDelete(item.id)} hitSlop={8}>
                  <Icon name="trash" size={17} color={Brand.faint} />
                </Pressable>
              </View>
              <View style={styles.stats}>
                <Text style={styles.stat}>
                  <Text style={styles.statNum}>{km.toFixed(2)}</Text> km
                </Text>
                <Text style={styles.stat}>
                  <Text style={styles.statNum}>{fmtDuration(sec)}</Text>
                </Text>
                <Text style={styles.pace}>{paceLabel(km, sec)}</Text>
                {item.avgHr ? (
                  <Text style={styles.hr}>♥ {Math.round(Number(item.avgHr))}</Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
      <LiveRunModal
        visible={live}
        name={name}
        onClose={(saved) => {
          setLive(false);
          if (saved) Alert.alert("러닝 완료", "오늘 기록이 저장됐어요! 🎉");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 140 },
  header: { gap: 14, marginBottom: 4 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 3, color: Brand.brand },
  title: { fontSize: 34, fontWeight: "900", color: Brand.ink, letterSpacing: -0.8, marginTop: -6 },

  todayCard: {
    flexDirection: "row",
    backgroundColor: Brand.dark,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  todayLeft: { flex: 1 },
  todayLab: { color: "#aab2bb", fontSize: 13, fontWeight: "600" },
  todayNumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  todayNum: { color: "#fff", fontSize: 46, fontWeight: "900", letterSpacing: -1.5, lineHeight: 48 },
  todayUnit: { color: Brand.brand, fontSize: 20, fontWeight: "800", marginLeft: 5, marginBottom: 6 },
  todayDiv: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,.12)",
    marginHorizontal: 18,
  },
  todayMeta: { alignItems: "flex-end" },
  todayMetaNum: { color: "#fff", fontSize: 16, fontWeight: "800" },
  todayMetaLab: { color: "#8b929b", fontSize: 11, fontWeight: "600" },

  ctaRow: { flexDirection: "row", gap: 10 },
  cta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    paddingVertical: 15,
    minHeight: 52,
  },
  ctaPrimary: { backgroundColor: Brand.brand },
  ctaPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  ctaSecondary: { backgroundColor: Brand.card, borderWidth: 1, borderColor: Brand.line2 },
  ctaSecondaryText: { color: Brand.ink, fontWeight: "800", fontSize: 15 },
  watchHint: { color: Brand.faint, fontSize: 12, marginTop: -6 },

  banner: {
    backgroundColor: "#fff6ec",
    borderWidth: 1,
    borderColor: "#f2ddbe",
    borderRadius: 12,
    padding: 12,
  },
  bannerText: { color: "#7a4a0a", fontSize: 12.5, fontWeight: "600" },

  formCard: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  formTitle: { fontSize: 14, fontWeight: "800", color: Brand.ink },
  formRow: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 6 },
  formLabel: { fontSize: 13, fontWeight: "700", color: Brand.ink2 },
  input: {
    borderWidth: 1,
    borderColor: Brand.line2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Brand.ink,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Brand.brand,
    borderRadius: 11,
    paddingVertical: 13,
    minHeight: 48,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  listTitle: { fontSize: 15, fontWeight: "800", color: Brand.ink, marginTop: 4 },
  empty: { color: Brand.soft, fontSize: 14, textAlign: "center", paddingVertical: 24 },

  item: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    padding: 15,
  },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  srcBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  who: { fontWeight: "800", fontSize: 14.5, color: Brand.ink },
  date: { fontSize: 12, color: Brand.soft, marginTop: 1 },
  del: { padding: 4 },
  stats: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 },
  stat: { fontSize: 13.5, color: Brand.soft },
  statNum: { fontSize: 18, fontWeight: "900", color: Brand.ink },
  pace: { marginLeft: "auto", fontSize: 13, fontWeight: "800", color: Brand.accent },
  hr: { fontSize: 13, fontWeight: "700", color: Brand.brandDeep },
});
