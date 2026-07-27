/**
 * CommentThread — 러닝 기록·방명록 등에 다는 댓글. parentId로 묶인다.
 * comments 컬렉션 구독(전체) → parentId로 필터. 데모 댓글도 함께 표시(demo.ts).
 */
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius, Shadow } from "@/lib/brand";
import { add, fmtDate, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { useMyName } from "@/lib/session";
import { toMs } from "@/lib/run";

export function CommentThread({ parentId }: { parentId: string }) {
  const [all, setAll] = useState<Row[]>([]);
  const [name] = useMyName(); // 개명 시 새 댓글이 새 이름으로 달린다
  const [msg, setMsg] = useState("");

  useEffect(() => subscribe(COLLECTIONS.comments, setAll), []);

  const comments = useMemo(
    () =>
      all
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt)),
    [all, parentId]
  );

  async function send() {
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏", "‘마이’ 탭에서 이름을 설정할 수 있어요.");
      return;
    }
    if (!msg.trim()) return;
    await add(COLLECTIONS.comments, { parentId, name: name.trim(), msg: msg.trim() });
    setMsg("");
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h}>댓글 {comments.length}</Text>

      {comments.map((c) => (
        <View key={c.id} style={styles.item}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(c.name?.trim()?.[0] ?? "·").toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.itemHead}>
              <Text style={styles.who}>{c.name}</Text>
              <Text style={styles.date}>{fmtDate(c.createdAt)}</Text>
            </View>
            <Text style={styles.msg}>{c.msg}</Text>
          </View>
        </View>
      ))}
      {comments.length === 0 && (
        <Text style={styles.empty}>첫 댓글을 남겨보세요!</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={msg}
          onChangeText={setMsg}
          placeholder="따뜻한 한마디 남기기"
          placeholderTextColor={Brand.placeholder}
          maxLength={200}
          multiline
        />
        <PressableScale style={[styles.send, !msg.trim() && styles.sendOff]} onPress={send}>
          <Icon name="chat" size={16} color="#fff" />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 카드는 그림자로 띄운다 — 1px 테두리만 두르면 와이어프레임처럼 납작해, 바로 위
  // 스탯 타일(Shadow.soft)과 같은 카드인데 다르게 보였다(전역 규칙 · 실기기 확인).
  wrap: {
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
    ...Shadow.soft,
  },
  h: { fontFamily: FONT,
    fontSize: 14.5, fontWeight: Weight.bold, color: Brand.ink },
  item: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Brand.brandDeep, fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  who: { fontFamily: FONT,
    fontSize: 13.5, fontWeight: Weight.bold, color: Brand.ink },
  date: { fontFamily: FONT,
    fontSize: 11.5, color: Brand.faint },
  msg: { fontFamily: FONT,
    fontSize: 13.5, color: Brand.ink2, marginTop: 2, lineHeight: 19 },
  empty: { fontFamily: FONT,
    fontSize: 13, color: Brand.soft, paddingVertical: 4 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONT,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 42,
    maxHeight: 100,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: Radius.input,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  sendOff: { backgroundColor: Brand.brandLine },
});
