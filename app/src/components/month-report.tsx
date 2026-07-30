/** 월간 리포트 — 골프 앱 "종합레벨 + 클럽별 분석"의 러닝판.
 *  이번달 vs 지난달 6개 지표(거리·러닝수·뛴날·페이스·최장거리·상승고도) + 주별 페이스 추이.
 *  폰 GPS라 센서 데이터는 없다 → 우리가 가진 것으로 "내가 나아지고 있다"를 보여준다(lib/stats.monthReport). */
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { Brand, FONT, Weight, Radius, Shadow, Semantic, Hairline, leading } from "@/lib/brand";
import type { MonthMetric, MonthReport } from "@/lib/stats";

/** 지난달 대비 좋아졌나 → 색·화살표. 지난달 0이면 신규(중립). */
function delta(m: MonthMetric): { dir: "up" | "down" | "flat"; good: boolean; text: string } {
  if (m.prev === 0 && m.cur === 0) return { dir: "flat", good: false, text: "" };
  if (m.prev === 0) return { dir: "up", good: true, text: "새 기록" };
  const diff = m.cur - m.prev;
  if (Math.abs(diff) < 1e-6) return { dir: "flat", good: false, text: "지난달과 같음" };
  const up = diff > 0;
  const good = m.higherBetter ? up : !up;
  // 페이스는 초라서 diff를 "초" 단위로, 나머지는 값 그대로
  const mag = m.key === "pace" ? `${Math.abs(Math.round(diff))}초` : m.fmt(Math.abs(diff));
  return { dir: up ? "up" : "down", good, text: `지난달 ${m.fmt(m.prev)}${m.unit} · ${up ? "▲" : "▼"}${mag}` };
}

/** firstMonth = 지난달 기록이 아예 없는 달. 이때는 모든 타일이 "새 기록"이 돼
 *  6칸이 같은 초록 문구로 도배된다(실기기 확인) → 델타 줄을 통째로 접고
 *  카드 소제목에서 "첫 리포트"라고 한 번만 말한다. */
function MetricTile({ m, firstMonth }: { m: MonthMetric; firstMonth: boolean }) {
  const d = delta(m);
  const color = d.dir === "flat" ? Brand.soft : d.good ? Semantic.good : Semantic.bad;
  return (
    <View style={styles.tile}>
      <Text style={styles.tLabel}>{m.label}</Text>
      <View style={styles.tValRow}>
        <Text style={styles.tVal}>{m.fmt(m.cur)}</Text>
        <Text style={styles.tUnit}>{m.unit}</Text>
      </View>
      {firstMonth ? null : d.text ? (
        <Text style={[styles.tDelta, { color }]}>{d.text}</Text>
      ) : (
        <Text style={styles.tDelta}> </Text>
      )}
    </View>
  );
}

/** 주별 페이스 추이 — 미니 꺾은선(작을수록 빠름 = 위로). null 주는 건너뜀. */
function PaceTrend({ report }: { report: MonthReport }) {
  const pts = report.paceTrend.filter((p) => p.paceSec != null) as { weekLabel: string; paceSec: number }[];
  if (pts.length < 2) return null;
  const vals = pts.map((p) => p.paceSec);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const W = 100, H = 40; // viewBox 비율(퍼센트 좌표로 그림)
  // 페이스는 작을수록 좋음 → y 위로 갈수록 빠름(작은 값)
  const xy = pts.map((p, i) => {
    const x = pts.length === 1 ? 50 : (i / (pts.length - 1)) * W;
    const y = ((p.paceSec - min) / span) * (H - 10) + 5; // 작을수록 y작음(위)
    return { x, y };
  });
  return (
    <View style={styles.trend}>
      <Text style={styles.trendH}>주별 평균 페이스</Text>
      <View style={styles.trendBox}>
        {xy.map((p, i) => {
          if (i === 0) return null;
          const a = xy[i - 1], b = p;
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          return (
            <View
              key={i}
              style={[
                styles.seg,
                {
                  left: `${a.x}%`,
                  top: `${(a.y / H) * 100}%`,
                  width: `${len}%`,
                  transform: [{ rotateZ: `${ang}deg` }],
                },
              ]}
            />
          );
        })}
        {xy.map((p, i) => (
          <View key={`d${i}`} style={[styles.dot, { left: `${p.x}%`, top: `${(p.y / H) * 100}%` }]} />
        ))}
      </View>
      <View style={styles.trendLabels}>
        {pts.map((p, i) => (
          <Text key={i} style={styles.trendLabel}>{p.weekLabel}</Text>
        ))}
      </View>
    </View>
  );
}

