/**
 * 홈 (Today) — 개인화 큐레이션. 오늘/이번주 거리·크루 합계·빠른 실행·다가오는 모임·새 글.
 * 데이터는 runs·guestbook·attendance 구독(웹과 공유). 실제 러닝/글쓰기는 각 탭에서.
 */
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { fmtDate, subscribe, type Row } from "@/lib/crew";
import { nextEvent } from "@/lib/events";
import { COLLECTIONS } from "@/lib/firebase";
import { todayKm } from "@/lib/run";
import { searchAll } from "@/lib/search";
import { useMyName } from "@/lib/session";
import { weekKm } from "@/lib/stats";

export default function HomeScreen() {
  const [name] = useMyName(); // 다른 탭에서 개명해도 인사말이 곧바로 따라온다
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [guests, setGuests] = useState<Row[] | null>(null);
  const [attend, setAttend] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => subscribe(COLLECTIONS.guestbook, setGuests), []);
  useEffect(() => subscribe(COLLECTIONS.attendance, setAttend), []);

  const ev = useMemo(() => nextEvent(), []);
  const evCount = attend.filter((a) => a.eventId === ev.id).length;
  const iAmIn = !!name && attend.some((a) => a.eventId === ev.id && a.name === name);

  const loading = runs === null || guests === null;

  const myToday = runs ? todayKm(runs, name || undefined) : 0;
  const myWeek = runs ? weekKm(runs, name || undefined) : 0;
  const crewWeek = runs ? weekKm(runs) : 0;
  const newPosts = guests?.length ?? 0;

  const searching = q.trim().length > 0;
  const results = useMemo(
    () => searchAll(q, runs ?? [], guests ?? []),
    [q, runs, guests]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 인사말 + 마스코트 — 👋 이모지는 뺐다. 마스코트가 엄지척으로 이미 인사하고 있어 겹친다. */}
        <View style={styles.greetRow}>
          <View style={styles.greetText}>
            <View style={styles.eyebrowRow}>
              <Icon name="activity" size={15} color={Brand.brand} />
              <Text style={styles.eyebrow}>TODAY</Text>
            </View>
            <Text style={styles.title}>
              {name ? (
                <>
                  안녕하세요, <Text style={{ color: Brand.brand }}>{name}</Text>님
                </>
              ) : (
                <>반가워요, 러너</>
              )}
            </Text>
          </View>
          <Mascot size={62} />
        </View>

        {/* 통합 검색 */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={Brand.soft} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="크루·러닝·모임 검색"
            placeholderTextColor={Brand.faint}
            returnKeyType="search"
          />
          {searching && (
            <PressableScale onPress={() => setQ("")} hitSlop={8} dim={false}>
              <Icon name="close" size={16} color={Brand.soft} />
            </PressableScale>
          )}
        </View>

        {searching ? (
          results.total === 0 ? (
            <View style={styles.searchEmpty}>
              <Icon name="search" size={26} color={Brand.faint} />
              <Text style={styles.searchEmptyText}>‘{q.trim()}’ 결과가 없어요</Text>
            </View>
          ) : (
            <>
              {results.runs.length > 0 && (
                <>
                  <Text style={styles.sectionH}>러닝 {results.runs.length}</Text>
                  {results.runs.map((r) => (
                    <PressableScale
                      key={r.id}
                      style={styles.resRow}
                      onPress={() => router.push(`/explore/run/${r.id}`)}>
                      <View style={styles.resIcon}>
                        <Icon name="run" size={15} color={Brand.brandDeep} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resTitle}>
                          {(Number(r.distanceKm) || 0).toFixed(2)}km · {r.name}
                        </Text>
                        <Text style={styles.resSub}>{fmtDate(r.startedAt ?? r.createdAt)}</Text>
                      </View>
                      <Icon name="chevron-right" size={18} color={Brand.faint} />
                    </PressableScale>
                  ))}
                </>
              )}
              {results.posts.length > 0 && (
                <>
                  <Text style={styles.sectionH}>크루 글 {results.posts.length}</Text>
                  {results.posts.map((p) => (
                    <PressableScale
                      key={p.id}
                      style={styles.resRow}
                      onPress={() => router.push("/crew")}>
                      <View style={styles.resIcon}>
                        <Icon name="chat" size={15} color={Brand.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resTitle} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={styles.resSub} numberOfLines={1}>
                          {p.msg}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={18} color={Brand.faint} />
                    </PressableScale>
                  ))}
                </>
              )}
              {results.events.length > 0 && (
                <>
                  <Text style={styles.sectionH}>모임 {results.events.length}</Text>
                  {results.events.map((e) => (
                    <PressableScale
                      key={e.id}
                      style={styles.resRow}
                      onPress={() => router.push("/crew")}>
                      <View style={styles.resIcon}>
                        <Icon name="calendar" size={15} color={Brand.brandDeep} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resTitle} numberOfLines={1}>
                          {e.title}
                        </Text>
                        <Text style={styles.resSub}>
                          {e.m} {e.d}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={18} color={Brand.faint} />
                    </PressableScale>
                  ))}
                </>
              )}
            </>
          )
        ) : (
          <>
            {loading ? (
              <>
                <Skeleton height={132} radius={20} />
                <Skeleton height={78} radius={16} />
                <Skeleton height={52} radius={14} />
              </>
            ) : (
              <>
                {/* 오늘 뛴 거리 — 히어로 */}
                <View style={styles.hero}>
              <Text style={styles.heroLab}>오늘 뛴 거리</Text>
              <View style={styles.heroNumRow}>
                <Text style={styles.heroNum}>{myToday.toFixed(2)}</Text>
                <Text style={styles.heroUnit}>km</Text>
              </View>
              <Text style={styles.heroSub}>이번 주 {myWeek.toFixed(1)}km 달렸어요</Text>
            </View>

            {/* 이번 주 크루 합계 */}
            <View style={styles.crewCard}>
              <View style={styles.crewIcon}>
                <Icon name="users" size={17} color={Brand.brandDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.crewLab}>이번 주 우리 크루</Text>
                <Text style={styles.crewSub}>다 함께 달린 거리</Text>
              </View>
              <Text style={styles.crewNum}>
                {crewWeek.toFixed(1)}
                <Text style={styles.crewUnit}> km</Text>
              </Text>
            </View>

            {/* 빠른 실행 */}
            <View style={styles.ctaRow}>
              <PressableScale
                style={[styles.cta, styles.ctaPrimary]}
                onPress={() => router.push("/explore")}>
                <Icon name="play" size={20} color="#fff" />
                <Text style={styles.ctaPrimaryText}>러닝 시작</Text>
              </PressableScale>
              <PressableScale
                style={[styles.cta, styles.ctaSecondary]}
                onPress={() => router.push("/explore")}>
                <Icon name="watch" size={20} color={Brand.ink} />
                <Text style={styles.ctaSecondaryText}>워치 불러오기</Text>
              </PressableScale>
            </View>

            {/* 다가오는 모임 */}
            <Text style={styles.sectionH}>다가오는 모임</Text>
            <PressableScale style={styles.evCard} onPress={() => router.push("/crew")}>
              <View style={styles.evDate}>
                <Text style={styles.evM}>{ev.m}</Text>
                <Text style={styles.evD}>{ev.d}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evTitle}>{ev.title}</Text>
                <Text style={styles.evMeta}>
                  {evCount > 0 ? `${evCount}명 참석 예정` : "아직 참석자가 없어요"}
                  {iAmIn ? " · 나 참석 ✓" : ""}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Brand.faint} />
            </PressableScale>

            {/* 크루 새 글 */}
            <PressableScale style={styles.linkRow} onPress={() => router.push("/crew")}>
              <View style={styles.linkIcon}>
                <Icon name="chat" size={16} color={Brand.accent} />
              </View>
              <Text style={styles.linkText}>크루 방명록 {newPosts}개</Text>
              <Icon name="chevron-right" size={18} color={Brand.faint} />
            </PressableScale>
          </>
        )}

            <View style={styles.quickTiles}>
              {(
                [
                  { icon: "flag", label: "랭킹", to: "/ranking" },
                  { icon: "user", label: "마이", to: "/my" },
                ] as const
              ).map((t) => (
                <PressableScale key={t.to} style={styles.qTile} onPress={() => router.push(t.to)}>
                  <Icon name={t.icon} size={18} color={Brand.brandDeep} />
                  <Text style={styles.qLabel}>{t.label}</Text>
                </PressableScale>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 14, paddingBottom: 120 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  greetRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  greetText: { flex: 1 },
  eyebrow: { fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  title: { fontFamily: FONT,
    fontSize: 30, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.8, marginTop: -4 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  searchInput: { flex: 1, fontFamily: FONT,
    fontSize: 15, color: Brand.ink, paddingVertical: 10 },
  searchEmpty: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 40 },
  searchEmptyText: { color: Brand.soft, fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.regular },
  resRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    padding: 13,
  },
  resIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  resTitle: { fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.bold, color: Brand.ink },
  resSub: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, marginTop: 1 },

  hero: { backgroundColor: Brand.dark, borderRadius: Radius.hero, padding: 24 },
  heroLab: { color: "#aab2bb", fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular },
  heroNumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6 },
  heroNum: { color: "#fff", fontFamily: FONT,
    fontSize: 54, fontWeight: Weight.bold, letterSpacing: -2, lineHeight: 56 },
  heroUnit: { color: Brand.brand, fontFamily: FONT,
    fontSize: 22, fontWeight: Weight.bold, marginLeft: 7, marginBottom: 7 },
  heroSub: { color: "#8b929b", fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.regular, marginTop: 8 },

  crewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    padding: 16,
  },
  crewIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.input,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  crewLab: { fontFamily: FONT,
    fontSize: 14.5, fontWeight: Weight.regular, color: Brand.ink },
  crewSub: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, marginTop: 1 },
  crewNum: { fontFamily: FONT,
    fontSize: 24, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.5 },
  crewUnit: { fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.bold, color: Brand.soft },

  ctaRow: { flexDirection: "row", gap: 10 },
  cta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: Radius.input,
    paddingVertical: 15,
    minHeight: 52,
  },
  ctaPrimary: { backgroundColor: Brand.brand },
  ctaPrimaryText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },
  ctaSecondary: { backgroundColor: Brand.card, borderWidth: 1, borderColor: Brand.line2 },
  ctaSecondaryText: { color: Brand.ink, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },

  sectionH: { fontFamily: FONT,
    fontSize: 15, fontWeight: Weight.bold, color: Brand.ink, marginTop: 2 },
  evCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    padding: 14,
  },
  evDate: {
    width: 50,
    height: 50,
    borderRadius: Radius.input,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  evM: { color: "#fff", fontFamily: FONT,
    fontSize: 10, fontWeight: Weight.regular },
  evD: { color: "#fff", fontFamily: FONT,
    fontSize: 19, fontWeight: Weight.bold, lineHeight: 21 },
  evTitle: { fontFamily: FONT,
    fontSize: 14.5, fontWeight: Weight.bold, color: Brand.ink },
  evMeta: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, marginTop: 3 },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  linkIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.chip,
    backgroundColor: Brand.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { flex: 1, fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.bold, color: Brand.ink },

  quickTiles: { flexDirection: "row", gap: 10, marginTop: 2 },
  qTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingVertical: 13,
  },
  qLabel: { fontFamily: FONT,
    fontSize: 13.5, fontWeight: Weight.regular, color: Brand.ink },
});
