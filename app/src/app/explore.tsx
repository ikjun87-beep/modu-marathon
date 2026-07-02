/** 러닝 기록 — 거리·시간 수동 입력, 페이스 자동 계산. runs 컬렉션(웹과 공유 스키마). */
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NameField } from "@/components/name-field";
import { Brand } from "@/lib/brand";
import { add, fmtDate, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";

/** 페이스(분/km) → "5'30\"/km" */
function paceLabel(distanceKm: number, durationMin: number): string {
  if (!distanceKm || distanceKm <= 0) return "-";
  const p = durationMin / distanceKm;
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  const ss = s === 60 ? "00" : String(s).padStart(2, "0");
  const mm = s === 60 ? m + 1 : m;
  return `${mm}'${ss}"/km`;
}

export default function RunScreen() {
  const [name, setName] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [runs, setRuns] = useState<Row[]>([]);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);

  const totalKm = useMemo(
    () => runs.reduce((a, r) => a + (Number(r.distanceKm) || 0), 0),
    [runs]
  );

  async function submit() {
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏");
      return;
    }
    const km = parseFloat(distance);
    const min = parseFloat(duration);
    if (!(km > 0) || !(min > 0)) {
      Alert.alert("거리(km)와 시간(분)을 숫자로 입력해 주세요");
      return;
    }
    await add(COLLECTIONS.runs, {
      name: name.trim(),
      distanceKm: km,
      durationMin: min,
    });
    setDistance("");
    setDuration("");
  }

  function onDelete(id: string) {
    Alert.alert("이 기록을 삭제할까요?", "", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => void remove(COLLECTIONS.runs, id),
      },
    ]);
  }

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.eyebrow}>RUNNING LOG</Text>
        <Text style={styles.title}>러닝 기록</Text>
        <Text style={styles.sub}>
          누적 <Text style={{ color: Brand.brand, fontWeight: "900" }}>{totalKm.toFixed(1)}km</Text> · 기록 {runs.length}개
        </Text>

        {!HAS_FIREBASE && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              ⚙️ Firebase 미설정 — 이 기기에만 저장됩니다.
            </Text>
          </View>
        )}

        <NameField onName={setName} />

        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <View style={styles.field}>
              <Text style={styles.formLabel}>거리 (km)</Text>
              <TextInput
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
                placeholder="5"
                placeholderTextColor={Brand.soft}
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
                placeholderTextColor={Brand.soft}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Pressable style={styles.btn} onPress={submit}>
            <Text style={styles.btnText}>기록 추가 🏃</Text>
          </Pressable>
        </View>
      </View>
    ),
    [distance, duration, name, runs.length, totalKm]
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
          <Text style={styles.empty}>아직 러닝 기록이 없어요. 첫 기록을 남겨보세요! 🏃</Text>
        }
        renderItem={({ item }) => {
          const km = Number(item.distanceKm) || 0;
          const min = Number(item.durationMin) || 0;
          return (
            <View style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.who}>{item.name}</Text>
                <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
              </View>
              <View style={styles.stats}>
                <Text style={styles.stat}>
                  <Text style={styles.statNum}>{km}</Text> km
                </Text>
                <Text style={styles.stat}>
                  <Text style={styles.statNum}>{min}</Text> 분
                </Text>
                <Text style={styles.pace}>{paceLabel(km, min)}</Text>
              </View>
              <Pressable style={styles.del} onPress={() => onDelete(item.id)}>
                <Text style={styles.delText}>✕</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 120 },
  header: { gap: 12, marginBottom: 4 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 3, color: Brand.brand },
  title: { fontSize: 34, fontWeight: "900", color: Brand.ink },
  sub: { fontSize: 14, color: Brand.soft },
  banner: {
    backgroundColor: "#fff4e6",
    borderWidth: 1,
    borderColor: "#f4d6a8",
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
  formRow: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 6 },
  formLabel: { fontSize: 13, fontWeight: "700", color: Brand.ink },
  input: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Brand.ink,
  },
  btn: {
    backgroundColor: Brand.brand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  empty: { color: Brand.soft, fontSize: 14, textAlign: "center", paddingVertical: 24 },
  item: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 14,
    padding: 15,
  },
  itemHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  who: { fontWeight: "800", fontSize: 14, color: Brand.ink },
  date: { fontSize: 12, color: Brand.soft },
  stats: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
  stat: { fontSize: 14, color: Brand.soft },
  statNum: { fontSize: 18, fontWeight: "900", color: Brand.ink },
  pace: {
    marginLeft: "auto",
    fontSize: 13,
    fontWeight: "800",
    color: Brand.accent,
  },
  del: { position: "absolute", top: 10, right: 12, padding: 4 },
  delText: { color: "#c9ced4", fontSize: 15 },
});
