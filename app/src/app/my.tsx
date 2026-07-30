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
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { AccountSheet } from "@/components/account-sheet";
import { Avatar, ringTier } from "@/components/avatar";
import { Icon, type IconName } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { HAS_AUTH, signOutUser, watchAccount, type Account } from "@/lib/auth";
import { Brand, FONT, Weight, Radius, Shadow, leading } from "@/lib/brand";
import { subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";
import { isWatchAutoSync, setWatchAutoSync } from "@/lib/health-consent";
import { HC_SUPPORTED } from "@/lib/healthconnect";
import { saveRunnerName } from "@/lib/identity";
import { MASCOTS, setMascot, useMascot, type MascotKind } from "@/lib/mascot";
import { setProfilePhoto, useProfilePhoto } from "@/lib/profile-photo";

/** 캐릭터 선택지 라벨 — 썸네일만으론 형태·팀색이 구분되지 않는다.
 *
 *  ⚠️ 예전엔 "남 · 레드"처럼 **성별로** 불렀다. 캐릭터 취향 선택인데 굳이 "성별 신고"로
 *  포장할 이유가 없고, 『5키로』의 친숙어 톤과도 어긋난다(2026-07-28 디자인 리드 결정).
 *  4종을 실제로 가르는 건 성별이 아니라 **울 모양(동글/땋은 스타일) + 레드/그린(팀색)**이다.
 *
 *  2026-07-30 마스코트 전면교체(양) — 형태 라벨을 "숏컷/포니테일"(사람 머리 은유)에서
 *  "동글 울/땋은 울"(양 특성)로 갱신. **내부 타입명(m-red 등)·파일명은 그대로 둔다**
 *  — 노출 카피만 바꾸면 되는 일이라 전면 개명은 낭비(AsyncStorage 마이그레이션도 불필요). */
const MASCOT_LABEL: Record<MascotKind, string> = {
  "m-red": "동글 울 · 레드",
  "m-green": "동글 울 · 그린",
  "f-red": "땋은 울 · 레드",
  "f-green": "땋은 울 · 그린",
};
import { useMyName } from "@/lib/session";
import { badgeProgress, personalStats } from "@/lib/stats";

const PRIVACY_URL = "https://modu-marathon.web.app/privacy";

export default function MyScreen() {
  // 저장된 러너 네임. 로그인(auth.ts)·크루 탭이 바꿔도 구독으로 따라온다.
  const [name, loadedName] = useMyName();
  const mascot = useMascot();
  const [draft, setDraft] = useState(""); // 입력 중인 값(저장 눌러야 반영)
  const [saving, setSaving] = useState(false);
  const [runs, setRuns] = useState<Row[] | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [sheet, setSheet] = useState(false);
  const [pickingMascot, setPickingMascot] = useState(false); // 캐릭터 4종은 접어둔다(위 주석 참조)
  const photo = useProfilePhoto();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [autoSync, setAutoSync] = useState(false); // 워치 자동 불러오기 — 저장값을 아래에서 읽어온다

  // 저장된 이름이 바뀌면 입력칸도 맞춘다. 단 사용자가 고쳐둔 값(dirty)은 덮지 않는다.
  useEffect(() => {
    setDraft((d) => (d.trim() === "" || d.trim() === name.trim() ? name : d));
  }, [name]);

  useEffect(() => subscribe(COLLECTIONS.runs, setRuns), []);
  useEffect(() => watchAccount(setAccount), []);
  // 워치 불러오기 동의 화면에서 켰다면 스위치도 켠 채로 보여야 한다(설정값이 단일 소스).
  useEffect(() => {
    let alive = true;
    void isWatchAutoSync().then((v) => alive && setAutoSync(v));
    return () => {
      alive = false;
    };
  }, []);

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
      // 전파 실패 시 saveRunnerName이 세션을 안 바꾸므로 name=prev·draft=next 그대로 →
      // dirty가 유지돼 [저장] 버튼이 살아있다(재시도 가능). draft를 건드리지 않는다.
      Alert.alert("이름을 바꾸지 못했어요", "잠시 후 [저장]을 다시 눌러 주세요.");
    } finally {
      setSaving(false);
    }
  }

  /** 커스텀 프로필 사진 — 갤러리와 같은 경로(선택→축소→base64)지만 **아바타라 256px면 충분**하다.
   *  사진은 어디까지나 선택 사항이다. 안 넣으면 마스코트가 그대로 얼굴이 된다(회장 확인). */
  async function pickPhoto() {
    if (photoBusy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("사진 접근 권한이 필요해요");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // 아바타는 원형이라 정사각으로 잘라 받는다
      quality: 1,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setPhotoBusy(true);
    try {
      const out = await manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 256 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );
      await setProfilePhoto(`data:image/jpeg;base64,${out.base64 ?? ""}`);
    } catch (e: any) {
      Alert.alert("사진을 넣지 못했어요", String(e?.message ?? e));
    } finally {
      setPhotoBusy(false);
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
  const progress = useMemo(
    () => badgeProgress(runs ?? [], name || undefined),
    [runs, name]
  );
  const loading = runs === null || !loadedName;

  // 미획득 배지 5장이 전부 같은 회색이라 어떤 게 가까운지 안 보였다(독립 채점 R11).
  // 무지개로 칠하는 대신 **다음 목표 하나만** 세워 시선을 모은다.
  const earnedCount = useMemo(() => progress.filter((p) => p.earned).length, [progress]);
  const nextBadgeId = useMemo(() => {
    const rest = progress.filter((p) => !p.earned);
    if (!rest.length) return null;
    return rest.reduce((a, b) => (b.ratio > a.ratio ? b : a)).badge.id;
  }, [progress]);

  // 전역 규칙: **숫자=본문색 + 단위=브랜드 블루**. 여기만 통짜 문자열이라 규칙에서 빠져 있었다
  // (감사 지적) → 단위를 분리해 다른 화면과 같은 문법으로 그린다.
  // ⚠️ "회"·"/km"도 단위다 — 러닝 탭 히어로가 이미 "0 회"의 회를 블루로 쓰는데 여기만
  // 통짜라 같은 값이 화면마다 다르게 보였다(실기기 확인). 예외 없이 전부 분리한다.
  const hasPaceUnit = stats.avgPace.endsWith("/km");
  const tiles: { icon: IconName; label: string; value: string; unit?: string }[] = [
    { icon: "run", label: "총 거리", value: stats.totalKm.toFixed(1), unit: "km" },
    { icon: "activity", label: "러닝 수", value: `${stats.totalRuns}`, unit: "회" },
    { icon: "calendar", label: "이번 주", value: stats.weekKm.toFixed(1), unit: "km" },
    {
      icon: "gauge",
      label: "평균 페이스",
      value: hasPaceUnit ? stats.avgPace.slice(0, -3) : stats.avgPace,
      unit: hasPaceUnit ? "/km" : undefined,
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 히어로 — **카드가 아니다.** 마이 탭까지 카드로 시작하면 5개 탭이 전부
            같은 템플릿이 된다(독립 채점 R11). 배경 톤 위에 큰 아바타를 세워 "여기는 나의 집"
            이라는 인상을 만든다. 제목(내 프로필)도 히어로가 대신하므로 생략. */}
        <View style={styles.hero}>
          <PressableScale onPress={pickPhoto} disabled={photoBusy} dim={false}>
            {/* 성장 링 — 획득 배지 수에 따라 색·굵기가 오른다. **여기(내 집)에만** 적용한다
                (전 화면에 깔면 또 하나의 반복 템플릿이 된다 — 디자인 리드 결정). */}
            <Avatar name={name || "?"} size={72} me tier={ringTier(earnedCount)} />
            <View style={styles.heroCam}>
              <Icon name="camera" size={13} color="#fff" />
            </View>
          </PressableScale>
          <Text style={styles.heroName} numberOfLines={1}>{name || "러너"}</Text>
          <Text style={styles.heroSub}>
            {photoBusy ? "사진 넣는 중…" : photo ? "내 사진으로 보여요" : "탭해서 내 사진을 넣어보세요"}
          </Text>
          {!!photo && (
            <PressableScale onPress={() => void setProfilePhoto(null)} dim={false} hitSlop={8}>
              <Text style={styles.heroReset}>마스코트로 되돌리기</Text>
            </PressableScale>
          )}
        </View>

        {/* 프로필 */}
        <View style={styles.profile}>
          {/* 히어로가 이름을 이미 크게 보여준다 — 여기서 또 "러너 네임 / 크루에서 이렇게
              보여요"를 반복하면 같은 이름이 한 화면에 두 번 커진다(실기기 확인).
              여기는 **바꾸는 곳**이라는 것만 짧게 알린다. */}
          <Text style={styles.pLabel}>러너 네임 바꾸기</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="예: 홍길동"
              placeholderTextColor={Brand.placeholder}
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

          {/* 마스코트 고르기 — 4종(남/여 × 레드/그린 팀). 러너 네임으론 성별을 알 수 없어 직접 고른다.
              이 기기 취향 설정이라 서버에 안 올린다(lib/mascot.ts).
              ⚠️ 4종을 항상 펼쳐두면 프로필 카드가 화면 절반을 먹어 정작 "내 러닝" 통계가
              첫 뷰포트 밖으로 밀렸다(실기기 확인). 캐릭터는 한 번 고르면 거의 안 바꾸고
              고른 결과는 위 아바타에 이미 보이니, **접어두고 바꿀 때만 펼친다.** */}
          <View style={styles.mascotBlock}>
            <PressableScale
              style={styles.mascotToggle}
              onPress={() => setPickingMascot((v) => !v)}
              dim={false}>
              <Text style={styles.mascotLabel}>내 캐릭터</Text>
              <Text style={styles.mascotToggleText}>
                {pickingMascot ? "닫기" : "바꾸기"}
              </Text>
              <Icon
                name={pickingMascot ? "chevron-left" : "chevron-right"}
                size={16}
                color={Brand.brandDeep}
              />
            </PressableScale>
            {pickingMascot && (
              <View style={styles.mascotGrid}>
                {MASCOTS.map((k) => (
                  <PressableScale
                    key={k}
                    style={[styles.mascotOpt, mascot === k && styles.mascotOptOn]}
                    onPress={() => void setMascot(k)}>
                    <Mascot size={40} kind={k} />
                    {/* 44px 썸네일에선 머리띠 리본(남/여) 차이가 안 보여 4개가 같아 보였다 → 라벨로 구분. */}
                    <Text style={[styles.mascotOptText, mascot === k && styles.mascotOptTextOn]}>
                      {MASCOT_LABEL[k]}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            )}
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
                  {/* 320dp에서 "러닝 기록이 / 따라와요"로 갈렸다 → 끊기는 자리를 고정한다. */}
                  <Text style={styles.acctSub}>기기를 바꿔도{"\n"}러닝 기록이 따라와요</Text>
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
                <Text style={styles.tileVal}>
                  {t.value}
                  {t.unit ? <Text style={styles.tileUnit}> {t.unit}</Text> : null}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 배지 */}
        <Text style={styles.sectionH}>성과 배지</Text>
        <View style={styles.badges}>
          {progress.map(({ badge: b, earned: got, ratio, hint }) => (
            <View key={b.id} style={[styles.badge, b.id === nextBadgeId && styles.badgeNext]}>
              <View
                style={[
                  styles.badgeIcon,
                  got ? styles.badgeIconOn : styles.badgeIconOff,
                  b.id === nextBadgeId && styles.badgeIconNext,
                ]}>
                <Icon
                  name={b.icon as IconName}
                  size={20}
                  color={got ? "#fff" : b.id === nextBadgeId ? Brand.brandDeep : Brand.faint}
                />
              </View>
              <Text
                style={[
                  styles.badgeLabel,
                  !got && styles.badgeLabelOff,
                  b.id === nextBadgeId && styles.badgeLabelNext,
                ]}>
                {b.label}
              </Text>
              {/* 못 딴 배지엔 "미획득" 대신 **얼마나 왔는지**를 준다 — 채우고 싶게. */}
              {!got && (
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
                </View>
              )}
              <Text style={[styles.badgeDesc, got && styles.badgeDescOn]} numberOfLines={1}>
                {got ? `받았어요 ✓` : hint}
              </Text>
            </View>
          ))}
        </View>

        {/* 설정 — 워치 자동 불러오기 끄기.
            자동으로 도는 수집은 **끄는 수단이 반드시 있어야 한다**(민감정보 동의 철회 원칙).
            동의 화면에서 "마이 탭에서 끌 수 있어요"라고 고지했으니 그 약속의 실체이기도 하다. */}
        {HC_SUPPORTED && (
          <>
            <Text style={styles.sectionH}>설정</Text>
            <View style={styles.linkRow}>
              <View style={styles.linkIcon}>
                <Icon name="watch" size={16} color={Brand.brandDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>워치 자동 불러오기</Text>
                <Text style={styles.switchSub}>앱을 열면{"\n"}오늘 기록을 가져와요</Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={(v) => {
                  setAutoSync(v); // 화면은 즉시 반응, 저장은 뒤따른다
                  void setWatchAutoSync(v);
                }}
                trackColor={{ false: Brand.line2, true: Brand.brand }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}

        {/* 링크 · 정보 */}
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
            5키로 v{Constants.expoConfig?.version ?? "1.0.0"}
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
  content: { padding: 18, gap: 12, paddingBottom: 160 },
  // 히어로 — 카드가 아니라 배경 톤. 5개 탭이 전부 카드로 시작하지 않게 하는 장치.
  hero: {
    alignItems: "center",
    gap: 4,
    backgroundColor: Brand.tint,
    borderRadius: Radius.hero,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 2,
  },
  heroCam: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Brand.tint,
  },
  heroName: { fontFamily: FONT, fontSize: 20, lineHeight: leading(20), fontWeight: Weight.bold, color: Brand.ink, marginTop: 8 },
  heroSub: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft },
  heroReset: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), fontWeight: Weight.bold, color: Brand.brandDeep, marginTop: 6 },

  profile: {
    gap: 12,
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    ...Shadow.soft,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtn: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.chip,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.bold },
  renameNote: { fontFamily: FONT,
    fontSize: 12, color: Brand.soft, lineHeight: 17 },
  mascotBlock: { marginTop: 12, gap: 8 },
  mascotToggle: { flexDirection: "row", alignItems: "center", gap: 4 },
  mascotLabel: { flex: 1, fontFamily: FONT, fontSize: 13.5, lineHeight: leading(13.5), fontWeight: Weight.bold, color: Brand.soft },
  mascotToggleText: { fontFamily: FONT, fontSize: 13, lineHeight: leading(13), fontWeight: Weight.bold, color: Brand.brandDeep },
  mascotGrid: { flexDirection: "row", gap: 8 },
  mascotOpt: {
    flex: 1,
    paddingVertical: 8,
    gap: 3,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Brand.line,
    backgroundColor: Brand.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotOptOn: { borderColor: Brand.brand, backgroundColor: Brand.brandSoft },
  mascotOptText: { fontFamily: FONT, fontSize: 10.5, lineHeight: leading(10.5), color: Brand.soft, fontWeight: Weight.regular },
  mascotOptTextOn: { color: Brand.brandDeep, fontWeight: Weight.bold },
  pLabel: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), fontWeight: Weight.regular, color: Brand.soft },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: Weight.regular,
    color: Brand.ink,
  },

  sectionH: { fontFamily: FONT,
    fontSize: 15, lineHeight: leading(15), fontWeight: Weight.bold, color: Brand.ink, marginTop: 6 },

  acct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 14,
    ...Shadow.soft,
  },
  acctCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.brandSoft,
    borderWidth: 1,
    borderColor: Brand.brandLine,
    borderRadius: Radius.card,
    padding: 14,
  },
  acctIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  acctTitle: { fontFamily: FONT,
    fontSize: 14.5, lineHeight: leading(14.5), fontWeight: Weight.bold, color: Brand.ink },
  acctSub: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.soft, marginTop: 2 },
  acctBtn: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acctBtnText: { color: "#fff", fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.bold },
  acctBtnGhost: {
    borderWidth: 1,
    borderColor: Brand.line2,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  acctBtnGhostText: { color: Brand.soft, fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), fontWeight: Weight.bold },

  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skelTile: { flexGrow: 1, flexBasis: "47%" },
  tile: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
    ...Shadow.soft,
  },
  tileHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  tileLab: { fontFamily: FONT,
    fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft, fontWeight: Weight.regular },
  tileVal: { fontFamily: FONT,
    fontSize: 19, lineHeight: leading(19), fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.2 },
  tileUnit: { fontFamily: FONT,
    fontSize: 14, fontWeight: Weight.bold, color: Brand.brand },

  badges: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: {
    // flexGrow를 주면 안 된다 — 배지가 5개(홀수)라 마지막 줄에 혼자 남는 카드가
    // 남는 공간을 다 먹어 전체 너비로 퍼진다(3열일 땐 안 보이던 문제).
    width: "48%",
    alignItems: "center",
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 6,
    ...Shadow.soft,
  },
  badgeLocked: { opacity: 0.55 },
  // "다음 목표" 하나만 브랜드 톤으로 세운다 — 5장이 전부 같은 회색이던 문제(R11).
  badgeNext: { backgroundColor: Brand.tint },
  badgeIconNext: { backgroundColor: Brand.brandSoft },
  badgeLabelNext: { color: Brand.brandDeep },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconOn: { backgroundColor: Brand.brand },
  badgeIconOff: { backgroundColor: Brand.warm },
  badgeLabel: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.ink, textAlign: "center" },
  badgeLabelOff: { color: Brand.soft },
  badgeDesc: { fontFamily: FONT,
    fontSize: 10.5, color: Brand.soft, textAlign: "center" },
  badgeDescOn: { color: Brand.brandDeep, fontWeight: Weight.regular },
  // 진행바 — 못 딴 배지에만. 얇게(4px) 두고 라벨과 힌트 사이에.
  barTrack: {
    width: "78%",
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.line2,
    overflow: "hidden",
    marginTop: 2,
  },
  barFill: { height: "100%", borderRadius: 2, backgroundColor: Brand.brand },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Brand.card,
    borderRadius: Radius.input,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...Shadow.soft,
  },
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
  // 스위치 행은 제목+설명 2줄이라 linkText(flex:1)를 못 쓴다 — 감싼 View가 flex를 갖는다.
  switchLabel: { fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), fontWeight: Weight.bold, color: Brand.ink },
  switchSub: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.soft, marginTop: 2 },

  appInfo: { alignItems: "center", paddingVertical: 18, gap: 3 },
  appInfoText: { fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), fontWeight: Weight.regular, color: Brand.soft },
  appInfoSub: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.faint },
});