export function MonthReportCard({ report }: { report: MonthReport }) {
  const firstMonth = report.hasData && report.metrics.every((m) => m.prev === 0);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.eyebrowRow}>
          <Icon name="award" size={15} color={Brand.brand} />
          <Text style={styles.eyebrow}>MONTHLY REPORT</Text>
        </View>
        <Text style={styles.title}>{report.monthLabel} 리포트</Text>
        <Text style={styles.sub}>
          {/* 320dp에서 2줄로 넘쳐 카드가 커졌다 → 한 줄로. */}
          {firstMonth ? "이번 달 첫 리포트예요" : "지난달과 비교한 내 러닝"}
        </Text>
      </View>

      {report.hasData ? (
        <>
          <View style={styles.grid}>
            {report.metrics.map((m) => (
              <MetricTile key={m.key} m={m} firstMonth={firstMonth} />
            ))}
          </View>
          <PaceTrend report={report} />
        </>
      ) : (
        // 텍스트만 두면 휑하다 — 지표가 **채워질 자리**를 옅은 타일로 미리 보여준다.
        // (마스코트를 쓰면 같은 화면 아래 CTA 카드의 마스코트와 겹쳐 중복이 된다.)
        <View style={styles.emptyWrap}>
          {/* 타일 4개는 빈 카드를 너무 키워 아래 리더보드를 화면 밖으로 밀어냈다 → 2개만 예고.
              ⚠️ 빈 회색 상자만 두면 "로딩 중인가?"로 읽힌다(실기기 확인) → 무엇이 채워질지
              라벨로 밝혀야 '예고'라는 의도가 전달된다. */}
          <View style={styles.ghostGrid}>
            {["총 거리", "러닝 수"].map((label) => (
              <View key={label} style={styles.ghostTile}>
                <Text style={styles.ghostLabel}>{label}</Text>
                <Text style={styles.ghostDash}>—</Text>
              </View>
            ))}
          </View>
          {/* 2줄이면 빈 카드가 커져 아래 리더보드를 화면 밖으로 밀어낸다 → 1줄로. */}
          <Text style={styles.empty}>첫 러닝을 남기면 리포트가 채워져요!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 14,
    ...Shadow.soft,
    ...Hairline,
  },
  head: { gap: 2 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { fontFamily: FONT, fontSize: 11, lineHeight: leading(11), fontWeight: Weight.bold, letterSpacing: 1.5, color: Brand.brand },
  title: { fontFamily: FONT, fontSize: 18, lineHeight: leading(18), fontWeight: Weight.bold, color: Brand.ink },
  sub: { fontFamily: FONT, fontSize: 13, lineHeight: leading(13), color: Brand.soft },
  emptyWrap: { gap: 12 },
  ghostGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ghostTile: {
    width: "48%",
    flexGrow: 1,
    borderRadius: Radius.input,
    backgroundColor: Brand.bg,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 1,
  },
  ghostLabel: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft },
  ghostDash: { fontFamily: FONT, fontSize: 18, lineHeight: leading(18), fontWeight: Weight.bold, color: Brand.faint },
  empty: { fontFamily: FONT, fontSize: 13.5, color: Brand.soft, lineHeight: 21, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: Brand.bg,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
  },
  tLabel: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft },
  tValRow: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  tVal: { fontFamily: FONT, fontSize: 21, lineHeight: leading(21), fontWeight: Weight.bold, color: Brand.ink },
  // 전역 규칙: 숫자=본문색 + 단위=브랜드 블루. 이 카드만 단위가 회색이라
  // 홈·러닝·랭킹과 표기가 갈려 있었다(실기기 확인) → 다른 화면과 같은 문법으로.
  tUnit: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand, marginBottom: 3 },
  tDelta: { fontFamily: FONT, fontSize: 11, lineHeight: leading(11), fontWeight: Weight.bold },
  trend: { gap: 8, marginTop: 2 },
  trendH: { fontFamily: FONT, fontSize: 13, lineHeight: leading(13), fontWeight: Weight.bold, color: Brand.ink },
  trendBox: { height: 56, position: "relative", marginHorizontal: 4 },
  seg: { position: "absolute", height: 2.5, backgroundColor: Brand.brand, borderRadius: 2 },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: Brand.brand,
  },
  trendLabels: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 4 },
  trendLabel: { fontFamily: FONT, fontSize: 10.5, lineHeight: leading(10.5), color: Brand.faint },
});
