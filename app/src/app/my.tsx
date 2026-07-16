/**
 * 마이 — 계정(로그인)·프로필(러너 네임)·내 통계·성과 배지·처리방침·앱 정보.
 * 러너 네임 저장은 identity.saveRunnerName 단일 경로(기기·계정·과거 기록 이름까지 전파).
 * 계정은 이름 신원 위에 얹는 레이어 — 로그인하면 이름↔displayName을 동기화(auth.ts).
 */
import Constants from "expo-constants";
import { openBrowserAsync } from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountSheet } from "@/components/account-sheet";
import { Icon, type IconName } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { HAS_AUTH, signOutUser, watchAccount, type Account } from "@/lib/auth";
import { Brand } from "@/lib/brand";
import { subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { saveRunnerName } from "@/lib/identity";
import { useMyName } from "@/lib/session";
import { BADGES, earnedBadgeIds, personalStats } from "@/lib/stats";

const PRIVACY_URL = "https://modu-marathon.web.app/privacy";

export default function MyScreen() {
  // 저장된 러너 네임. 로그인(auth.ts)·크루 탭이 바꿔도 구독으로 따라온다.
  const [name, loadedName] = useMyName();
  const [draft, setDraft] = useState(""); // 입력 중인 값(저장 눌러야 반영)
  const [saving, setSaving] = useState(false);
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [sheet, setSheet] = useState(false);

  // 저장된 이름이 바뀌면 입력칸도 맞춘다. 단 사용자가 고쳐둔 값(dirty)은 덮지 않는다.
  useEffect(() => {
    setDraft((d) => (d.trim() === "" || d.trim() === name.trim() ? name : d));
  }, [name]);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => watchAccount(setAccount), []);

  const dirty = draft.trim().length > 0 && draft.trim() !== name.trim();

  /** 러너 네임 저장 — 기기·계정에 저장하고, **이미 남긴 글·참석·러닝·댓글의 이름도 함께 갱신**한다.
   *  (타이핑마다 돌면 안 되므로 저장 버튼으로만 실행) */
  async function saveName() {
    const next = draft.trim();
    const prev = name.trim();
    if (!next || next === prev) return;

    setSaving(true);
    try {
      const changed = await saveRunnerName(prev, next); // 기기·계정·과거 기록까지 한 번에
      // 화면의 name은 session 구독(useMyName)이 갱신한다 — 여기서 따로 세팅하지 않는다.
      Alert.alert(
        "러너 네임을 바꿨어요",
        changed > 0
          ? `이미 남긴 기록 ${changed}건의 이름도 함께 바꿨어요.`
          : "이제부터 이 이름으로 보여요."
      );
    } catch {
      Alert.alert("이런", "이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
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
          <View style={styles.profileHead}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(name.trim()[0] ?? "🏃").toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pLabel}>러너 네임</Text>
              <Text style={styles.pHint}>크루에서 이렇게 보여요</Text>
            </View>
          </View>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="예: 홍길동"
              placeholderTextColor={Brand.faint}
              maxLength={20}
              editable={!saving}
              returnKeyType="done"
              onSubmitEditing={() => dirty && void saveName()}
            />
            {dirty && (
              <PressableScale
                style={styles.saveBtn}
                onPress={() => void saveName()}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>저장</Text>
                )}
              </PressableScale>
            )}
          </View>
          {dirty && (
            <Text style={styles.renameNote}>
              이미 남긴 글·참석·러닝 기록의 이름도 함께 바뀝니다.
            </Text>
          )}
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
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    padding: 16,
  },
  profileHead: { flexDirection: "row", alignItems: "center", gap: 14 },
  pHint: { fontSize: 12, color: Brand.faint, marginTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtn: {
    backgroundColor: Brand.brand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  renameNote: { fontSize: 12, color: Brand.soft, lineHeight: 17 },
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
    flex: 1,
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
