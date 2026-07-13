/**
 * 마이 — 계정(로그인)·프로필(이름 수정)·내 통계·성과 배지·처리방침·앱 정보.
 * 이름은 session에 기억(웹 #myName 대응). 통계·배지는 stats.ts 순수 함수(runs 구독).
 * 계정은 이름 신원 위에 얹는 레이어 — 로그인하면 이름↔displayName을 동기화(auth.ts).
 */
import Constants from "expo-constants";
import { openBrowserAsync } from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountSheet } from "@/components/account-sheet";
import { Icon, type IconName } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HAS_AUTH,
  signOutUser,
  updateAccountName,
  watchAccount,
  type Account,
} from "@/lib/auth";
import { Brand } from "@/lib/brand";
import { subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { getMyName, setMyName } from "@/lib/session";
import { BADGES, earnedBadgeIds, personalStats } from "@/lib/stats";

const PRIVACY_URL = "https://modu-marathon.web.app/privacy";

export default function MyScreen() {
  const [name, setName] = useState("");
  const [loadedName, setLoadedName] = useState(false);
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    getMyName().then((n) => {
      setName(n);
      setLoadedName(true);
    });
  }, []);
  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => watchAccount(setAccount), []);

  // 로그인 후 계정 표시이름이 있으면 화면의 이름도 그 값으로 맞춘다(auth.ts가 session에 이미 저장).
  useEffect(() => {
    if (account?.name && account.name !== name) setName(account.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.name]);

  function updateName(v: string) {
    setName(v);
    void setMyName(v);
    void updateAccountName(v); // 로그인 상태면 계정 표시이름도 함께
  }

  function logout() {
    Alert.alert("로그아웃", "이 기기에서 계정을 로그아웃할까요? 이름과 기록은 남아 있어요.", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: () => void signOutUser() },
    ]);
  }

  const stats = useMemo(
    () => personalStats(runs ?? [], name || undefined),
    [runs, name]
  );
  const earned = useMemo(
    () => earnedBadgeIds(runs ?? [], name || undefined),
    [runs, name]
  );
  const loading = runs === null || !loadedName;

  const tiles: { icon: IconName; label: string; value: string }[] = [
    { icon: "run", label: "총 거리", value: `${stats.totalKm.toFixed(1)} km` },
    { icon: "activity", label: "러닝 수", value: `${stats.totalRuns}회` },
    { icon: "calendar", label: "이번 주", value: `${stats.weekKm.toFixed(1)} km` },
    { icon: "gauge", label: "평균 페이스", value: stats.avgPace },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name.trim()[0] ?? "🏃").toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pLabel}>내 이름</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={updateName}
              placeholder="예: 김캡틴"
              placeholderTextColor={Brand.faint}
              maxLength={20}
            />
          </View>
        </View>

        {/* 계정 — Firebase 설정된 경우에만 노출(미설정 시 앱은 이름 기반으로 정상 동작) */}
        {HAS_AUTH && (
          <>
            <Text style={styles.sectionH}>계정</Text>
            {account ? (
              <View style={styles.acct}>
                <View style={styles.acctIcon}>
                  <Icon name={account.guest ? "user" : "check"} size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.acctTitle}>
                    {account.guest ? "게스트로 이용 중" : "로그인됨"}
                  </Text>
                  <Text style={styles.acctSub}>
                    {account.guest
                      ? "이메일로 가입하면 기기를 바꿔도 이어집니다"
                      : (account.email ?? "")}
                  </Text>
                </View>
                {account.guest ? (
                  <PressableScale style={styles.acctBtn} onPress={() => setSheet(true)}>
                    <Text style={styles.acctBtnText}>가입</Text>
                  </PressableScale>
                ) : (
                  <PressableScale style={styles.acctBtnGhost} onPress={logout}>
                    <Text style={styles.acctBtnGhostText}>로그아웃</Text>
                  </PressableScale>
                )}
              </View>
            ) : (
              <PressableScale style={styles.acctCta} onPress={() => setSheet(true)}>
                <View style={styles.acctIcon}>
                  <Icon name="shield" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.acctTitle}>로그인하고 기록 지키기</Text>
                  <Text style={styles.acctSub}>기기를 바꿔도 러닝 기록이 따라와요</Text>
                </View>
                <Icon name="chevron-right" size={18} color={Brand.faint} />
              </PressableScale>
            )}
          </>
        )}

        {/* 내 통계 */}
        <Text style={styles.sectionH}>내 러닝</Text>
        {loading ? (
          <View style={styles.tiles}>
            <Skeleton height={78} radius={16} style={styles.skelTile} />
            <Skeleton height={78} radius={16} style={styles.skelTile} />
          </View>
        ) : (
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
        )}

        {/* 배지 */}
        <Text style={styles.sectionH}>성과 배지</Text>
        <View style={styles.badges}>
          {BADGES.map((b) => {
            const got = earned.has(b.id);
            return (
              <View key={b.id} style={[styles.badge, !got && styles.badgeLocked]}>
                <View style={[styles.badgeIcon, got ? styles.badgeIconOn : styles.badgeIconOff]}>
                  <Icon
                    name={b.icon as IconName}
                    size={20}
                    color={got ? "#fff" : Brand.faint}
                  />
                </View>
                <Text style={[styles.badgeLabel, !got && styles.badgeLabelOff]}>{b.label}</Text>
                <Text style={styles.badgeDesc}>{got ? b.desc : "미획득"}</Text>
              </View>
            );
          })}
        </View>

        {/* 링크 · 설정 */}
        <Text style={styles.sectionH}>정보</Text>
        <PressableScale style={styles.linkRow} onPress={() => void openBrowserAsync(PRIVACY_URL)}>
          <View style={styles.linkIcon}>
            <Icon name="shield" size={16} color={Brand.brandDeep} />
          </View>
          <Text style={styles.linkText}>개인정보 처리방침</Text>
          <Icon name="chevron-right" size={18} color={Brand.faint} />
        </PressableScale>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            모두의 마라톤 v{Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
          <Text style={styles.appInfoSub}>혼자 뛰면 운동, 같이 뛰면 추억.</Text>
        </View>
      </ScrollView>

      <AccountSheet visible={sheet} myName={name} onClose={() => setSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 120 },

  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "900" },
  pLabel: { fontSize: 12, fontWeight: "700", color: Brand.soft },
  nameInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 16,
    fontWeight: "700",
    color: Brand.ink,
  },

  sectionH: { fontSize: 15, fontWeight: "800", color: Brand.ink, marginTop: 6 },

  acct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 14,
  },
  acctCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.brandSoft,
    borderWidth: 1,
    borderColor: Brand.brandLine,
    borderRadius: 16,
    padding: 14,
  },
  acctIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  acctTitle: { fontSize: 14.5, fontWeight: "800", color: Brand.ink },
  acctSub: { fontSize: 12, color: Brand.soft, marginTop: 2 },
  acctBtn: {
    backgroundColor: Brand.brand,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acctBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  acctBtnGhost: {
    borderWidth: 1,
    borderColor: Brand.line2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  acctBtnGhostText: { color: Brand.soft, fontSize: 13, fontWeight: "800" },

  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skelTile: { flexGrow: 1, flexBasis: "47%" },
  tile: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  tileHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  tileLab: { fontSize: 12.5, color: Brand.soft, fontWeight: "700" },
  tileVal: { fontSize: 19, fontWeight: "900", color: Brand.ink, letterSpacing: -0.4 },

  badges: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: {
    width: "31%",
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 6,
  },
  badgeLocked: { opacity: 0.55 },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconOn: { backgroundColor: Brand.brand },
  badgeIconOff: { backgroundColor: Brand.warm },
  badgeLabel: { fontSize: 12.5, fontWeight: "800", color: Brand.ink, textAlign: "center" },
  badgeLabelOff: { color: Brand.soft },
  badgeDesc: { fontSize: 10.5, color: Brand.soft, textAlign: "center" },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  linkIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { flex: 1, fontSize: 14, fontWeight: "700", color: Brand.ink },

  appInfo: { alignItems: "center", paddingVertical: 18, gap: 3 },
  appInfoText: { fontSize: 13, fontWeight: "800", color: Brand.soft },
  appInfoSub: { fontSize: 12, color: Brand.faint },
});
