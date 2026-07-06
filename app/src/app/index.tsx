/** 홈 · 크루 — 방명록 피드 (웹과 동일한 guestbook 컬렉션 공유). */
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

import { GallerySection } from "@/components/gallery-section";
import { Icon } from "@/components/icon";
import { NameField } from "@/components/name-field";
import { ScheduleSection } from "@/components/schedule-section";
import { Brand } from "@/lib/brand";
import { add, fmtDate, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";

export default function CrewScreen() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [guests, setGuests] = useState<Row[]>([]);

  useEffect(() => subscribe(COLLECTIONS.guestbook, setGuests), []);

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
          <Text style={styles.eyebrow}>MODU MARATHON</Text>
        </View>
        <Text style={styles.title}>
          모두의 <Text style={{ color: Brand.brand }}>마라톤</Text>
        </Text>
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
          <Pressable style={styles.btn} onPress={submit}>
            <Icon name="chat" size={17} color="#fff" />
            <Text style={styles.btnText}>남기기</Text>
          </Pressable>
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
          <Text style={styles.empty}>아직 방명록이 없어요. 첫 글을 남겨보세요!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHead}>
              <Text style={styles.who}>{item.name}</Text>
              <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.msg}>{item.msg}</Text>
            <Pressable style={styles.del} onPress={() => onDelete(item.id)} hitSlop={8}>
              <Icon name="close" size={16} color={Brand.faint} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 120 },
  header: { gap: 12, marginBottom: 4 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 3, color: Brand.brand },
  title: { fontSize: 34, fontWeight: "900", color: Brand.ink, letterSpacing: -0.8 },
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
    gap: 8,
  },
  formLabel: { fontSize: 13, fontWeight: "700", color: Brand.ink },
  msgInput: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    borderRadius: 11,
    paddingVertical: 13,
    minHeight: 48,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  listHint: { fontSize: 12.5, color: Brand.soft, fontWeight: "600", marginTop: 4 },
  empty: { color: Brand.soft, fontSize: 14, textAlign: "center", paddingVertical: 24 },
  item: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 14,
    padding: 15,
  },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 26, // 우상단 삭제(X) 버튼과 날짜가 겹치지 않도록 여백 확보
  },
  who: { fontWeight: "800", fontSize: 14, color: Brand.ink },
  date: { fontSize: 12, color: Brand.soft },
  msg: { fontSize: 14, color: "#333", marginTop: 5, paddingRight: 20 },
  del: { position: "absolute", top: 10, right: 12, padding: 6 },
});
