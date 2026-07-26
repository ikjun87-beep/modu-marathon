/**
 * 랭킹 — 이번 주 크루 거리 랭킹(이름별 합산) + 이달의 챌린지(월 100K) 진행률.
 * 집계는 stats.ts 순수 함수. 데이터는 runs 구독(웹과 공유).
 */
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { MonthReportCard } from "@/components/month-report";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, FONT_DISPLAY, Weight, Radius, Shadow } from "@/lib/brand";
import { subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { useMyName } from "@/lib/session";
import { monthKm, monthReport, weeklyRanking } from "@/lib/stats";

const MONTH_GOAL = 100; // 이달의 챌린지: 월 100km

// 1·2·3위 = 금·은·동. 이모지 대신 커스텀 색 뱃지로(앱 전체 커스텀 아이콘 체계와 정합).
const RANK_COLOR: (string | null)[] = ["#c0841a", "#9aa3af", "#b87333"];

export default function RankingScreen() {
  const [name] = useMyName(); // 개명 시 "내 순위" 하이라이트가 바로 따라온다
  const [runs, setRuns] = useState<Row[] | null>(null);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);

  const ranking = useMemo(() => (runs ? weeklyRanking(runs) : []), [runs]);
  const myMonth = runs ? monthKm(runs, name || undefined) : 0;
  const report = useMemo(() => monthReport(runs ?? [], name || undefined), [runs, name]);
  const pct = Math.min(100, Math.round((myMonth / MONTH_GOAL) * 100));
  const myRank = name ? ranking.findIndex((r) => r.name === name) + 1 : 0; // 0 = 순위 없음
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

            {/* 월간 리포트 — 지난달 대비 내 러닝(골프 앱식 성장 서사) */}
            <MonthReportCard report={report} />

            {/* 주간 랭킹 — 카드가 연달아 나오면 어디부터 순위인지 안 보여 섹션 라벨을 둔다. */}
            {ranking.length > 0 && <Text style={styles.sectionH}>크루 순위</Text>}
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
                const top = ranking[0]?.km || 1; // 1위 대비 상대 거리 바
                const rel = Math.max(8, Math.round((r.km / top) * 100));
                const rc = RANK_COLOR[i]; // 1~3위 금·은·동, 그 외 null

                // 🥇 1위는 **카드 문법을 깬다** — 흰 카드+아이콘뱃지 조합이 전 화면에서 똑같이
                // 반복되는 게 "AI가 만든 것 같다"는 인상의 원인이었다(디자인 감사). 한 화면에
                // 하나쯤은 규칙을 깨는 시그니처가 있어야 화면이 살아난다.
                if (i === 0) {
                  return (
                    <View key={r.name} style={styles.champ}>
                      <View style={styles.champTop}>
                        <View style={styles.champCrown}>
                          <Text style={styles.champCrownText}>1</Text>
                        </View>
                        <Text style={styles.champLabel}>이번 주 1등</Text>
                      </View>
                      <View style={styles.champBody}>
                        <View style={styles.champAvatar}>
                          <Mascot size={46} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.champName} numberOfLines={1}>
                            {r.name}
                            {isMe ? " (나)" : ""}
                          </Text>
                          <Text style={styles.champRuns}>{r.runs}회 러닝</Text>
                        </View>
                        <Text style={styles.champKm}>
                          {r.km.toFixed(1)}
                          <Text style={styles.champUnit}> km</Text>
                        </Text>
                      </View>
                    </View>
                  );
                }
                return (
                  <View key={r.name} style={[styles.row, isMe && styles.rowMe]}>
                    <View style={[styles.rankBadge, rc ? { backgroundColor: rc } : styles.rankBadgePlain]}>
                      <Text style={[styles.rankBadgeText, !rc && styles.rankBadgeTextPlain]}>{i + 1}</Text>
                    </View>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(r.name.trim()[0] || "?").toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[styles.rowName, isMe && styles.rowNameMe]} numberOfLines={1}>
                        {r.name}
                        {isMe ? " (나)" : ""}
                      </Text>
                      <View style={styles.relTrack}>
                        <View style={[styles.relFill, { width: `${rel}%`, backgroundColor: rc || Brand.brand }]} />
                      </View>
                    </View>
                    <View style={styles.kmCol}>
                      <Text style={styles.rowKm}>
                        {r.km.toFixed(1)}
                        <Text style={styles.rowUnit}> km</Text>
                      </Text>
                      <Text style={styles.rowRuns}>{r.runs}회</Text>
                    </View>
                  </View>
                );
              })
            )}

            {/* 리더보드 아래 빈 공간이 휑했다 — 다음 행동으로 이어주는 카드로 채운다(디자인 감사 지적). */}
            {ranking.length > 0 && (
              <View style={styles.inviteCard}>
                <Mascot size={54} />
                <View style={{ flex: 1 }}>
                  {/* 위 리더보드에 이미 기록이 떠 있는데 "아직 기록이 없어요"라고 하면 모순으로 읽힌다
                      → 크루 기준이 아니라 **내 기준**임을 문구에서 분명히 한다(디자인 감사 지적). */}
                  <Text style={styles.inviteTitle}>
                    {myRank > 0 ? `이번 주 ${myRank}위예요` : "아직 내 기록이 없어요"}
                  </Text>
                  <Text style={styles.inviteSub}>
                    {myRank > 0
                      ? "한 번 더 뛰면 순위가 올라가요!"
                      : `벌써 ${ranking.length}명이 달렸어요. 지금 뛰면 순위에 이름이 올라가요.`}
                  </Text>
                </View>
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
  content: { padding: 18, gap: 12, paddingBottom: 160 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  title: { fontFamily: FONT,
    fontSize: 26, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },
  sub: { fontFamily: FONT,
    fontSize: 13, color: Brand.soft, marginBottom: 2 },

  challenge: {
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
    ...Shadow.soft,
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
  barFill: { height: 10, borderRadius: Radius.chip, backgroundColor: Brand.gold },

  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 36 },
  emptyText: { color: Brand.soft, fontFamily: FONT,
    fontSize: 13.5, fontWeight: Weight.regular, textAlign: "center", lineHeight: 20 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: Radius.input,
    padding: 14,
    ...Shadow.soft,
  },
  rowMe: { borderColor: Brand.brand, backgroundColor: Brand.brandSoft },
  // 1위 시그니처 — 다크 네이비 + 골드. 흰 카드 반복을 끊는 자리.
  champ: {
    backgroundColor: Brand.dark,
    borderRadius: Radius.hero,
    padding: 16,
    gap: 12,
    ...Shadow.card,
  },
  champTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  champCrown: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  champCrownText: { fontFamily: FONT, fontSize: 13, fontWeight: Weight.bold, color: "#fff" },
  champLabel: { fontFamily: FONT, fontSize: 12, fontWeight: Weight.bold, letterSpacing: 1.5, color: Brand.gold },
  champBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  champAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  champName: { fontFamily: FONT, fontSize: 17, fontWeight: Weight.bold, color: "#fff" },
  champRuns: { fontFamily: FONT, fontSize: 12.5, color: "#8b929b", marginTop: 2 },
  champKm: { fontFamily: FONT_DISPLAY, fontSize: 30, color: "#fff", letterSpacing: -0.5 },
  champUnit: { fontFamily: FONT, fontSize: 13, fontWeight: Weight.bold, color: Brand.gold },

  sectionH: { fontFamily: FONT,
    fontSize: 15, fontWeight: Weight.bold, color: Brand.ink, marginTop: 4, marginBottom: -2 },

  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.card,
    padding: 14,
    marginTop: 4,
  },
  inviteTitle: { fontFamily: FONT,
    fontSize: 14.5, fontWeight: Weight.bold, color: Brand.brandDeep },
  inviteSub: { fontFamily: FONT,
    fontSize: 12.5, color: Brand.ink2, marginTop: 2, lineHeight: 17 },

  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgePlain: { backgroundColor: Brand.warm },
  rankBadgeText: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.bold, color: "#fff" },
  rankBadgeTextPlain: { color: Brand.soft },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: FONT,
    fontSize: 16, fontWeight: Weight.bold, color: Brand.brandDeep },
  relTrack: { height: 5, borderRadius: 3, backgroundColor: Brand.warm, overflow: "hidden" },
  relFill: { height: 5, borderRadius: 3 },
  rowName: { fontFamily: FONT,
    fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  rowNameMe: { color: Brand.brandDeep },
  kmCol: { alignItems: "flex-end" },
  rowRuns: { fontFamily: FONT,
    fontSize: 11.5, color: Brand.soft, marginTop: 1 },
  rowKm: { fontFamily: FONT,
    fontSize: 19, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },
  // 전역 규칙: 숫자=본문색 + 단위=브랜드 블루
  rowUnit: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand },
});
