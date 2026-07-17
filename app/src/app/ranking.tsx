/**
 * 랭킹 — 이번 주 크루 거리 랭킹(이름별 합산) + 이달의 챌린지(월 100K) 진행률.
 * 집계는 stats.ts 순수 함수. 데이터는 runs 구독(웹과 공유).
 */
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { useMyName } from "@/lib/session";
import { monthKm, weeklyRanking } from "@/lib/stats";

const MONTH_GOAL = 100; // 이달의 챌린지: 월 100km

function medal(rank: number): string {
  return rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : "";
}

export default function RankingScreen() {
  const [name] = useMyName(); // 개명 시 "내 순위" 하이라이트가 바로 따라온다
  const [runs, setRuns] = useState<Row[] | null>(null);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);

  const ranking = useMemo(() => (runs ? weeklyRanking(runs) : []), [runs]);
  const myMonth = runs ? monthKm(runs, name || undefined) : 0;
  const pct = Math.min(100, Math.round((myMonth / MONTH_GOAL) * 100));
  const loading = runs === null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eyebrowRow}>
          <Icon name="flag" size={15} color={Brand.brand} />
          <Text style={styles.eyebrow}>RANKING</Text>
        </View>
        <Text style={styles.title}>이번 주 랭킹</Text>
        <Text style={styles.sub}>월요일부터 지금까지 크루가 달린 거리</Text>

        {loading ? (
          <>
            <Skeleton height={92} radius={16} />
            <Skeleton height={64} radius={14} />
            <Skeleton height={64} radius={14} />
          </>
        ) : (
          <>
            {/* 이달의 챌린지 */}
            <View style={styles.challenge}>
              <View style={styles.chHead}>
                <View style={styles.chIcon}>
                  <Icon name="shield" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chTitle}>이달의 챌린지 · 월 100K</Text>
                  <Text style={styles.chSub}>
                    {myMonth.toFixed(1)} / {MONTH_GOAL}km · {pct}%
                  </Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
            </View>

            {/* 주간 랭킹 */}
            {ranking.length === 0 ? (
              <View style={styles.empty}>
                {/* 회색 아이콘 + "없어요"는 첫인상이 초라하다 — 마스코트가 대신 맞이한다 */}
                <Mascot size={84} />
                <Text style={styles.emptyText}>
                  이번 주 러닝 기록이 아직 없어요.{"\n"}첫 주자가 되어 보세요!
                </Text>
              </View>
            ) : (
              ranking.map((r, i) => {
                const isMe = !!name && r.name === name;
                return (
                  <View key={r.name} style={[styles.row, isMe && styles.rowMe]}>
                    <View style={styles.rankCol}>
                      {medal(i) ? (
                        <Text style={styles.medal}>{medal(i)}</Text>
                      ) : (
                        <Text style={styles.rankNum}>{i + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowName, isMe && styles.rowNameMe]}>
                        {r.name}
                        {isMe ? " (나)" : ""}
                      </Text>
                      <Text style={styles.rowRuns}>{r.runs}회 러닝</Text>
                    </View>
                    <Text style={styles.rowKm}>
                      {r.km.toFixed(1)}
                      <Text style={styles.rowUnit}> km</Text>
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 120 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  title: { fontFamily: FONT,
    fontSize: 30, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.8, marginTop: -4 },
  sub: { fontFamily: FONT,
    fontSize: 13, color: Brand.soft, marginBottom: 2 },

  challenge: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
  },
  chHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  chIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.input,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  chTitle: { fontFamily: FONT,
    fontSize: 14.5, fontWeight: Weight.bold, color: Brand.ink },
  chSub: { fontFamily: FONT,
    fontSize: 12.5, color: Brand.soft, marginTop: 2, fontWeight: Weight.regular },
  barBg: { height: 10, borderRadius: Radius.chip, backgroundColor: Brand.warm, overflow: "hidden" },
  barFill: { height: 10, borderRadius: Radius.chip, backgroundColor: Brand.brand },

  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 36 },
  emptyText: { color: Brand.soft, fontFamily: FONT,
    fontSize: 13.5, fontWeight: Weight.regular, textAlign: "center", lineHeight: 20 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    padding: 14,
  },
  rowMe: { borderColor: Brand.brand, backgroundColor: Brand.brandSoft },
  rankCol: { width: 30, alignItems: "center" },
  medal: { fontFamily: FONT,
    fontSize: 20 },
  rankNum: { fontFamily: FONT,
    fontSize: 16, fontWeight: Weight.bold, color: Brand.soft },
  rowName: { fontFamily: FONT,
    fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  rowNameMe: { color: Brand.brandDeep },
  rowRuns: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, marginTop: 1 },
  rowKm: { fontFamily: FONT,
    fontSize: 19, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.5 },
  rowUnit: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.soft },
});
