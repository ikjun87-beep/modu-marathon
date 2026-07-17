/** 모임 만들기 시트 — 제목·설명·날짜를 받아 events에 저장(lib/events.createEvent).
 *  날짜는 네이티브 피커 의존 없이 년/월/일 숫자 입력 + 빠른 선택(오늘/내일/이번주말)으로.
 *  지금은 아무나 만들 수 있다(친목 수준 — pre-Auth). uid는 crew.add가 곁들인다. */
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { createEvent } from "@/lib/events";

function atMidnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}
function nextSaturday(): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d;
}
function fmt(ms: number): string {
  const d = new Date(ms);
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${wd})`;
}

type Props = { visible: boolean; myName: string; onClose: () => void };

export function EventComposer({ visible, myName, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startAt, setStartAt] = useState<number>(() => atMidnight(nextSaturday()));
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle(""); setDesc(""); setStartAt(atMidnight(nextSaturday()));
  }

  async function save() {
    if (!myName.trim()) { Alert.alert("이름을 먼저 입력해 주세요 🙏"); return; }
    if (!title.trim()) { Alert.alert("모임 이름을 입력해 주세요"); return; }
    if (startAt < atMidnight(new Date())) { Alert.alert("지난 날짜에는 모임을 만들 수 없어요"); return; }
    setSaving(true);
    try {
      await createEvent({ title, desc, startAt, name: myName });
      reset();
      onClose();
    } catch {
      Alert.alert("모임을 만들지 못했어요", "잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  // 날짜 ±1일 조정(간단·안전 — 네이티브 피커 없이)
  const shiftDay = (n: number) => setStartAt((ms) => atMidnight(new Date(ms + n * 86400000)));

  const QUICK: { label: string; at: () => number }[] = [
    { label: "이번 주말", at: () => atMidnight(nextSaturday()) },
    { label: "내일", at: () => atMidnight(new Date(Date.now() + 86400000)) },
    { label: "다음 주말", at: () => atMidnight(new Date(nextSaturday().getTime() + 7 * 86400000)) },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.top}>
          <Text style={styles.topTitle}>모임 만들기</Text>
          <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color={Brand.soft} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>모임 이름</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="예: 아침 이지런"
            placeholderTextColor={Brand.faint}
            maxLength={40}
          />

          <Text style={styles.label}>안내 (장소·시간·거리 등)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={desc}
            onChangeText={setDesc}
            placeholder="예: 올림픽공원 평화의문 앞 · 오전 8시 · 3km · 초보 환영"
            placeholderTextColor={Brand.faint}
            multiline
            maxLength={200}
          />

          <Text style={styles.label}>날짜</Text>
          <View style={styles.dateRow}>
            <PressableScale style={styles.stepBtn} onPress={() => shiftDay(-1)} dim={false}>
              <Icon name="chevron-left" size={20} color={Brand.ink} />
            </PressableScale>
            <Text style={styles.dateText}>{fmt(startAt)}</Text>
            <PressableScale style={styles.stepBtn} onPress={() => shiftDay(1)} dim={false}>
              <Icon name="chevron-right" size={20} color={Brand.ink} />
            </PressableScale>
          </View>
          <View style={styles.quickRow}>
            {QUICK.map((qk) => {
              const on = startAt === qk.at();
              return (
                <PressableScale
                  key={qk.label}
                  style={[styles.quick, on && styles.quickOn]}
                  onPress={() => setStartAt(qk.at())}
                  dim={false}>
                  <Text style={[styles.quickText, on && styles.quickTextOn]}>{qk.label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PressableScale
            style={[styles.saveBtn, saving && styles.saveBtnOff]}
            onPress={() => void save()}
            disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? "만드는 중…" : "모임 만들기"}</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  topTitle: { fontFamily: FONT, fontSize: 18, fontWeight: Weight.bold, color: Brand.ink },
  close: { padding: 4 },
  body: { padding: 18, gap: 8, paddingBottom: 40 },
  label: { fontFamily: FONT, fontSize: 13.5, fontWeight: Weight.bold, color: Brand.soft, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONT,
    color: Brand.ink,
    backgroundColor: Brand.card,
  },
  multiline: { minHeight: 76, textAlignVertical: "top" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: Radius.chip },
  dateText: { fontFamily: FONT, fontSize: 15.5, fontWeight: Weight.bold, color: Brand.ink },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  quick: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.card,
  },
  quickOn: { borderColor: Brand.brand, backgroundColor: Brand.brandSoft },
  quickText: { fontFamily: FONT, fontSize: 13, color: Brand.soft, fontWeight: Weight.bold },
  quickTextOn: { color: Brand.brandDeep },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Brand.line },
  saveBtn: { backgroundColor: Brand.brand, borderRadius: Radius.input, paddingVertical: 15, alignItems: "center" },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold },
});
