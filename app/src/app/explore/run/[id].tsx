/**
 * 러닝 상세 (push 페이지) — 목록에서 기록을 탭하면 슬라이드로 들어온다.
 * 거리·시간·페이스·심박·소스를 크게 보여주고, GPS 러닝은 저장된 경로를 커스텀 구글맵에 그린다.
 * 경로는 이 기기에만 저장(run-path.ts) — 서버 미저장 원칙 유지. 삭제는 여기서 수행.
 */
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommentThread } from "@/components/comment-thread";
import { Icon, type IconName } from "@/components/icon";
import { RunMap, type RunMapHandle } from "@/components/run-map";
import { ShareSheet } from "@/components/share-sheet";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, FONT_DISPLAY, Weight, Radius, leading } from "@/lib/brand";
import { fmtDate, isMine, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { fmtDuration, isWalk, paceLabel, runSourceLabel, type LatLng } from "@/lib/run";
import { loadRunPath, removeRunPath } from "@/lib/run-path";
import { useMyName } from "@/lib/session";

function sourceIcon(src?: string): IconName {
  if (src === "gps") return "run";
  if (src === "healthconnect" || src === "garmin") return "watch";
  return "plus";
}
/* 출처 라벨은 lib/run.ts의 runSourceLabel 하나로 모았다(목록·검색과 같은 문자열을 쓰기 위해). */
function runSeconds(r: Row): number {
  return Number(r.durationSec) || (Number(r.durationMin) || 0) * 60;
}

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [myName] = useMyName();
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [path, setPath] = useState<LatLng[] | null>(null);
  const [sharing, setSharing] = useState(false);
  const [mapShot, setMapShot] = useState<string | null>(null); // 공유 카드에 넣을 지도 스냅샷
  const mapRef = useRef<RunMapHandle>(null);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => {
    if (id) loadRunPath(id).then(setPath);
  }, [id]);

  const run = useMemo(() => (runs ?? []).find((r) => r.id === id), [runs, id]);
  const mine = useMemo(() => (run ? isMine(run, myName) : false), [run, myName]);

  function onDelete() {
    if (!mine) return; // 버튼이 이미 숨겨져 있지만, 방어적으로 한 번 더 막는다
    Alert.alert("이 기록을 삭제할까요?", "삭제하면 되돌릴 수 없어요.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await remove(COLLECTIONS.runs, id);
          await removeRunPath(id);
          router.back();
        },
      },
    ]);
  }

  const back = (
    <PressableScale style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
      <Icon name="chevron-left" size={24} color={Brand.ink} />
    </PressableScale>
  );

  // 로딩(구독 전) — 스켈레톤
  if (runs === null) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          {back}
          <Text style={styles.topTitle}>러닝 상세</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.body}>
          <Skeleton height={132} radius={18} />
          <Skeleton height={220} radius={18} />
          <Skeleton height={96} radius={18} />
        </View>
      </SafeAreaView>
    );
  }

  // 삭제됨/없음
  if (!run) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          {back}
          <Text style={styles.topTitle}>러닝 상세</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.missing}>
          <Icon name="run" size={30} color={Brand.faint} />
          <Text style={styles.missingText}>기록을 찾을 수 없어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const km = Number(run.distanceKm) || 0;
  const sec = runSeconds(run);
  const hr = run.avgHr ? Math.round(Number(run.avgHr)) : null;
  const gain = run.elevationGainM ? Math.round(Number(run.elevationGainM)) : null;
  const hasPath = !!path && path.length > 1;
  const walk = isWalk(run);

  // 전역 규칙: 숫자=본문색 + **단위=브랜드 블루**(마이 탭·홈·랭킹과 동일 문법)
  // 페이스는 "5'46\"/km" 통짜 문자열이라 단위가 본문색으로 남아 있었다(실기기 확인)
  // → 다른 화면처럼 "/km"을 떼어 단위 색을 입힌다.
  const pace = paceLabel(km, sec);
  const hasPaceUnit = pace.endsWith("/km");
  const tiles: { icon: IconName; label: string; value: string; unit?: string }[] = [
    { icon: "clock", label: "시간", value: fmtDuration(sec) },
    {
      icon: "gauge",
      label: "평균 페이스",
      value: hasPaceUnit ? pace.slice(0, -3) : pace,
      unit: hasPaceUnit ? "/km" : undefined,
    },
  ];
  if (hr) tiles.push({ icon: "heart", label: "평균 심박", value: String(hr), unit: "bpm" });
  // 평지 러닝·워치 기록엔 없다 → 있을 때만 보여준다(0 m 타일은 정보가 아니라 잡음).
  if (gain) tiles.push({ icon: "mountain", label: "상승고도", value: String(gain), unit: "m" });
  // "기록 방식" 타일은 뺀다 — 바로 위 메타줄("TESTM24 · 직접 입력 · 2026.7.27")이 이미
  // 같은 값을 말하고 있어, 카드 한 칸을 중복 정보에 쓰고 있었다(실기기 확인).

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        {back}
        <Text style={styles.topTitle}>{walk ? "걷기 상세" : "러닝 상세"}</Text>
        {/* 공유는 이 화면의 주 액션이라 브랜드 톤 칩으로 띄우고, 되돌릴 수 없는 삭제는
            일부러 무배경 faint로 눌러둔다(위험한 쪽을 더 눈에 띄게 두지 않는다). */}
        <View style={styles.topActions}>
          <PressableScale
            style={styles.shareBtn}
            hitSlop={8}
            onPress={async () => {
              // 화면에 지도가 떠 있으면 그대로 찍어 카드에 넣는다(회장 지시: 티맵·카카오네비처럼).
              // 실패하거나 경로가 없으면 카드가 벡터 경로·거리 링으로 폴백한다.
              setMapShot(await mapRef.current?.snapshot().catch(() => null) ?? null);
              setSharing(true);
            }}>
            <Icon name="share" size={18} color={Brand.brandDeep} />
          </PressableScale>
          {mine ? (
            <PressableScale style={styles.iconBtn} onPress={onDelete} hitSlop={10}>
              <Icon name="trash" size={19} color={Brand.faint} />
            </PressableScale>
          ) : (
            <View style={styles.iconBtn} /> // 자리 유지 — 없으면 공유 버튼이 오른쪽 끝으로 쏠린다
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 메타 */}
        <View style={styles.metaRow}>
          <View style={styles.srcBadge}>
            <Icon name={sourceIcon(run.source)} size={15} color={Brand.brandDeep} />
          </View>
          <Text style={styles.metaText} numberOfLines={1}>
            {run.name} · {runSourceLabel(run.source, run.sourceApp)} ·{" "}
            {fmtDate(run.startedAt ?? run.createdAt)}
          </Text>
        </View>

        {/* 히어로 — 거리 */}
        <View style={styles.hero}>
          {/* 목록에선 회색 링·"걷기" 태그로 구분해놓고 상세로 넘어오면 그 구분이 끊겨,
              걷기 기록을 열어도 "이번 러닝 거리"라고 했다(독립 채점 R15가 새로 발견). */}
          <Text style={styles.heroLab}>{walk ? "이번 걷기 거리" : "이번 러닝 거리"}</Text>
          <View style={styles.heroNumRow}>
            <Text style={styles.heroNum}>{km.toFixed(2)}</Text>
            <Text style={styles.heroUnit}>km</Text>
          </View>
        </View>

        {/* 경로 지도 (GPS · 이 기기에 경로가 있을 때만) */}
        {hasPath ? (
          <View style={styles.mapCard}>
            <RunMap ref={mapRef} path={path!} follow={false} />
          </View>
        ) : (
          run.source === "gps" && (
            <View style={styles.noPath}>
              <Icon name="pin" size={16} color={Brand.faint} />
              <Text style={styles.noPathText}>
                이 러닝은 경로가 저장되기 전 기록이에요. 새 러닝부터 지도가 표시돼요.
              </Text>
            </View>
          )
        )}

        {/* 스탯 타일 */}
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <View key={t.label} style={styles.tile}>
              <View style={styles.tileHead}>
                <Icon name={t.icon} size={14} color={Brand.soft} />
                <Text style={styles.tileLab}>{t.label}</Text>
              </View>
              <Text style={styles.tileVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t.value}
                {t.unit ? <Text style={styles.tileUnit}> {t.unit}</Text> : null}
              </Text>
            </View>
          ))}
        </View>

        {/* 댓글 */}
        <CommentThread parentId={run.id} />
      </ScrollView>

      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        subject={{ kind: "run", run, path }}
        mapImage={mapShot}
      />
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
  topActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  shareBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.input,
    backgroundColor: Brand.brandSoft,
  },
  topTitle: { fontFamily: FONT,
    fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },

  body: { padding: 18, gap: 14, paddingBottom: 48 },

  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  missingText: { color: Brand.soft, fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), fontWeight: Weight.regular },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  srcBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: { flex: 1, fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), color: Brand.soft, fontWeight: Weight.regular },

  hero: { backgroundColor: Brand.dark, borderRadius: Radius.hero, padding: 24 },
  heroLab: { color: "#aab2bb", fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), fontWeight: Weight.regular },
  heroNumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6 },
  heroNum: { color: "#fff", fontFamily: FONT_DISPLAY,
    fontSize: 50, fontWeight: Weight.bold, letterSpacing: -1.5, lineHeight: 52 },
  // ⚠️ **다크 면 위라 brandOnDark**. 라이트용 블루(#2563c9)를 그대로 얹으면 3.06:1로
  // AA 미달이다. 시상대만 고치고 여기를 빼먹어 R15에서 다시 지적받았다 —
  // `backgroundColor: Brand.dark`를 쓰는 곳은 텍스트색을 반드시 전수 확인할 것.
  heroUnit: { color: Brand.brandOnDark, fontFamily: FONT,
    fontSize: 21, fontWeight: Weight.bold, marginLeft: 6, marginBottom: 7 },

  mapCard: { height: 240, borderRadius: Radius.card, overflow: "hidden" },
  noPath: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    padding: 14,
  },
  noPathText: { flex: 1, color: Brand.soft, fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.regular, lineHeight: 18 },

  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
  },
  tileHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  tileLab: { fontFamily: FONT,
    fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft, fontWeight: Weight.regular },
  tileVal: { fontFamily: FONT,
    fontSize: 18, lineHeight: leading(18), fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },
  tileUnit: { fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.bold, color: Brand.brand },
});
