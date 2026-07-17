/**
 * 러닝 상세 (push 페이지) — 목록에서 기록을 탭하면 슬라이드로 들어온다.
 * 거리·시간·페이스·심박·소스를 크게 보여주고, GPS 러닝은 저장된 경로를 커스텀 구글맵에 그린다.
 * 경로는 이 기기에만 저장(run-path.ts) — 서버 미저장 원칙 유지. 삭제는 여기서 수행.
 */
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommentThread } from "@/components/comment-thread";
import { Icon, type IconName } from "@/components/icon";
import { RunMap } from "@/components/run-map";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { fmtDate, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { fmtDuration, paceLabel, type LatLng } from "@/lib/run";
import { loadRunPath, removeRunPath } from "@/lib/run-path";

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
function runSeconds(r: Row): number {
  return Number(r.durationSec) || (Number(r.durationMin) || 0) * 60;
}

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [path, setPath] = useState<LatLng[] | null>(null);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => {
    if (id) loadRunPath(id).then(setPath);
  }, [id]);

  const run = useMemo(() => (runs ?? []).find((r) => r.id === id), [runs, id]);

  function onDelete() {
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

  const tiles: { icon: IconName; label: string; value: string }[] = [
    { icon: "activity", label: "시간", value: fmtDuration(sec) },
    { icon: "gauge", label: "평균 페이스", value: paceLabel(km, sec) },
  ];
  if (hr) tiles.push({ icon: "heart", label: "평균 심박", value: `${hr} bpm` });
  // 평지 러닝·워치 기록엔 없다 → 있을 때만 보여준다(0 m 타일은 정보가 아니라 잡음).
  if (gain) tiles.push({ icon: "mountain", label: "상승고도", value: `${gain} m` });
  tiles.push({ icon: sourceIcon(run.source), label: "기록 방식", value: sourceLabel(run.source) });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        {back}
        <Text style={styles.topTitle}>러닝 상세</Text>
        <PressableScale style={styles.iconBtn} onPress={onDelete} hitSlop={10}>
          <Icon name="trash" size={19} color={Brand.faint} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 메타 */}
        <View style={styles.metaRow}>
          <View style={styles.srcBadge}>
            <Icon name={sourceIcon(run.source)} size={15} color={Brand.brandDeep} />
          </View>
          <Text style={styles.metaText}>
            {run.name} · {sourceLabel(run.source)} · {fmtDate(run.startedAt ?? run.createdAt)}
          </Text>
        </View>

        {/* 히어로 — 거리 */}
        <View style={styles.hero}>
          <Text style={styles.heroLab}>이번 러닝 거리</Text>
          <View style={styles.heroNumRow}>
            <Text style={styles.heroNum}>{km.toFixed(2)}</Text>
            <Text style={styles.heroUnit}>km</Text>
          </View>
        </View>

        {/* 경로 지도 (GPS · 이 기기에 경로가 있을 때만) */}
        {hasPath ? (
          <View style={styles.mapCard}>
            <RunMap path={path!} follow={false} />
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
              <Text style={styles.tileVal}>{t.value}</Text>
            </View>
          ))}
        </View>

        {/* 댓글 */}
        <CommentThread parentId={run.id} />
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
  topTitle: { fontFamily: FONT,
    fontSize: 16, fontWeight: Weight.bold, color: Brand.ink },

  body: { padding: 18, gap: 14, paddingBottom: 48 },

  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  missingText: { color: Brand.soft, fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.regular },

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
    fontSize: 13, color: Brand.soft, fontWeight: Weight.regular },

  hero: { backgroundColor: Brand.dark, borderRadius: Radius.hero, padding: 24 },
  heroLab: { color: "#aab2bb", fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular },
  heroNumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6 },
  heroNum: { color: "#fff", fontFamily: FONT,
    fontSize: 58, fontWeight: Weight.bold, letterSpacing: -2, lineHeight: 60 },
  heroUnit: { color: Brand.brand, fontFamily: FONT,
    fontSize: 24, fontWeight: Weight.bold, marginLeft: 7, marginBottom: 8 },

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
    fontSize: 12.5, color: Brand.soft, fontWeight: Weight.regular },
  tileVal: { fontFamily: FONT,
    fontSize: 20, fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },
});
