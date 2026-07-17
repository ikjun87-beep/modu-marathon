/** 크루 — 방명록 피드 + 모임 참석 + 갤러리 (웹과 동일한 guestbook/attendance/gallery 컬렉션 공유). */
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GallerySection } from "@/components/gallery-section";
import { Icon } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { NameField } from "@/components/name-field";
import { ScheduleSection } from "@/components/schedule-section";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { add, fmtDate, isDemo, remove, subscribe, update, type Row } from "@/lib/crew";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";

export default function CrewScreen() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [guests, setGuests] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => subscribe(COLLECTIONS.guestbook, setGuests), []);

  function startEdit(item: Row) {
    setEditingId(item.id);
    setEditText(String(item.msg ?? ""));
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }
  async function saveEdit() {
    const t = editText.trim();
    if (t && editingId) await update(COLLECTIONS.guestbook, editingId, { msg: t });
    cancelEdit();
  }

  async function submit() {
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏");
      return;
    }
    if (!msg.trim()) return;
    await add(COLLECTIONS.guestbook, { name: name.trim(), msg: msg.trim() });
    setMsg("");
  }

  function onDelete(id: string) {
    Alert.alert("삭제할까요?", "", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => void remove(COLLECTIONS.guestbook, id),
      },
    ]);
  }

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Icon name="users" size={15} color={Brand.brand} />
          <Text style={styles.eyebrow}>CREW</Text>
        </View>
        <Text style={styles.title}>우리 크루</Text>
        <Text style={styles.sub}>혼자 뛰면 운동, 같이 뛰면 추억.</Text>

        {!HAS_FIREBASE && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Firebase 미설정 — 지금은 이 기기에만 저장됩니다. (.env 입력 시 크루끼리 공유)
            </Text>
          </View>
        )}

        <NameField onName={setName} />

        <ScheduleSection myName={name} />

        <GallerySection myName={name} />

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>방명록 한마디</Text>
          <TextInput
            style={styles.msgInput}
            value={msg}
            onChangeText={setMsg}
            placeholder="오늘도 화이팅! 다음 모임에 갈게요"
            placeholderTextColor={Brand.soft}
            maxLength={200}
            multiline
          />
          <PressableScale style={styles.btn} onPress={submit}>
            <Icon name="chat" size={17} color="#fff" />
            <Text style={styles.btnText}>남기기</Text>
          </PressableScale>
        </View>

        <Text style={styles.listHint}>방명록 {guests.length}개</Text>
      </View>
    ),
    [msg, name, guests.length]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={guests}
        keyExtractor={(g) => g.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Mascot size={76} />
            <Text style={styles.empty}>아직 방명록이 없어요. 첫 글을 남겨보세요!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = !!name && item.name === name && !isDemo(item.id);
          const editing = editingId === item.id;
          return (
            <View style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.who}>{item.name}</Text>
                <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
              </View>
              {editing ? (
                <View style={styles.editWrap}>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    maxLength={200}
                    autoFocus
                  />
                  <View style={styles.editBtns}>
                    <PressableScale style={styles.editCancel} onPress={cancelEdit}>
                      <Text style={styles.editCancelText}>취소</Text>
                    </PressableScale>
                    <PressableScale style={styles.editSave} onPress={saveEdit}>
                      <Text style={styles.editSaveText}>저장</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.msg}>{item.msg}</Text>
                  {mine && (
                    <PressableScale
                      style={styles.editBtn}
                      onPress={() => startEdit(item)}
                      hitSlop={6}
                      dim={false}>
                      <Text style={styles.editBtnText}>수정</Text>
                    </PressableScale>
                  )}
                  <PressableScale style={styles.del} onPress={() => onDelete(item.id)} hitSlop={8}>
                    <Icon name="close" size={16} color={Brand.faint} />
                  </PressableScale>
                </>
              )}
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
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  title: { fontFamily: FONT,
    fontSize: 34, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },
  sub: { fontFamily: FONT,
    fontSize: 14, color: Brand.soft },
  banner: {
    backgroundColor: "#fff4e6",
    borderWidth: 1,
    borderColor: "#f4d6a8",
    borderRadius: Radius.input,
    padding: 12,
  },
  bannerText: { color: "#7a4a0a", fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.regular },
  formCard: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
  },
  formLabel: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular, color: Brand.ink },
  msgInput: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 64,
    textAlignVertical: "top",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Brand.brand,
    borderRadius: Radius.input,
    paddingVertical: 13,
    minHeight: 48,
  },
  btnText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },
  listHint: { fontFamily: FONT,
    fontSize: 12.5, color: Brand.soft, fontWeight: Weight.regular, marginTop: 4 },
  emptyBox: { alignItems: "center", paddingVertical: 8 },
  empty: { color: Brand.soft, fontFamily: FONT,
    fontSize: 14, textAlign: "center", paddingVertical: 8 },
  item: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    padding: 15,
  },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 64, // 우상단 수정·삭제 버튼과 날짜가 겹치지 않도록 여백 확보
  },
  who: { fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 14, color: Brand.ink },
  date: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft },
  msg: { fontFamily: FONT,
    fontSize: 14, color: Brand.ink2, marginTop: 5, paddingRight: 20 },
  del: { position: "absolute", top: 10, right: 12, padding: 6 },
  editBtn: { position: "absolute", top: 12, right: 40, padding: 4 },
  editBtnText: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand },
  editWrap: { gap: 9, marginTop: 6 },
  editInput: {
    borderWidth: 1,
    borderColor: Brand.line2,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONT,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 56,
    textAlignVertical: "top",
  },
  editBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.chip,
    backgroundColor: Brand.warm,
  },
  editCancelText: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.bold, color: Brand.soft },
  editSave: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brand,
  },
  editSaveText: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.bold, color: "#fff" },
});
