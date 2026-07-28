/**
 * 랭킹 — 이번 주 크루 거리 랭킹(이름별 합산) + 이달의 챌린지(월 100K) 진행률.
 * 집계는 stats.ts 순수 함수. 데이터는 runs 구독(웹과 공유).
 */
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
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

  // 앞 순위와의 거리 차 — 1위인데 "한 번 더 뛰면 순위가 올라가요"라고 하던 모순을 없앤다.
  // 두루뭉술한 독려보다 "2위와 1.4km 차이"가 실제로 다음 러닝을 부른다(디자인 감사).
  const rival = myRank > 0 ? ranking[myRank === 1 ? 1 : myRank - 2] : undefined;
  const gapKm = myRank > 0 && rival ? Math.abs((ranking[myRank - 1]?.km ?? 0) - rival.km) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
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
                {/* 챌린지 = 성과 신호라 **골드**. 블루 솔리드는 액션(버튼) 전용으로 남긴다.
                    같은 카드 안 진행바가 이미 골드라 아이콘까지 맞춰야 한 덩어리로 읽힌다. */}
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
              // 마스코트 84를 세로로 쌓았더니 위 카드들과 합쳐져 안내문이 탭바 뒤로 밀렸다
              // — 마스코트만 보이고 정작 할 말이 안 보이는 막다른 화면이었다(실기기 2회 확인).
              // 아래 [다음 행동] 카드와 같은 가로 배치로 바꿔 높이를 절반으로 줄이고 문법도 통일한다.
              <View style={styles.inviteCard}>
                <Mascot size={54} />
                <View style={{ flex: 1 }}>
                  {/* 320dp에서 15자는 2줄로 넘쳐 마스코트와 세로 정렬이 어긋난다 → 13자로. */}
                  <Text style={styles.inviteTitle}>이번 주 기록이 아직 없어요</Text>
                  <Text style={styles.inviteSub}>첫 주자가 되어 보세요!</Text>
                </View>
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
                        {/* 내 순위 표시를 이름 뒤 " (나)"로 붙이면 그만큼 이름 칸이 줄어
                            "TESTM24 (…"로 잘렸다(실기기 확인). 여유 있는 라벨 줄에서 말한다. */}
                        <Text style={styles.champLabel}>
                          {isMe ? "내가 이번 주 1등!" : "이번 주 1등"}
                        </Text>
                      </View>
                      <View style={styles.champBody}>
                        <View style={styles.champAvatar}>
                          <Mascot size={42} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.champName} numberOfLines={1}>
                            {r.name}
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
                    <Avatar name={r.name} size={38} me={isMe} />
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
                    {myRank === 1
                      ? gapKm != null
                        ? `2위와 ${gapKm.toFixed(1)}km 차이예요. 이대로 지켜요!`
                        : "크루를 불러 함께 달려볼까요?" // 제목에 이미 "이번 주"가 있어 중복을 뺀다
                      : myRank > 1
                        ? gapKm != null
                          ? `${myRank - 1}위와 ${gapKm.toFixed(1)}km 차이예요. 한 번 더 뛰면 따라잡아요!`
                          : "한 번 더 뛰면 순위가 올라가요!"
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
  title: { fontFamily: FONT,
    fontSize: 28, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.4 },
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
    backgroundColor: Brand.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  chTitle: { fontFamily: FONT,
    fontSize: 14.5, fontWeight: Weight.bold, color: Brand.ink },
  chSub: { fontFamily: FONT,
    fontSize: 12.5, color: Brand.soft, marginTop: 2, fontWeight: Weight.regular },
  // 트랙이 warm(#eef2f8)이라 카드 흰 배경과 명도차가 거의 없어 "진행바가 있다"는 것 자체가
  // 안 보였다(독립 채점 R11). 한 단계 진한 line2로 내려 구조를 드러낸다.
  barBg: { height: 10, borderRadius: Radius.chip, backgroundColor: Brand.line2, overflow: "hidden" },
  barFill: { height: 10, borderRadius: Radius.chip, backgroundColor: Brand.gold },

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
  // ⚠️ 실기기(320dp 폭)에서 아바타 58 + 거리 30pt가 이름 칸을 먹어 "TESTM2…"로 잘렸다.
  // 시그니처 카드에서 주인공 이름이 잘리면 카드의 의미가 없다 → 셋 다 한 단계씩 줄인다.
  champBody: { flexDirection: "row", alignItems: "center", gap: 10 },
  champAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  champName: { fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold, color: "#fff" },
  champRuns: { fontFamily: FONT, fontSize: 12.5, color: "#8b929b", marginTop: 2 },
  champKm: { fontFamily: FONT_DISPLAY, fontSize: 26, color: "#fff", letterSpacing: -0.5 },
  // 단위는 **예외 없이 브랜드 블루**(전역 규칙). 여기만 골드였더니 바로 아래 월간 리포트
  // 카드(단위=블루)와 규칙이 갈렸다(독립 채점 R11 중대 지적). 이 카드의 골드는
  // 순위 뱃지와 "내가 이번 주 1등!" 라벨이 이미 충분히 들고 있다.
  champUnit: { fontFamily: FONT, fontSize: 13, fontWeight: Weight.bold, color: Brand.brand },

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
  relTrack: { height: 5, borderRadius: 3, backgroundColor: Brand.line2, overflow: "hidden" },
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
