/**
 * 출석 이력 (push 페이지, PHASE 2-C) — 누가 몇 번 나왔는지 + 지난 모임별 참석자.
 * attendance·events 둘 다 root 컬렉션(웹 공유, read:true) — 새 rules 없이 기존 구독만 재사용.
 */
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, Weight, Radius, Shadow, leading } from "@/lib/brand";
import { subscribe, type Row } from "@/lib/crew";
import { isPast, subscribeEvents, type EventDef } from "@/lib/events";
import { COLLECTIONS } from "@/lib/firebase";

type Tally = { name: string; count: number };

export default function AttendanceHistoryScreen() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [events, setEvents] = useState<EventDef[] | null>(null);

  useEffect(() => subscribe(COLLECTIONS.attendance, setRows), []);
  useEffect(() => subscribeEvents(setEvents), []);

  const loading = rows === null || events === null;

  // 누가 몇 번 나왔는지 — 이름 문자열 기준(현재 신원 스키마, crew.ts와 같은 축).
  const leaderboard = useMemo<Tally[]>(() => {
    if (!rows) return [];
    const counts = new Map<string, number>();
    for (const r of rows) {
      const n = String(r.name ?? "").trim();
      if (!n) continue;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [rows]);

  const pastEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => isPast(e)).sort((a, b) => b.startAt - a.startAt); // 최근 것부터
  }, [events]);

  function attendeesOf(ev: EventDef): Row[] {
    return (rows ?? []).filter((a) => a.eventId === ev.id);
  }

  const back = (
    <PressableScale style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
      <Icon name="chevron-left" size={24} color={Brand.ink} />
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        {back}
        <Text style={styles.topTitle}>출석 이력</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <>
            <Skeleton height={120} radius={16} />
            <Skeleton height={200} radius={16} />
          </>
        ) : (
          <>
            <Text style={styles.sectionH}>크루 출석 랭킹</Text>
            {leaderboard.length ? (
              <View style={styles.card}>
                {leaderboard.map((t, i) => (
                  <View key={t.name} style={[styles.rankRow, i > 0 && styles.rankRowLine]}>
                    <Text style={styles.rankNo}>{i + 1}</Text>
                    <Avatar name={t.name} size={30} ring={false} />
                    <Text style={styles.rankName} numberOfLines={1}>{t.name}</Text>
                    <Text style={styles.rankCount}>
                      {t.count}
                      <Text style={styles.rankUnit}> 회</Text>
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.empty}>아직 참석 기록이 없어요.</Text>
              </View>
            )}

            <Text style={styles.sectionH}>지난 모임</Text>
            {pastEvents.length ? (
              pastEvents.map((ev) => {
                const list = attendeesOf(ev);
                return (
                  <View key={ev.id} style={styles.evCard}>
                    <View style={styles.evHead}>
                      <View style={styles.evDate}>
                        <Text style={styles.evM}>{ev.m}</Text>
                        <Text style={styles.evD}>{ev.d}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.evTitle} numberOfLines={1}>{ev.title}</Text>
                        <Text style={styles.evSub}>
                          {list.length ? `참석 ${list.length}명` : "참석자가 없었어요"}
                        </Text>
                      </View>
                    </View>
                    {list.length > 0 && (
                      <View style={styles.faces}>
                        {list.map((a, i) => (
                          <View key={a.id} style={[styles.face, i > 0 && styles.faceOverlap]}>
                            <Avatar name={a.name} size={24} ring={false} />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.card}>
                <Text style={styles.empty}>아직 지난 모임이 없어요.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: Radius.input },
  topTitle: { fontFamily: FONT, fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },
  body: { padding: 18, gap: 12, paddingBottom: 48 },
  sectionH: { fontFamily: FONT, fontSize: 15, lineHeight: leading(15), fontWeight: Weight.bold, color: Brand.ink, marginTop: 6 },
  card: { backgroundColor: Brand.card, borderRadius: Radius.card, padding: 14, ...Shadow.soft },
  empty: { fontFamily: FONT, fontSize: 13.5, lineHeight: leading(13.5), color: Brand.soft, textAlign: "center", paddingVertical: 10 },

  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  rankRowLine: { borderTopWidth: 1, borderTopColor: Brand.line },
  rankNo: { width: 18, fontFamily: FONT, fontSize: 13, fontWeight: Weight.bold, color: Brand.faint, textAlign: "center" },
  rankName: { flex: 1, fontFamily: FONT, fontSize: 14, lineHeight: leading(14), fontWeight: Weight.bold, color: Brand.ink },
  rankCount: { fontFamily: FONT, fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  rankUnit: { fontFamily: FONT, fontSize: 12, fontWeight: Weight.bold, color: Brand.brand },

  evCard: { backgroundColor: Brand.card, borderRadius: Radius.card, padding: 14, gap: 10, ...Shadow.soft },
  evHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  evDate: {
    width: 46, height: 46, borderRadius: Radius.input,
    backgroundColor: Brand.faint, alignItems: "center", justifyContent: "center",
  },
  evM: { color: "#fff", fontFamily: FONT, fontSize: 9.5, lineHeight: leading(9.5), fontWeight: Weight.regular },
  evD: { color: "#fff", fontFamily: FONT, fontSize: 18, fontWeight: Weight.bold, lineHeight: 21 },
  evTitle: { fontFamily: FONT, fontSize: 14.5, lineHeight: leading(14.5), fontWeight: Weight.bold, color: Brand.ink },
  evSub: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft, marginTop: 2 },
  faces: { flexDirection: "row", alignItems: "center" },
  face: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Brand.card, borderWidth: 2, borderColor: Brand.card,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  faceOverlap: { marginLeft: -8 },
});
