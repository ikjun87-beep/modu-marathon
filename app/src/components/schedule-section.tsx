/** 모임 참석 체크 + **모임 만들기** — Firestore events·attendance 공유(웹과 동일).
 *  일정이 서버로 이관돼(lib/events) 회장이 코드 없이 모임을 만들 수 있다. 지난 모임은 접어서 정리. */
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { add, remove, subscribe, type Row } from "@/lib/crew";
import { isPast, subscribeEvents, type EventDef } from "@/lib/events";
import { COLLECTIONS } from "@/lib/firebase";
import { EventComposer } from "@/components/event-composer";

export function ScheduleSection({ myName }: { myName: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [events, setEvents] = useState<EventDef[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [composing, setComposing] = useState(false);

  useEffect(() => subscribe(COLLECTIONS.attendance, setRows), []);
  useEffect(() => subscribeEvents(setEvents), []);

  const { upcoming, past } = useMemo(() => {
    const up: EventDef[] = [], pa: EventDef[] = [];
    for (const e of events) (isPast(e) ? pa : up).push(e);
    return { upcoming: up, past: pa.reverse() }; // 지난 건 최근 것부터
  }, [events]);

  function toggle(ev: EventDef) {
    if (isPast(ev)) return; // 지난 모임은 참석 변경 불가
    if (!myName.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏");
      return;
    }
    const mine = rows.find((a) => a.eventId === ev.id && a.name === myName);
    if (mine) void remove(COLLECTIONS.attendance, mine.id);
    else void add(COLLECTIONS.attendance, { eventId: ev.id, name: myName.trim() });
  }

  function renderRow(ev: EventDef, dim: boolean) {
    const list = rows.filter((a) => a.eventId === ev.id);
    const mine = list.some((a) => a.name === myName);
    const names = list.map((a) => a.name).join(", ") || "아직 없음";
    return (
      <View key={ev.id} style={[styles.row, dim && styles.rowPast]}>
        <View style={[styles.date, dim && styles.datePast]}>
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
        {dim ? (
          <Text style={styles.pastTag}>지난 모임</Text>
        ) : (
          <Pressable style={[styles.btn, mine && styles.btnOn]} onPress={() => toggle(ev)}>
            <Text style={[styles.btnText, mine && styles.btnTextOn]}>{mine ? "취소" : "참석"}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.h}>다가오는 모임 · 참석체크</Text>
        <PressableScale style={styles.addBtn} onPress={() => setComposing(true)} dim={false}>
          <Icon name="plus" size={15} color="#fff" />
          <Text style={styles.addBtnText}>모임 만들기</Text>
        </PressableScale>
      </View>

      {upcoming.length ? (
        upcoming.map((ev) => renderRow(ev, false))
      ) : (
        <Text style={styles.empty}>다가오는 모임이 없어요. 첫 모임을 만들어 보세요!</Text>
      )}

      {past.length > 0 && (
        <>
          <PressableScale style={styles.pastToggle} onPress={() => setShowPast((v) => !v)} dim={false}>
            <Text style={styles.pastToggleText}>지난 모임 {past.length}개</Text>
            <Icon name={showPast ? "chevron-left" : "chevron-right"} size={16} color={Brand.soft} />
          </PressableScale>
          {showPast && past.map((ev) => renderRow(ev, true))}
        </>
      )}

      <EventComposer
        visible={composing}
        myName={myName}
        onClose={() => setComposing(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontFamily: FONT, fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Brand.brand,
    borderRadius: Radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addBtnText: { color: "#fff", fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold },
  empty: { fontFamily: FONT, fontSize: 13.5, color: Brand.soft, textAlign: "center", paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowPast: { opacity: 0.6 },
  date: {
    width: 52,
    height: 52,
    borderRadius: Radius.input,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  datePast: { backgroundColor: Brand.faint },
  dm: { color: "#fff", fontFamily: FONT, fontSize: 10, fontWeight: Weight.regular },
  dd: { color: "#fff", fontFamily: FONT, fontSize: 20, fontWeight: Weight.bold, lineHeight: 22 },
  info: { flex: 1 },
  title: { fontFamily: FONT, fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  desc: { fontFamily: FONT, fontSize: 12.5, color: Brand.soft, marginTop: 2 },
  att: { fontFamily: FONT, fontSize: 12, color: Brand.soft, marginTop: 4 },
  cnt: { color: Brand.accent, fontWeight: Weight.bold },
  btn: { backgroundColor: Brand.accent, borderRadius: Radius.card, paddingVertical: 8, paddingHorizontal: 16 },
  btnOn: { backgroundColor: Brand.brandSoft },
  btnText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT, fontSize: 13 },
  btnTextOn: { color: Brand.brandDeep },
  pastTag: { fontFamily: FONT, fontSize: 12, color: Brand.faint, fontWeight: Weight.bold },
  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    marginTop: 2,
  },
  pastToggleText: { fontFamily: FONT, fontSize: 13, color: Brand.soft, fontWeight: Weight.bold },
});
