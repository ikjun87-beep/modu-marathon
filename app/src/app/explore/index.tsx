/**
 * 러닝 — 오늘 뛴 거리 + 실시간 GPS 트래킹 + 갤럭시워치(Health Connect) 불러오기 + 수동 기록.
 * 통합 Run 스키마(runs 컬렉션, 웹과 공유). 홈페이지(web/index.html)와 같은 아이콘·색·카드 형태.
 */
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icon";
import { LiveRunModal } from "@/components/live-run";
import { useMyName } from "@/lib/session";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, FONT_DISPLAY, Weight, Radius, Shadow } from "@/lib/brand";
import { fmtDate, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";
import { hasHealthConsent, setHealthConsent, setWatchAutoSync } from "@/lib/health-consent";
import { HC_SUPPORTED, syncTodayRuns } from "@/lib/healthconnect";
import { fmtDuration, isWalk, paceLabel, saveRun, todayKm, toMs } from "@/lib/run";
import { personalStats } from "@/lib/stats";

type KindFilter = "run" | "walk" | "all";
const KIND_TABS: [KindFilter, string][] = [["run", "달리기"], ["walk", "걷기"], ["all", "전체"]];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 지난 러닝 목록은 최근 1주만

function runSeconds(r: Row): number {
  return Number(r.durationSec) || (Number(r.durationMin) || 0) * 60;
}
function sourceIcon(src?: string): IconName {
  if (src === "gps") return "run";
  if (src === "healthconnect" || src === "garmin") return "watch";
  return "plus";
}
function sourceLabel(src?: string): string {
  if (src === "gps") return "GPS 러닝";
  if (src === "healthconnect") return "갤럭시워치";
  if (src === "garmin") return "가민";
  return "직접 입력";
}

/** 페이스 = 숫자(본문색) + 단위(브랜드 블루) — 전역 규칙.
 *  paceLabel이 "7'33\"/km" 통짜라 목록에서만 단위가 본문색으로 남아 상세·리포트와 갈렸다.
 *  거리를 몰라 계산 불가일 때("-")는 단위를 붙이지 않는다. */
function PaceText({ km, sec }: { km: number; sec: number }) {
  const label = paceLabel(km, sec);
  const hasUnit = label.endsWith("/km");
  return (
    <Text style={styles.pace} numberOfLines={1}>
      {hasUnit ? label.slice(0, -3) : label}
      {hasUnit ? <Text style={styles.paceUnit}>/km</Text> : null}
    </Text>
  );
}

export default function RunScreen() {
  // 러너 네임은 **읽기 전용**으로 쓴다 — 편집 UI가 크루·러닝·마이 세 곳에 흩어져 있어
  // 어디가 진짜 소스인지 불명확했다(디자인 감사 지적). 편집은 크루·마이 탭에서만.
  const [name] = useMyName();
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [runs, setRuns] = useState<Row[]>([]);
  const [live, setLive] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 수동 기록 저장 중 — 더블탭 이중저장 방지
  const [kind, setKind] = useState<KindFilter>("run"); // 지난 러닝 목록 필터 — 기본은 달리기

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);

  // 상단 카드는 "오늘 뛴 거리 / 누적"이라 **러닝 기준**으로 센다(걷기 제외 — todayKm도 동일).
  // 아래 목록은 걷기까지 보여주되 '걷기' 태그로 구분한다: 통계는 러닝, 로그는 전부.
  //
  // ⚠️ 이 카드는 **전부 내 기준**이어야 한다. 예전엔 좌측(오늘)만 내 기록이고 우측(누적·기록)이
  //   크루 전체 합계라, 카드 바로 아래 "OOO님의 기록" 라벨과 어긋났다. 실기기에서 러닝 탭은
  //   "누적 6.4km·1회"인데 마이 탭은 "총 거리 0.0km·0회"로 갈렸다(2026-07-27 발견).
  //   마이 탭과 **같은 personalStats**를 써서 두 화면이 갈릴 수 없게 한다(이름 필터+데모 제외 동일).
  const mine = useMemo(() => personalStats(runs, name || undefined), [runs, name]);
  const today = useMemo(() => todayKm(runs, name || undefined), [runs, name]);

  // 지난 러닝 목록 = 최근 1주 + 걷기/달리기 필터(기본 달리기). 상단 카드 집계는 그대로 전체 기준.
  const listData = useMemo(() => {
    const since = Date.now() - WEEK_MS;
    return runs.filter((r) => {
      const t = toMs(r.startedAt ?? r.createdAt);
      if (t && t < since) return false;
      if (kind === "run") return !isWalk(r);
      if (kind === "walk") return isWalk(r);
      return true;
    });
  }, [runs, kind]);

  async function submitManual() {
    if (submitting) return; // 이미 저장 중 — 더블탭 시 두 번째 문서 생성 방지(수동 기록엔 sourceId 멱등이 없음)
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요");
      return;
    }
    const km = parseFloat(distance);
    const min = parseFloat(duration);
    if (!(km > 0) || !(min > 0)) {
      Alert.alert("거리(km)와 시간(분)을 숫자로 입력해 주세요");
      return;
    }
    setSubmitting(true);
    try {
      await saveRun({ source: "manual", name: name.trim(), distanceKm: km, durationSec: min * 60 });
      setDistance("");
      setDuration("");
    } catch {
      Alert.alert("저장에 실패했어요", "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function syncWatch() {
    if (syncing) return; // 이중 실행 방지 — 동의창이 떠 있는 동안 재탭 차단(네이티브 중복 호출 방지)
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요");
      return;
    }
    if (!HC_SUPPORTED) {
      Alert.alert(
        "갤럭시워치 연동",
        "워치 자동 연동은 안드로이드 실기기(dev build)에서 열려요. 폰에 Health Connect 설치 + 삼성헬스 동기화가 필요합니다."
      );
      return;
    }
    setSyncing(true); // 흐름 시작 즉시 잠금(동의창 표시 중에도 버튼 비활성)
    // 심박은 민감정보(건강) — 별도 동의가 있을 때만 함께 수집. 최초 1회 명시 동의.
    const consented = await hasHealthConsent();
    if (consented) {
      await runWatchSync(true);
      return;
    }
    // 고지 범위 = ①심박(민감정보) 수집 ②앱을 열 때 자동으로 불러옴 ③끄는 방법.
    // ②를 빼놓고 자동 수집을 켜면 고지 없는 수집이 된다 — 그래서 동의 키도 v2로 올렸다.
    Alert.alert(
      "워치 기록 불러오기 동의",
      "갤럭시워치 기록을 불러옵니다.\n\n" +
        "• 심박 등 건강정보(민감정보)를 함께 저장하려면 별도 동의가 필요해요. 동의하지 않아도 거리·시간·페이스는 불러올 수 있어요.\n" +
        "• 앞으로는 앱을 열 때 오늘 기록을 자동으로 불러옵니다(최소 30분 간격).\n" +
        "• 자동 불러오기는 마이 탭에서 언제든 끌 수 있어요.",
      [
        { text: "취소", style: "cancel", onPress: () => setSyncing(false) },
        {
          text: "심박 없이 불러오기",
          onPress: async () => {
            await setWatchAutoSync(true); // 자동은 켜되 심박은 안 읽는다(최소수집)
            await runWatchSync(false);
          },
        },
        {
          text: "동의하고 불러오기",
          onPress: async () => {
            await setHealthConsent(true);
            await setWatchAutoSync(true);
            await runWatchSync(true);
          },
        },
      ],
      { onDismiss: () => setSyncing(false) }
    );
  }

  async function runWatchSync(withHeartRate: boolean) {
    setSyncing(true);
    try {
      const r = await syncTodayRuns(name.trim(), { readHeartRate: withHeartRate });
      // 걷기도 불러오므로 "러닝 N개"라고만 하면 거짓말이 된다. 실제로 뭘 가져왔는지 그대로 알린다.
      const runs = r.synced - r.walks;
      const what = [runs > 0 && `러닝 ${runs}개`, r.walks > 0 && `걷기 ${r.walks}개`]
        .filter(Boolean)
        .join(" · ");
      Alert.alert(
        r.ok ? "워치 동기화 완료" : "워치 동기화",
        r.reason ?? `오늘 ${what} · ${r.totalKm.toFixed(1)}km 불러왔어요`
      );
    } finally {
      setSyncing(false);
    }
  }

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Icon name="activity" size={15} color={Brand.brand} />
          <Text style={styles.eyebrow}>RUNNING</Text>
        </View>
        <Text style={styles.title}>러닝 기록</Text>

        {/* 오늘 뛴 거리 — 실시간 집계 */}
        <View style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={styles.todayLab}>오늘 뛴 거리</Text>
            <View style={styles.todayNumRow}>
              <Text style={styles.todayNum}>{today.toFixed(1)}</Text>
              <Text style={styles.todayUnit}>km</Text>
            </View>
          </View>
          <View style={styles.todayDiv} />
          <View style={styles.todayMeta}>
            {/* 좌측 주지표와 같은 단위 문법: 숫자(흰색) + 단위(블루) */}
            <Text style={styles.todayMetaNum}>
              {mine.totalKm.toFixed(1)}
              <Text style={styles.todayMetaUnit}> km</Text>
            </Text>
            <Text style={styles.todayMetaLab}>누적</Text>
            <Text style={[styles.todayMetaNum, { marginTop: 8 }]}>
              {mine.totalRuns}
              <Text style={styles.todayMetaUnit}> 회</Text>
            </Text>
            <Text style={styles.todayMetaLab}>기록</Text>
          </View>
        </View>

        {/* 실시간 GPS + 워치 불러오기 */}
        <View style={styles.ctaRow}>
          <PressableScale style={[styles.cta, styles.ctaPrimary]} onPress={() => setLive(true)}>
            <Icon name="play" size={20} color="#fff" />
            <Text style={styles.ctaPrimaryText}>러닝 시작</Text>
          </PressableScale>
          <PressableScale
            style={[styles.cta, styles.ctaSecondary]}
            onPress={syncWatch}
            disabled={syncing}>
            <Icon name="watch" size={20} color={Brand.ink} />
            <Text style={styles.ctaSecondaryText}>
              {syncing ? "불러오는 중…" : "워치 불러오기"}
            </Text>
          </PressableScale>
        </View>
        {!HC_SUPPORTED && (
          <Text style={styles.watchHint}>
            갤럭시워치 자동 연동은 안드로이드 dev build에서 열려요.
          </Text>
        )}

        {!HAS_FIREBASE && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Firebase 미설정 — 이 기기에만 저장됩니다.</Text>
          </View>
        )}

        {!!name && (
          <View style={styles.whoBar}>
            <Icon name="users" size={14} color={Brand.soft} />
            <Text style={styles.whoBarText}>
              <Text style={styles.whoBarName}>{name}</Text>님의 기록
            </Text>
          </View>
        )}

        <View style={styles.listHead}>
          <Text style={styles.listTitle}>지난 러닝</Text>
          <Text style={styles.listHint}>최근 1주</Text>
        </View>
        <View style={styles.segRow}>
          {KIND_TABS.map(([k, label]) => (
            <PressableScale
              key={k}
              style={[styles.seg, kind === k && styles.segOn]}
              onPress={() => setKind(k)}
              dim={false}>
              <Text style={[styles.segText, kind === k && styles.segTextOn]}>{label}</Text>
            </PressableScale>
          ))}
        </View>
      </View>
    ),
    [name, mine, today, syncing, kind]
  );

  // 직접 입력은 **보조 경로**(주 경로 = 러닝 시작·워치 불러오기)인데 헤더에 있어서
  // 첫 뷰포트를 통째로 먹고 정작 "지난 러닝"을 화면 밖으로 밀어냈다(실기기 확인).
  // 첫 뷰포트 = 상태요약1 + CTA1 + 최근항목1 규칙에 맞춰 목록 아래로 내린다.
  const footer = useMemo(
    () => (
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>직접 입력</Text>
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.formLabel}>거리 (km)</Text>
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="5"
              placeholderTextColor={Brand.placeholder}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.formLabel}>시간 (분)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              placeholderTextColor={Brand.placeholder}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <PressableScale
          style={[styles.addBtn, submitting && styles.addBtnOff]}
          onPress={submitManual}
          disabled={submitting}
        >
          <Icon name="plus" size={18} color={Brand.brandDeep} />
          <Text style={styles.addBtnText}>{submitting ? "저장 중…" : "기록 추가"}</Text>
        </PressableScale>
      </View>
    ),
    // submitManual은 매 렌더 새로 만들어지므로 의존성에 넣지 않는다(넣으면 memo가 무의미).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [distance, duration, submitting]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={listData}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>
            {kind === "walk"
              ? "최근 1주 걷기 기록이 없어요."
              : kind === "all"
                ? "최근 1주 기록이 없어요. 러닝을 시작해 보세요!"
                : "최근 1주 달리기 기록이 없어요. 러닝을 시작해 보세요!"}
          </Text>
        }
        renderItem={({ item }) => {
          const km = Number(item.distanceKm) || 0;
          const sec = runSeconds(item);
          return (
            <PressableScale
              onPress={() => router.push(`/explore/run/${item.id}`)}
              style={styles.item}>
              <View style={styles.itemHead}>
                <View style={styles.srcBadge}>
                  <Icon name={sourceIcon(item.source)} size={15} color={Brand.brandDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.whoRow}>
                    <Text style={styles.who}>{item.name}</Text>
                    {/* 걷기는 러닝과 페이스 성격이 달라 한눈에 구분돼야 한다(랭킹·배지에서도 제외됨). */}
                    {isWalk(item) ? (
                      <View style={styles.walkTag}>
                        <Text style={styles.walkTagText}>걷기</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.date}>
                    {sourceLabel(item.source)} · {fmtDate(item.startedAt ?? item.createdAt)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={Brand.faint} />
              </View>
              {/* 4개 값이 한 줄 — 좁은 폰에서도 안 넘치게 각 항목에 numberOfLines + 축소를 건다. */}
              <View style={styles.stats}>
                <Text style={styles.stat} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  <Text style={styles.statNum}>{km.toFixed(2)}</Text>
                  <Text style={styles.statUnit}> km</Text>
                </Text>
                <Text style={styles.stat} numberOfLines={1}>
                  <Text style={styles.statNum}>{fmtDuration(sec)}</Text>
                </Text>
                <PaceText km={km} sec={sec} />
                {item.avgHr ? (
                  // 전역 규칙: 숫자=본문색 + 단위/기호=브랜드 블루.
                  // 통짜로 블루라 이 한 항목만 숫자가 파랗게 튀었다(실기기 확인).
                  <Text style={styles.hr} numberOfLines={1}>
                    <Text style={styles.hrMark}>♥ </Text>
                    {Math.round(Number(item.avgHr))}
                  </Text>
                ) : null}
              </View>
            </PressableScale>
          );
        }}
      />
      <LiveRunModal
        visible={live}
        name={name}
        onClose={(saved) => {
          setLive(false);
          if (saved) Alert.alert("러닝 완료", "오늘 기록이 저장됐어요! 🎉");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 160 },
  header: { gap: 14, marginBottom: 4 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold, letterSpacing: 3, color: Brand.brand },
  title: { fontFamily: FONT,
    fontSize: 26, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },

  todayCard: {
    flexDirection: "row",
    backgroundColor: Brand.dark,
    borderRadius: Radius.card,
    padding: 18,
    alignItems: "center",
    ...Shadow.card,
  },
  todayLeft: { flex: 1 },
  todayLab: { color: "#aab2bb", fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular },
  todayNumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  todayNum: { color: "#fff", fontFamily: FONT_DISPLAY,
    fontSize: 40, fontWeight: Weight.bold, letterSpacing: -1.2, lineHeight: 42 },
  todayUnit: { color: Brand.brand, fontFamily: FONT,
    fontSize: 18, fontWeight: Weight.bold, marginLeft: 5, marginBottom: 5 },
  todayDiv: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,.12)",
    marginHorizontal: 18,
  },
  todayMeta: { alignItems: "flex-end" },
  todayMetaNum: { color: "#fff", fontFamily: FONT,
    fontSize: 16, fontWeight: Weight.bold },
  todayMetaUnit: { color: Brand.brand, fontFamily: FONT,
    fontSize: 12, fontWeight: Weight.bold },
  todayMetaLab: { color: "#8b929b", fontFamily: FONT,
    fontSize: 11, fontWeight: Weight.regular },

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
  ctaPrimary: { backgroundColor: Brand.brand, ...Shadow.soft },
  ctaPrimaryText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },
  ctaSecondary: { backgroundColor: Brand.brandSoft },
  ctaSecondaryText: { color: Brand.brandDeep, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },
  watchHint: { color: Brand.faint, fontFamily: FONT,
    fontSize: 12, marginTop: -6 },

  banner: {
    backgroundColor: "#fff6ec",
    borderWidth: 1,
    borderColor: "#f2ddbe",
    borderRadius: Radius.input,
    padding: 12,
  },
  bannerText: { color: "#7a4a0a", fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.regular },

  formCard: {
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 10,
    marginTop: 14, // 목록 아래로 내려왔으니 마지막 기록 카드와 확실히 떨어뜨린다
    ...Shadow.soft,
  },
  formTitle: { fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.bold, color: Brand.ink },
  formRow: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 6 },
  formLabel: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular, color: Brand.ink2 },
  input: {
    borderWidth: 1,
    borderColor: Brand.line2,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT,
    fontSize: 15,
    color: Brand.ink,
  },
  // 수동 기록은 GPS·워치를 못 쓸 때 쓰는 **보조** 수단 — 주 CTA("러닝 시작")와 같은
  // 솔리드 파랑이면 무게가 충돌한다. 톤온톤으로 한 단계 낮춘다.
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.input,
    paddingVertical: 13,
    minHeight: 48,
  },
  addBtnOff: { opacity: 0.6 },
  addBtnText: { color: Brand.brandDeep, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },

  whoBar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -4 },
  whoBarText: { fontFamily: FONT,
    fontSize: 13, color: Brand.soft, fontWeight: Weight.regular },
  whoBarName: { fontWeight: Weight.bold, color: Brand.ink },

  listHead: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 },
  listTitle: { fontFamily: FONT,
    fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  listHint: { fontFamily: FONT,
    fontSize: 12, color: Brand.faint, fontWeight: Weight.regular },
  // 미선택 탭이 흰 배경+연회색이라 "탭이 3개 있다"는 것 자체가 안 보였다(접근성 결함).
  // 미선택도 톤온톤 배경 + 본문색 텍스트로 올려 WCAG AA 대비를 확보한다.
  //
  // 세그먼트 컨트롤은 **트랙 + 선택된 흰 pill** 문법으로 통일한다 — 계정 시트(로그인/가입)가
  // 이미 이 문법인데 여기만 낱개 칩이라 같은 컨트롤이 화면마다 다르게 보였다(실기기 확인).
  // 선택색을 블루 솔리드(=액션)나 다크(=정보 블록)로 쓰던 문제도 이 문법이면 함께 사라진다.
  segRow: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Brand.warm,
    borderRadius: Radius.input,
    padding: 4,
  },
  seg: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: Radius.chip,
  },
  segOn: { backgroundColor: Brand.card, ...Shadow.soft },
  segText: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular, color: Brand.soft },
  segTextOn: { color: Brand.brandDeep, fontWeight: Weight.bold },
  empty: { color: Brand.soft, fontFamily: FONT,
    fontSize: 14, textAlign: "center", paddingVertical: 24 },

  item: {
    backgroundColor: Brand.card,
    borderRadius: 15,
    padding: 15,
    ...Shadow.soft,
  },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  srcBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  whoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  who: { fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 14.5, color: Brand.ink },
  walkTag: {
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.chip,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  walkTagText: { fontFamily: FONT,
    fontSize: 10.5, fontWeight: Weight.bold, color: Brand.brandDeep },
  date: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, marginTop: 1 },
  // 거리·시간·페이스·심박 4개가 한 줄에 들어가야 한다. 예전 크기(18/13.5·gap16)로는
  // "6.40km 48:16 7'33\"/km ♥143"이 칸을 넘쳤다(회장 지적) → 값·간격을 한 단계씩 줄인다.
  stats: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  stat: { fontFamily: FONT,
    fontSize: 12.5, color: Brand.soft },
  statNum: { fontFamily: FONT,
    fontSize: 16, fontWeight: Weight.bold, color: Brand.ink },
  statUnit: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand },
  // 페이스는 성과·순위 신호가 아니라 기록값 — 골드는 리더보드 순위·챌린지 전용으로 남긴다.
  pace: { marginLeft: "auto", fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.ink2 },
  paceUnit: { color: Brand.brand },
  hr: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.ink },
  hrMark: { color: Brand.brand },
});
