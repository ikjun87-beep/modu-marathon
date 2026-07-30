/**
 * 👏 박수 — Strava kudos의 따뜻한 대안. `docs/DESIGN.md`에 기획만 있고 미구현이던 것을 구현.
 *
 * ## 왜 댓글이 아니라 박수인가
 * 친목 크루에서 반응의 문턱은 낮을수록 좋다. 댓글은 "뭐라고 쓰지"를 요구하지만 박수는 한 번 누르면
 * 끝이다. 상위 앱 공통 패턴이기도 하다 — Strava는 2025년 kudos가 140억 회 오갔고, 그게 피드를
 * 살아있게 만드는 장치다. 우리는 순위 경쟁이 아니라 **응원**을 택했으므로 이쪽이 더 맞는다.
 *
 * ## 구조
 * 참석(attendance)과 완전히 같은 토글: 문서가 있으면 박수한 것, 지우면 취소.
 * targetId는 러닝·사진 등 대상 문서의 id라 컬렉션 하나로 어디에나 붙는다.
 *
 * ⚠️ `claps` 규칙이 아직 배포 전이면 쓰기가 permission-denied로 막힌다. 그때도 화면이 깨지지
 * 않게 실패를 흡수하고 낙관적 UI를 되돌린다 — 응원 하나 때문에 앱이 죽으면 안 된다.
 */
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Radius, Weight, leading } from "@/lib/brand";
import { add, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";

/** 화면 하나에서 여러 버튼이 각자 구독하면 낭비라, 목록 단위로 한 번만 구독해 넘겨줄 수도 있다.
 *  (지금은 대상이 몇 개 안 돼 컴포넌트 내부 구독으로 둔다 — 늘어나면 상위로 끌어올릴 것) */
export function ClapButton({
  targetId,
  myName,
  size = "md",
}: {
  targetId: string;
  myName: string;
  size?: "sm" | "md";
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribe(COLLECTIONS.claps, setRows), []);

  const mine = rows.find((c) => c.targetId === targetId && c.name === myName);
  const count = rows.filter((c) => c.targetId === targetId).length;
  const on = !!mine;
  const sm = size === "sm";

  async function toggle() {
    if (busy) return;
    if (!myName.trim()) return; // 이름이 없으면 누구의 박수인지 기록할 수 없다
    setBusy(true);
    try {
      if (mine) await remove(COLLECTIONS.claps, mine.id);
      else await add(COLLECTIONS.claps, { targetId, name: myName.trim() });
    } catch {
      // 규칙 미배포·오프라인 — 구독이 되돌려주므로 화면은 원래대로 돌아간다
    } finally {
      setBusy(false);
    }
  }

  return (
    <PressableScale
      style={[styles.btn, sm && styles.btnSm, on && styles.btnOn]}
      onPress={() => void toggle()}
      hitSlop={8}
      dim={false}>
      <Text style={[styles.emoji, sm && styles.emojiSm]}>👏</Text>
      {count > 0 && (
        <Text style={[styles.count, sm && styles.countSm, on && styles.countOn]}>{count}</Text>
      )}
    </PressableScale>
  );
}

/** 박수 수만 보여주는 자리(누를 수 없는 맥락 — 남의 프로필 요약 등). */
export function ClapCount({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.btn}>
      <Text style={styles.emoji}>👏</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // 이모지 금지 규칙(docs/DESIGN.md)의 예외 — 👏는 **UI 아이콘이 아니라 감정 표현 자체**다.
  // 커스텀 SVG 손바닥은 "박수"로 안 읽히고, 이 자리에선 이모지가 의미를 가장 정확히 전달한다.
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Brand.warm,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnSm: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  btnOn: { backgroundColor: Brand.brandSoft },
  emoji: { fontSize: 14, lineHeight: leading(14) },
  emojiSm: { fontSize: 12, lineHeight: leading(12) },
  count: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), fontWeight: Weight.bold, color: Brand.soft },
  countSm: { fontSize: 11.5, lineHeight: leading(11.5) },
  countOn: { color: Brand.brandDeep },
});
