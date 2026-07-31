/**
 * 배지 획득 축하 — 새 배지를 딴 **순간** 어느 화면에서든 뜬다.
 *
 * 왜 루트에 있나: 배지는 마이 탭에 있지만 실제로 따는 순간은 러닝을 저장할 때(러닝 탭)나
 * 워치를 불러올 때다. 마이 탭에서만 띄우면 "딴 순간"의 감동이 사라진다. → _layout에 얹어 전역.
 *
 * 의존성 없음: 콘페티는 reanimated(이미 있음)로 직접 그린다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Icon, type IconName } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { ShareSheet } from "@/components/share-sheet";
import { Brand, Team, FONT, Weight, Radius, leading } from "@/lib/brand";
import { loadSeenBadges, saveSeenBadges } from "@/lib/badge-seen";
import { subscribe, type Row } from "@/lib/crew";
import { MASCOT_NAME } from "@/lib/mascot";
import { COLLECTIONS } from "@/lib/firebase";
import { useMyName } from "@/lib/session";
import { badgeProgress, type Badge } from "@/lib/stats";

const { width: W } = Dimensions.get("window");
const CONFETTI = 18;
// 파일럿 팔레트(안 A) — 하드코딩 하늘색(#8ab4f8)이 새 크림+그린+골드 팔레트에서 튀는 이물질처럼
// 보여서 뺐다. 대신 기존 토큰인 Team.red를 넣어 "레드팀 색"도 자연스럽게 섞이게 했다.
const COLORS = [Brand.brand, Brand.accent, Brand.brandDeep, Team.red, "#f5c451"];

/** 조각 하나 — 위에서 흩뿌려져 떨어지며 회전. 값은 index로 고정(랜덤 재생성 방지). */
function Confetti({ i }: { i: number }) {
  const p = useSharedValue(0);
  // 결정적 분포 — 매 렌더 흔들리지 않게 index에서 뽑는다
  const x = ((i * 37) % 100) / 100; // 0..1 가로 위치
  const delay = (i % 6) * 70;
  const drift = (((i * 53) % 60) - 30) * 1.6; // 좌우로 흘러가는 정도
  const spin = ((i % 2 === 0 ? 1 : -1) * (240 + (i * 31) % 240));
  const size = 6 + (i % 3) * 3;
  const color = COLORS[i % COLORS.length];

  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }));
  }, [delay, p]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.85 ? 1 : (1 - p.value) / 0.15,
    transform: [
      { translateY: -40 + p.value * 420 },
      { translateX: p.value * drift },
      { rotate: `${p.value * spin}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: x * (W - 20),
          top: 0,
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function Card({
  badge,
  name,
  onShare,
  onClose,
}: {
  badge: Badge;
  name: string;
  onShare: () => void;
  onClose: () => void;
}) {
  const s = useSharedValue(0.6);
  const o = useSharedValue(0);

  useEffect(() => {
    o.value = withTiming(1, { duration: 180 });
    // 뿅 하고 커졌다가 살짝 자리잡는 느낌
    s.value = withSequence(
      withSpring(1.06, { damping: 9, stiffness: 160 }),
      withSpring(1, { damping: 14 })
    );
  }, [o, s]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ scale: s.value }],
  }));

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* 마스코트가 배지를 들고 축하해주는 모양 — 아이콘만 있으면 사무적이다 */}
      <View style={styles.crest}>
        <Mascot size={92} />
        <View style={styles.badgeIcon}>
          <Icon name={badge.icon as IconName} size={26} color="#fff" />
        </View>
      </View>
      {/* 오키가 92px로 크게 나오는 유일한 자리 — 이름이 얼굴에 붙기 좋다.
          기능 화면(랭킹·러닝 빈 상태)에는 이름을 넣지 않는다: 거기선 "무엇을 하라"가
          메시지이고 이름을 끼우면 소음이 된다(lib/mascot.ts 주석). */}
      <Text style={styles.eyebrow}>{MASCOT_NAME}가 축하해요</Text>
      <Text style={styles.title}>{badge.label}</Text>
      <Text style={styles.desc}>{badge.desc}</Text>
      {/* 자랑 동기가 가장 큰 순간이 바로 여기다 — 배지를 딴 직후. 러닝 상세까지 찾아 들어가야
          공유할 수 있으면 그 순간을 놓친다(2026-07-31 공유 카드 2차 착수).
          단 주 액션은 [좋아요!] 하나로 둔다: 공유는 톤온톤 보조 버튼. */}
      <View style={styles.actions}>
        <Pressable style={styles.shareBtn} onPress={onShare} hitSlop={8}>
          <Icon name="share" size={16} color={Brand.brandDeep} />
          <Text style={styles.shareText}>자랑하기</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onClose} hitSlop={8}>
          <Text style={styles.btnText}>좋아요!</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function BadgeCelebration() {
  const [name] = useMyName();
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [queue, setQueue] = useState<Badge[]>([]); // 한 번에 2개 딸 수도 있어 큐로
  // 공유 시트가 열려 있는 동안 축하 카드는 닫는다 — 겹쳐 두면 배지 카드가 미리보기를 가린다.
  const [sharing, setSharing] = useState<{ badge: Badge; at: number } | null>(null);
  const seen = useRef<Set<string> | null>(null);
  // ⚠️ ref가 아니라 state여야 한다 — ref는 바뀌어도 리렌더가 안 나서,
  //    저장소 로딩이 배지 계산보다 늦게 끝나면 아래 effect가 다시 안 돌고 축하가 영영 안 뜬다.
  const [seenLoaded, setSeenLoaded] = useState(false);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);

  useEffect(() => {
    void loadSeenBadges().then((s) => {
      seen.current = s;
      setSeenLoaded(true);
    });
  }, []);

  const earnedIds = useMemo(() => {
    if (!runs || !name) return null; // 아직 모름 — 섣불리 비교하면 오탐
    return new Set(
      badgeProgress(runs, name)
        .filter((p) => p.earned)
        .map((p) => p.badge.id)
    );
  }, [runs, name]);

  useEffect(() => {
    if (!earnedIds || !seenLoaded) return;

    // 첫 실행(또는 재설치) — 축하 없이 현재 상태를 심어둔다. 안 그러면 켜자마자 5연발.
    if (seen.current == null) {
      seen.current = earnedIds;
      void saveSeenBadges(earnedIds);
      return;
    }

    const fresh = [...earnedIds].filter((id) => !seen.current!.has(id));
    if (!fresh.length) return;

    const badges = badgeProgress(runs ?? [], name)
      .filter((p) => fresh.includes(p.badge.id))
      .map((p) => p.badge);
    setQueue((q) => [...q, ...badges]);
    seen.current = earnedIds;
    void saveSeenBadges(earnedIds);
  }, [earnedIds, seenLoaded, runs, name]);

  if (!queue.length && !sharing) return null;
  const current = queue[0];

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {current ? (
        <>
          <Pressable style={styles.scrim} onPress={() => setQueue((q) => q.slice(1))} />
          {Array.from({ length: CONFETTI }, (_, i) => (
            <Confetti key={`${current.id}-${i}`} i={i} />
          ))}
          <Card
            badge={current}
            name={name}
            // 획득 시각은 여기서 한 번 고정한다 — 카드 안에서 Date.now()를 부르면
            // 리렌더마다 날짜가 새로 계산돼 흔들린다.
            onShare={() => setSharing({ badge: current, at: Date.now() })}
            onClose={() => setQueue((q) => q.slice(1))}
          />
        </>
      ) : null}

      {sharing ? (
        <ShareSheet
          visible
          onClose={() => setSharing(null)}
          subject={{ kind: "badge", badge: sharing.badge, name, earnedAt: sharing.at }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12,16,26,0.45)",
  },
  card: {
    width: "78%",
    backgroundColor: Brand.card,
    borderRadius: Radius.hero,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    gap: 6,
  },
  crest: { marginBottom: 4 },
  // 배지는 마스코트 오른쪽 아래에 살짝 겹쳐 — "얘가 이걸 땄다"가 한눈에 읽힌다
  badgeIcon: {
    position: "absolute",
    right: -6,
    bottom: -2,
    width: 46,
    height: 46,
    borderRadius: Radius.card,
    backgroundColor: Brand.brand,
    borderWidth: 3,
    borderColor: Brand.card,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { fontFamily: FONT,
    fontSize: 11.5, lineHeight: leading(11.5), fontWeight: Weight.bold, letterSpacing: 2, color: Brand.accent },
  title: { fontFamily: FONT,
    fontSize: 24, lineHeight: leading(24), fontWeight: Weight.bold, color: Brand.ink },
  desc: { fontFamily: FONT,
    fontSize: 13.5, lineHeight: leading(13.5), color: Brand.soft, textAlign: "center" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  // 보조 액션이라 톤온톤 — 한 화면의 솔리드 브랜드색은 주 액션 하나뿐이다(디자인 전역 규칙).
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  shareText: { color: Brand.brandDeep, fontWeight: Weight.bold, fontFamily: FONT, fontSize: 14 },
  btn: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  btnText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },
});
