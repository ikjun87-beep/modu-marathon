/** 모임 참석 체크 + **모임 만들기** — Firestore events·attendance 공유(웹과 동일).
 *  일정이 서버로 이관돼(lib/events) 회장이 코드 없이 모임을 만들 수 있다. 지난 모임은 접어서 정리. */
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius, Shadow } from "@/lib/brand";
import { add, remove, subscribe, type Row } from "@/lib/crew";
import { isPast, parseEventInfo, subscribeEvents, type EventDef } from "@/lib/events";
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
    const info = parseEventInfo(ev.desc);
    return (
      <View key={ev.id} style={[styles.row, dim && styles.rowPast]}>
        <View style={styles.left}>
          <View style={[styles.date, dim && styles.datePast]}>
            <Text style={styles.dm}>{ev.m}</Text>
            <Text style={styles.dd}>{ev.d}</Text>
          </View>
          {dim ? (
            <Text style={styles.pastTag}>지난</Text>
          ) : (
            <Pressable style={[styles.btn, mine && styles.btnOn]} onPress={() => toggle(ev)}>
              <Text style={[styles.btnText, mine && styles.btnTextOn]} numberOfLines={1}>{mine ? "취소" : "참석"}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{ev.title}</Text>
          {/* 핵심 3개(장소·시간·거리)를 아이콘 칩으로 크게 — 한 덩어리 본문의 빽빽함 해소 */}
          <View style={styles.chips}>
            {info.place ? (
              <View style={styles.chip}>
                <Icon name="pin" size={12} color={Brand.brandDeep} />
                <Text style={styles.chipText} numberOfLines={1}>{info.place}</Text>
              </View>
            ) : null}
            {info.time ? (
              <View style={styles.chip}>
                <Icon name="watch" size={12} color={Brand.brandDeep} />
                <Text style={styles.chipText} numberOfLines={1}>{info.time}</Text>
              </View>
            ) : null}
            {info.distance ? (
              <View style={styles.chip}>
                <Icon name="run" size={12} color={Brand.brandDeep} />
                <Text style={styles.chipText} numberOfLines={1}>{info.distance}</Text>
              </View>
            ) : null}
          </View>
          {/* 참석자를 이름 나열이 아니라 이니셜 아바타로 — 랭킹 리더보드와 같은 패턴(디자인 감사 지적). */}
          <View style={styles.attRow}>
            {list.length ? (
              <>
                <View style={styles.faces}>
                  {list.slice(0, 4).map((a, i) => (
                    <View key={a.id} style={[styles.face, i > 0 && styles.faceOverlap]}>
                      <Text style={styles.faceText}>{(a.name.trim()[0] || "?").toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.att} numberOfLines={1}>
                  <Text style={styles.cnt}>{list.length}명</Text> 참석
                  {list.length > 4 ? ` · 외 ${list.length - 4}명` : ""}
                </Text>
              </>
            ) : (
              <Text style={styles.att}>아직 참석자가 없어요</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.h} numberOfLines={1}>다가오는 모임</Text>
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
    borderRadius: Radius.card,
    padding: 14,
    gap: 10,
    ...Shadow.soft,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  h: { flex: 1, fontFamily: FONT, fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 4,
    backgroundColor: Brand.brand,
    borderRadius: Radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addBtnText: { color: "#fff", fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold },
  empty: { fontFamily: FONT, fontSize: 13.5, color: Brand.soft, textAlign: "center", paddingVertical: 14 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  rowPast: { opacity: 0.55 },
  left: { alignItems: "center", gap: 6 },
  // 날짜는 **정보**, 참석은 **액션** — 둘 다 브랜드 블루 솔리드면 무엇을 눌러야 할지 안 보인다.
  // 날짜는 히어로 카드와 같은 다크 네이비(정보 카드 톤), 블루 솔리드는 액션 전용으로 남긴다.
  date: {
    width: 52,
    height: 52,
    borderRadius: Radius.input,
    backgroundColor: Brand.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  datePast: { backgroundColor: Brand.faint },
  dm: { color: "#fff", fontFamily: FONT, fontSize: 10.5, fontWeight: Weight.regular },
  dd: { color: "#fff", fontFamily: FONT, fontSize: 21, fontWeight: Weight.bold, lineHeight: 24 },
  info: { flex: 1, gap: 7 },
  title: { fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold, color: Brand.ink },
  // 칩은 내용 길이에 따라 자연스럽게 줄바꿈되지만, 높이·좌우 여백은 항상 같게 둔다
  // (위치 칩만 유독 커 보이던 비일관 — 디자인 감사 지적).
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.chip,
    height: 28,
    paddingHorizontal: 9,
    maxWidth: "100%",
  },
  // 연하늘 배경 위 brandDeep(#1b4ea3)은 대비가 4.5:1에 아슬아슬했다 → 더 진한 네이비로 AA 확보.
  chipText: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: "#14315c", flexShrink: 1 },
  attRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  faces: { flexDirection: "row", alignItems: "center" },
  face: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.brandSoft,
    borderWidth: 1.5,
    borderColor: Brand.card,
    alignItems: "center",
    justifyContent: "center",
  },
  faceOverlap: { marginLeft: -8 }, // 겹쳐 쌓아 "여럿이 함께" 느낌
  faceText: { fontFamily: FONT, fontSize: 11, fontWeight: Weight.bold, color: Brand.brandDeep },
  att: { fontFamily: FONT, fontSize: 12.5, color: Brand.soft },
  // 골드는 **순위·챌린지·성과** 전용 시그널 — 본문 숫자에까지 쓰면 특별함이 희석된다(디자인 감사 지적).
  cnt: { color: Brand.ink2, fontWeight: Weight.bold },
  // 참석은 **상태·액션**이지 성과가 아니다 → 골드 대신 브랜드 블루(행동 유도).
  // 참석한 뒤의 [취소]는 보조 액션이라 톤온톤(btnOn).
  btn: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.chip,
    paddingVertical: 7,
    paddingHorizontal: 10,
    width: 52,
    alignItems: "center",
  },
  btnOn: { backgroundColor: Brand.brandSoft },
  btnText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT, fontSize: 13 },
  btnTextOn: { color: Brand.brandDeep },
  pastTag: { fontFamily: FONT, fontSize: 11.5, color: Brand.faint, fontWeight: Weight.bold },
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
