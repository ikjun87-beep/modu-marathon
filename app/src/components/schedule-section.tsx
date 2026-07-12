/** 모임 참석 체크 — 웹의 schedule/attendance와 동일 이벤트·컬렉션 공유. */
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Brand } from "@/lib/brand";
import { add, remove, subscribe, type Row } from "@/lib/crew";
import { EVENTS } from "@/lib/events";
import { COLLECTIONS } from "@/lib/firebase";

export function ScheduleSection({ myName }: { myName: string }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => subscribe(COLLECTIONS.attendance, setRows), []);

  function toggle(eventId: string) {
    if (!myName.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏");
      return;
    }
    const mine = rows.find((a) => a.eventId === eventId && a.name === myName);
    if (mine) void remove(COLLECTIONS.attendance, mine.id);
    else void add(COLLECTIONS.attendance, { eventId, name: myName.trim() });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h}>다가오는 모임 · 참석체크</Text>
      {EVENTS.map((ev) => {
        const list = rows.filter((a) => a.eventId === ev.id);
        const mine = list.some((a) => a.name === myName);
        const names = list.map((a) => a.name).join(", ") || "아직 없음";
        return (
          <View key={ev.id} style={styles.row}>
            <View style={styles.date}>
              <Text style={styles.dm}>{ev.m}</Text>
              <Text style={styles.dd}>{ev.d}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{ev.title}</Text>
              <Text style={styles.desc}>{ev.desc}</Text>
              <Text style={styles.att}>
                <Text style={styles.cnt}>{list.length}명</Text> · {names}
              </Text>
            </View>
            <Pressable
              style={[styles.btn, mine && styles.btnOn]}
              onPress={() => toggle(ev.id)}
            >
              <Text style={[styles.btnText, mine && styles.btnTextOn]}>
                {mine ? "취소" : "참석"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  h: { fontSize: 15, fontWeight: "800", color: Brand.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  date: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  dm: { color: "#fff", fontSize: 10, fontWeight: "700" },
  dd: { color: "#fff", fontSize: 20, fontWeight: "900", lineHeight: 22 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: Brand.ink },
  desc: { fontSize: 12.5, color: Brand.soft, marginTop: 2 },
  att: { fontSize: 12, color: Brand.soft, marginTop: 4 },
  cnt: { color: Brand.accent, fontWeight: "800" },
  btn: {
    backgroundColor: Brand.accent,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btnOn: { backgroundColor: "#bfe3d8" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  btnTextOn: { color: "#0c5a44" },
});
