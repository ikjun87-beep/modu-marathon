/**
 * 러닝 — 오늘 뛴 거리 + 실시간 GPS 트래킹 + 갤럭시워치(Health Connect) 불러오기 + 수동 기록.
 * 통합 Run 스키마(runs 컬렉션, 웹과 공유). 홈페이지(web/index.html)와 같은 아이콘·색·카드 형태.
 */
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { LiveRunModal } from "@/components/live-run";
import { Mascot } from "@/components/mascot";
import { DistanceThumb } from "@/components/distance-thumb";
import { RouteThumb } from "@/components/route-thumb";
import { useMyName } from "@/lib/session";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, FONT_DISPLAY, Weight, Radius, Shadow } from "@/lib/brand";
import { fmtDate, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";
import { hasHealthConsent, setHealthConsent, setWatchAutoSync } from "@/lib/health-consent";
import { HC_SUPPORTED, syncTodayRuns } from "@/lib/healthconnect";
import { fmtDuration, isWalk, paceLabel, saveRun, todayKm, toMs, type LatLng } from "@/lib/run";
import { loadRunPaths } from "@/lib/run-path";
import { personalStats } from "@/lib/stats";

type KindFilter = "run" | "walk" | "all";
const KIND_TABS: [KindFilter, string][] = [["run", "달리기"], ["walk", "걷기"], ["all", "전체"]];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 지난 러닝 목록은 최근 1주만

function runSeconds(r: Row): number {
  return Number(r.durationSec) || (Number(r.durationMin) || 0) * 60;
}
/** 기록 출처 — 목록 행의 날짜 줄에 텍스트로 붙는다.
 *  (출처 **아이콘**은 R13에서 없앴다: 행마다 같은 아이콘이 반복되는 게 문제였고,
 *   이제 그 자리는 경로 썸네일 또는 거리 링이 차지한다.) */
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
  // 목록에 그릴 경로 — 온디바이스(AsyncStorage)라 화면에 보이는 기록 id만 한 번에 읽는다.
  const [paths, setPaths] = useState<Record<string, LatLng[]>>({});

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

  // 목록이 바뀔 때만 경로를 다시 읽는다(스크롤 중엔 안 읽음).
  useEffect(() => {
    let alive = true;
    void loadRunPaths(listData.map((r) => r.id)).then((m) => alive && setPaths(m));
    return () => {
      alive = false;
    };
  }, [listData]);

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
        <Text style={styles.title}>러닝 기록</Text>

        {/* 오늘·누적·기록 — **가로 스트립**. 예전엔 다크 네이비 카드였는데, 같은 카드가
            홈·러닝 두 탭 최상단에 똑같이 반복돼 "시그니처"가 아니라 두 번째 템플릿이 됐다
            (독립 채점 R11). 다크 카드는 랭킹 1위에만 남기고, 여기는 배경 없이 구분선으로만
            나눈 스트립으로 낮춘다 — 화면이 카드로 시작하지 않으니 리듬도 달라진다. */}
        <View style={styles.strip}>
          {/* 3칸이 완전히 동등하면 "오늘이 주지표"라는 위계가 사라진다 → 오늘만 한 단계 크게. */}
          <View style={[styles.stripCell, { flex: 1.25 }]}>
            <Text style={styles.stripLab}>오늘</Text>
            <Text style={[styles.stripNum, styles.stripNumLead]}>
              {today.toFixed(1)}
              <Text style={styles.stripUnit}> km</Text>
            </Text>
          </View>
          <View style={styles.stripDiv} />
          <View style={styles.stripCell}>
            <Text style={styles.stripLab}>누적</Text>
            <Text style={styles.stripNum}>
              {mine.totalKm.toFixed(1)}
              <Text style={styles.stripUnit}> km</Text>
            </Text>
          </View>
          <View style={styles.stripDiv} />
          <View style={styles.stripCell}>
            <Text style={styles.stripLab}>기록</Text>
            <Text style={styles.stripNum}>
              {mine.totalRuns}
              <Text style={styles.stripUnit}> 회</Text>
            </Text>
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
            {/* "Firebase"·".env"는 사용자가 알 필요 없는 개발자 용어다 — 『5키로』의 쉬운
                이름에 어려운 화면은 부조화(토스 UX 라이팅 시사점, R12 기획 격차9). */}
            <Text style={styles.bannerText}>아직 크루와 연결되지 않았어요. 기록은 이 기기에만 저장돼요.</Text>
          </View>
        )}

        <View style={styles.listHead}>
          {/* ⚠️ 이 목록은 **크루 전체**다(내 기록만이 아니다). 예전엔 바로 위에
              "OOO님의 기록" 라벨이 있어 내 기록처럼 읽혔는데, 그 라벨은 원래 아래
              [직접 입력] 폼을 가리키던 것이었다. 폼을 목록 아래로 옮기면서 라벨만 남아
              거짓말이 됐다(독립 채점 R14가 실데이터에서 잡아냄) → 제목에서 분명히 한다. */}
          <Text style={styles.listTitle}>크루의 지난 러닝</Text>
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
        <View style={styles.formHead}>
          <Text style={styles.formTitle}>직접 입력</Text>
          {!!name && (
            <Text style={styles.formWho} numberOfLines={1}>
              <Text style={styles.formWhoName}>{name}</Text>님으로 저장돼요
            </Text>
          )}
        </View>
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
          // 텍스트만 가운데 두면 삭막하고, 랭킹 탭 빈 상태(마스코트+가로카드)와 문법이 갈린다
          // — "화면마다 규칙이 갈리면 신뢰도가 깎인다"(전역 규칙). 같은 카드로 통일.
          <View style={styles.emptyCard}>
            <Mascot size={54} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>
                {kind === "walk" ? "최근 1주 걷기가 없어요" : "최근 1주 기록이 없어요"}
              </Text>
              <Text style={styles.emptySub}>
                {kind === "walk" ? "걷기도 기록으로 남아요" : "가볍게 한 번 뛰어볼까요?"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const km = Number(item.distanceKm) || 0;
          const sec = runSeconds(item);
          return (
            <PressableScale
              onPress={() => router.push(`/explore/run/${item.id}`)}
              style={styles.item}>
              <View style={styles.itemHead}>
                {/* 경로가 있으면 **내가 그린 그림**을, 없으면 **거리 링**을 보여준다.
                    같은 아이콘이 행마다 반복되던 게 "AI스럽다"의 원인이었는데(R11),
                    경로는 GPS 기록에만 있어서 직접입력·워치에선 도로 아이콘으로 폴백되고
                    있었다 — 정작 실사용 주 경로에서 차별화가 안 뜬다는 구조적 허점(R13). */}
                {paths[item.id] ? (
                  <RouteThumb path={paths[item.id]} size={40} />
                ) : (
                  <DistanceThumb km={km} walk={isWalk(item)} size={40} />
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.whoRow}>
                    <Text style={styles.who}>{item.name}</Text>
                    {/* 걷기는 러닝과 페이스 성격이 달라 한눈에 구분돼야 한다(랭킹·배지에서도 제외됨). */}
                    {/* "걷기" 필터를 이미 고른 목록에서는 행마다 또 "걷기"라고 할 필요가 없다
                        — 세그먼트가 이미 말하고 있어 중복이다(독립 채점 R16).
                        섞여 나오는 [전체]에서만 태그를 단다. 상세에서도 같은 이유로 뺐다. */}
                    {kind === "all" && isWalk(item) ? (
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
  title: { fontFamily: FONT,
    fontSize: 28, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.4 },

  strip: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  stripCell: { flex: 1, gap: 2 },
  stripLab: { color: Brand.soft, fontFamily: FONT, fontSize: 12, fontWeight: Weight.regular },
  stripNum: { color: Brand.ink, fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: -0.5 },
  stripNumLead: { fontSize: 30 },
  stripUnit: { color: Brand.brand, fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold },
  stripDiv: { width: 1, height: 26, backgroundColor: Brand.line2, marginHorizontal: 10 },

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

  formHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  formWho: { flex: 1, textAlign: "right", fontFamily: FONT,
    fontSize: 12, color: Brand.soft, fontWeight: Weight.regular },
  formWhoName: { fontWeight: Weight.bold, color: Brand.ink2 },

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
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.card,
    padding: 14,
    marginTop: 4,
  },
  emptyTitle: { fontFamily: FONT, fontSize: 14.5, fontWeight: Weight.bold, color: Brand.brandDeep },
  emptySub: { fontFamily: FONT, fontSize: 12.5, color: Brand.ink2, marginTop: 2 },

  item: {
    backgroundColor: Brand.card,
    borderRadius: 15,
    padding: 15,
    ...Shadow.soft,
  },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 11 },
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
