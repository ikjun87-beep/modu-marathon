/**
 * 홈 (Today) — 개인화 큐레이션. 오늘/이번주 거리·크루 합계·빠른 실행·다가오는 모임·새 글.
 * 데이터는 runs·guestbook·attendance 구독(웹과 공유). 실제 러닝/글쓰기는 각 탭에서.
 */
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { ClapButton } from "@/components/clap-button";
import { Icon } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, FONT_DISPLAY, Weight, Radius, Shadow, leading } from "@/lib/brand";
import { fmtDate, subscribe, type Row } from "@/lib/crew";
import { buildFeed, feedTime, todayRunnerCount } from "@/lib/feed";
import { nextEvent, subscribeEvents, type EventDef } from "@/lib/events";
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
  const [events, setEvents] = useState<EventDef[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => subscribe(COLLECTIONS.guestbook, setGuests), []);
  useEffect(() => subscribe(COLLECTIONS.attendance, setAttend), []);
  useEffect(() => subscribeEvents(setEvents), []);

  const ev = useMemo(() => nextEvent(events), [events]); // 다가오는 모임 없으면 null
  const evCount = ev ? attend.filter((a) => a.eventId === ev.id).length : 0;
  const iAmIn = !!ev && !!name && attend.some((a) => a.eventId === ev.id && a.name === name);

  const loading = runs === null || guests === null;

  const myToday = runs ? todayKm(runs, name || undefined) : 0;
  const myWeek = runs ? weekKm(runs, name || undefined) : 0;
  const crewWeek = runs ? weekKm(runs) : 0;
  const newPosts = guests?.length ?? 0;

  // 타임라인 — 러닝·참석·방명록을 시간순으로 합친 홈의 주인공(lib/feed).
  const feed = useMemo(
    () => buildFeed(runs ?? [], guests ?? [], attend, events),
    [runs, guests, attend, events]
  );
  const runnersToday = useMemo(() => todayRunnerCount(runs ?? []), [runs]);

  const searching = q.trim().length > 0;
  const results = useMemo(
    () => searchAll(q, runs ?? [], guests ?? [], events),
    [q, runs, guests, events]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 인사말 + 마스코트 — 👋 이모지는 뺐다. 마스코트가 엄지척으로 이미 인사하고 있어 겹친다. */}
        <View style={styles.greetRow}>
          <View style={styles.greetText}>
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
          {/* 인사말 옆 = **내 아바타 자리**다. 여기에 `Mascot`을 직접 박아 뒀더니, 사진을
              등록하고 홈으로 돌아온 사용자가 **자기 얼굴이 안 바뀐 화면**을 첫 화면에서 보게 됐다
              (마이 탭에서는 바뀌어 있어 더 어긋나 보인다 — 2026-08-01 실기기 검증).
              → `Avatar`로 넘긴다. 사진이 있으면 얼굴, 없으면 지금까지와 똑같이 마스코트다.
              `Avatar`의 wrap이 이미 `Brand.brandSoft` 원판 + overflow:hidden이라
              "붕 떠 보인다"고 원판을 씌웠던 이유도 그대로 충족된다(스타일 중복 제거). */}
          <Avatar name={name || "?"} size={68} me ring={false} />
        </View>

        {/* 통합 검색 */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={Brand.soft} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="크루·러닝·모임 검색"
            placeholderTextColor={Brand.placeholder}
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
                        {/* 골드는 순위·챌린지·성과 전용(전역 규칙) — 검색결과 아이콘엔 쓰지 않는다. */}
                        <Icon name="chat" size={15} color={Brand.brandDeep} />
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
                {/* 오늘 요약 — 카드가 아니라 **한 줄**. 홈이 카드로 시작하면 다른 탭과
                    똑같은 템플릿으로 읽힌다(독립 채점 R11). 숫자는 타임라인의 머리말로만 둔다. */}
                <View style={styles.todayLine}>
                  <Text style={styles.todayLineText}>
                    오늘 <Text style={styles.todayLineNum}>{myToday.toFixed(1)}</Text>
                    <Text style={styles.todayLineUnit}>km</Text>
                    {"  ·  "}이번 주 <Text style={styles.todayLineNum}>{myWeek.toFixed(1)}</Text>
                    <Text style={styles.todayLineUnit}>km</Text>
                  </Text>
                </View>

                {/* 크루 전체 지표 — 다크 카드를 걷어내면서 "이번 주 우리 크루"가 통째로
                    사라졌었다(독립 채점 R13 지적). 러닝 크루 앱에서 "우리가 함께 얼마나
                    뛰었나"는 개인 기록보다 동기부여가 큰 **사회적 증거**다. 카드로 되돌리지는
                    않고(그러면 다시 카드 스택이 된다) 타임라인 머리에 붙는 띠로 되살린다. */}
                <View style={styles.crewLine}>
                  <Icon name="users" size={15} color={Brand.brandDeep} />
                  <Text style={styles.crewLineText}>
                    이번 주 우리 크루 <Text style={styles.crewLineNum}>{crewWeek.toFixed(1)}</Text>
                    <Text style={styles.crewLineUnit}>km</Text>
                    {runnersToday > 0 ? (
                      <Text style={styles.crewLineSub}>{`  ·  오늘 ${runnersToday}명이 뛰었어요`}</Text>
                    ) : null}
                  </Text>
                </View>

                {/* 주 액션은 하나 — [러닝 시작]. 워치는 보조라 링크로 낮춘다.
                    둘이 5:5로 나란하면 신규 유저가 뭘 눌러야 할지 망설인다(경쟁 분석 격차5). */}
                <PressableScale
                  style={styles.startBtn}
                  onPress={() => router.push("/explore")}>
                  <Icon name="play" size={20} color="#fff" />
                  <Text style={styles.startBtnText}>러닝 시작</Text>
                </PressableScale>
                <PressableScale
                  style={styles.watchLink}
                  onPress={() => router.push("/explore")}
                  dim={false}>
                  <Icon name="watch" size={16} color={Brand.brandDeep} />
                  <Text style={styles.watchLinkText}>워치에서 불러오기</Text>
                </PressableScale>

                {/* 다가오는 모임 — 예정은 "지난 일"의 흐름에 섞으면 시간 축이 뒤엉킨다.
                    타임라인 위에 따로 한 줄로 둔다. */}
                {ev && (
                  <PressableScale style={styles.evRow} onPress={() => router.push("/crew")}>
                    <View style={styles.evDate}>
                      <Text style={styles.evM}>{ev.m}</Text>
                      <Text style={styles.evD}>{ev.d}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={styles.evMeta}>
                        {evCount > 0 ? `${evCount}명 참석 예정` : "아직 참석자가 없어요"}
                        {iAmIn ? " · 나 참석 ✓" : ""}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={Brand.faint} />
                  </PressableScale>
                )}

                {/* 크루 타임라인 — 홈의 지배적 레이아웃. 카드 스택이 아니라 세로 라인 위 노드라
                    다른 탭과 확실히 다른 화면으로 읽힌다. */}
                <Text style={styles.sectionH}>크루 소식</Text>
                {feed.length === 0 ? (
                  <View style={styles.feedEmpty}>
                    <Mascot size={54} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedEmptyTitle}>오늘은 아직 조용해요</Text>
                      <Text style={styles.feedEmptySub}>첫 러닝을 남기면 여기에 올라와요!</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.feed}>
                    {feed.map((f, i) => (
                      <PressableScale
                        key={f.id}
                        style={styles.feedRow}
                        onPress={() => f.href && router.push(f.href as never)}
                        dim={false}>
                        {/* **아바타가 곧 레일의 노드**다. 점을 따로 찍으면 사람 옆에 점이
                            하나 더 붙어 중복이고, 정작 타임라인의 주인공(사람)이 작아진다.
                            마지막 항목은 아래 선을 그리지 않아야 흐름이 맺힌다. */}
                        <View style={styles.feedRail}>
                          <Avatar name={f.name} size={30} me={!!name && f.name === name} />
                          {i < feed.length - 1 && <View style={styles.feedLine} />}
                        </View>
                        <View style={styles.feedBody}>
                          <View style={styles.feedHead}>
                            <Text style={styles.feedName} numberOfLines={1}>{f.name}</Text>
                            <Text style={styles.feedTime}>{feedTime(f.at)}</Text>
                          </View>
                          <Text style={styles.feedText} numberOfLines={2}>{f.text}</Text>
                          {/* 박수는 **러닝에만**. 방명록 글은 이미 말이고, 참석은 예정이라
                              "잘했어요"라고 할 대상이 아니다 — 아무 데나 붙이면 의미가 닳는다. */}
                          {f.kind === "run" && (
                            <View style={styles.feedClap}>
                              <ClapButton targetId={f.id.replace(/^run_/, "")} myName={name} size="sm" />
                            </View>
                          )}
                        </View>
                      </PressableScale>
                    ))}
                  </View>
                )}
              </>
            )}

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 16, gap: 12, paddingBottom: 160 },
  greetRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  greetText: { flex: 1 },
  // (mascotWrap 제거 — Avatar가 같은 원판을 자체 wrap으로 그린다)
  // 영문 라벨(TODAY)을 없앤 만큼 인사말이 이름표 역할을 한다 → 한 단계 키운다.
  // LINE Seed는 시스템 폰트보다 자간이 촘촘해 음수 letterSpacing은 쓰지 않는다.
  title: { fontFamily: FONT,
    fontSize: 26, fontWeight: Weight.bold, color: Brand.ink, lineHeight: 33 },

  // ── 홈 타임라인(R12) ─────────────────────────────────────────────
  todayLine: { paddingVertical: 2 },
  todayLineText: { fontFamily: FONT, fontSize: 14, lineHeight: leading(14), color: Brand.soft, fontWeight: Weight.regular },
  todayLineNum: { fontFamily: FONT, fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },
  todayLineUnit: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand },
  crewLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.tint,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  crewLineText: { flex: 1, fontFamily: FONT, fontSize: 13.5, lineHeight: leading(13.5), color: Brand.ink2, fontWeight: Weight.regular },
  crewLineNum: { fontFamily: FONT, fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },
  crewLineUnit: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand },
  crewLineSub: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.brand,
    borderRadius: Radius.pill,
    paddingVertical: 15,
    minHeight: 52,
    ...Shadow.soft,
  },
  startBtnText: { color: "#fff", fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold },
  watchLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
    marginTop: -4,
  },
  watchLinkText: { color: Brand.brandDeep, fontFamily: FONT, fontSize: 13.5, lineHeight: leading(13.5), fontWeight: Weight.bold },

  evRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 12,
    ...Shadow.soft,
  },

  // 타임라인 — 세로 레일 위에 노드. 카드 스택이 아니라서 다른 탭과 다르게 읽힌다.
  feed: { marginTop: -2 },
  feedRow: { flexDirection: "row", gap: 12 },
  feedRail: { width: 30, alignItems: "center" },
  feedLine: { flex: 1, width: 2, backgroundColor: Brand.line2, marginTop: 4, marginBottom: -4 },
  feedBody: { flex: 1, paddingBottom: 18, gap: 2 },
  feedHead: { flexDirection: "row", alignItems: "center", gap: 7, minHeight: 30 },
  feedName: { flex: 1, fontFamily: FONT, fontSize: 14, lineHeight: leading(14), fontWeight: Weight.bold, color: Brand.ink },
  feedTime: { fontFamily: FONT, fontSize: 11.5, lineHeight: leading(11.5), color: Brand.faint },
  feedText: { fontFamily: FONT, fontSize: 14, color: Brand.ink2, lineHeight: 20 },
  feedClap: { flexDirection: "row", marginTop: 6 },

  feedEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.card,
    padding: 14,
  },
  feedEmptyTitle: { fontFamily: FONT, fontSize: 14.5, lineHeight: leading(14.5), fontWeight: Weight.bold, color: Brand.brandDeep },
  feedEmptySub: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.ink2, marginTop: 2 },

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
    fontSize: 14, lineHeight: leading(14), fontWeight: Weight.regular },
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
    fontSize: 14, lineHeight: leading(14), fontWeight: Weight.bold, color: Brand.ink },
  resSub: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.soft, marginTop: 1 },


  // 숫자 강조 규칙은 앱 전역 하나: **숫자=본문/흰색 + 단위=브랜드 블루**


  sectionH: { fontFamily: FONT,
    fontSize: 15, lineHeight: leading(15), fontWeight: Weight.bold, color: Brand.ink, marginTop: 2 },
  // 크루 탭 모임카드와 동일 규칙: 날짜=정보(다크 네이비), 블루 솔리드=액션 전용
  evDate: {
    width: 50,
    height: 50,
    borderRadius: Radius.input,
    backgroundColor: Brand.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  evM: { color: "#fff", fontFamily: FONT,
    fontSize: 10, lineHeight: leading(10), fontWeight: Weight.regular },
  evD: { color: "#fff", fontFamily: FONT,
    fontSize: 19, fontWeight: Weight.bold, lineHeight: 21 },
  evTitle: { fontFamily: FONT,
    fontSize: 14.5, lineHeight: leading(14.5), fontWeight: Weight.bold, color: Brand.ink },
  evMeta: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.soft, marginTop: 3 },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Brand.card,
    borderRadius: Radius.input,
    paddingVertical: 13,
    paddingHorizontal: 14,
    ...Shadow.soft,
  },
  // 골드는 **순위·챌린지·성과** 전용 시그널이다(전역 규칙). 방명록은 커뮤니티 항목이라
  // 골드를 쓰면 "이게 성과인가?"로 읽히고, 골드의 특별함도 희석된다(실기기 확인).
  linkIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { flex: 1, fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), fontWeight: Weight.bold, color: Brand.ink },

  // 랭킹·마이는 하단 탭바로도 갈 수 있는 **보조** 바로가기다. 흰 카드+1px 테두리로 두면
  // ①규칙 위반(테두리만 쓴 카드는 와이어프레임처럼 납작) ②위 카드들과 같은 무게로 보여
  // 카드가 끝없이 반복되는 인상을 키웠다(실기기 확인) → 톤온톤 칩으로 한 단계 낮춘다.
});
