/**
 * 크루 초대 (push 페이지, PHASE 2-C) — 코드 발급/공유 + 코드로 가입.
 *
 * ⚠️ 지금은 앱 시작 시 `ensureCrewMembership()`이 코드 없이도 자동으로 가입시킨다(1인 1크루 MVP).
 * 그래서 [코드로 가입하기]는 이 화면에 온 대부분의 사용자에게 "이미 멤버예요"로 끝난다 —
 * 실질 가치는 [코드 만들기]로 카톡 등에 크루를 공유하는 쪽이다. 두 번째 크루가 생기면(PHASE 4)
 * 이 코드가 진짜 가입 게이트로 승격된다(lib/invite.ts 주석 참조).
 */
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius, Shadow, leading } from "@/lib/brand";
import { HAS_FIREBASE } from "@/lib/firebase";
import { createInviteCode, formatCode, joinWithCode } from "@/lib/invite";

const CACHE_KEY = "mm_my_invite_code";

export default function CrewInviteScreen() {
  const [myCode, setMyCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(CACHE_KEY).then((v) => v && setMyCode(v));
  }, []);

  async function makeCode() {
    if (creating) return;
    setCreating(true);
    try {
      const code = await createInviteCode();
      setMyCode(code);
      await AsyncStorage.setItem(CACHE_KEY, code);
    } catch (e: any) {
      Alert.alert("코드를 만들지 못했어요", String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  async function shareCode() {
    if (!myCode) return;
    await Share.share({
      message: `우리 크루에 함께해요! 5키로 앱을 설치하고 [크루 초대]에서 이 코드를 입력해 주세요.\n\n초대 코드: ${formatCode(myCode)}`,
    });
  }

  async function submitJoin() {
    if (!joinInput.trim() || joining) return;
    setJoining(true);
    try {
      const result = await joinWithCode(joinInput);
      if (result.ok) {
        Alert.alert(result.already ? "이미 우리 크루 멤버예요" : "가입 완료!", "함께 뛰어요 🏃");
        setJoinInput("");
      } else {
        const msg =
          result.reason === "revoked"
            ? "회수된 코드예요. 새 코드를 요청해 주세요."
            : result.reason === "unsupported-crew"
              ? "아직 지원하지 않는 크루 코드예요."
              : result.reason === "offline"
                ? "크루와 연결되지 않았어요."
                : "유효하지 않은 코드예요. 다시 확인해 주세요.";
        Alert.alert("가입하지 못했어요", msg);
      }
    } catch (e: any) {
      Alert.alert("가입하지 못했어요", String(e?.message ?? e));
    } finally {
      setJoining(false);
    }
  }

  const back = (
    <PressableScale style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
      <Icon name="chevron-left" size={24} color={Brand.ink} />
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        {back}
        <Text style={styles.topTitle}>크루 초대</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionH}>코드로 초대하기</Text>
        <View style={styles.card}>
          {myCode ? (
            <>
              <Text style={styles.codeText}>{formatCode(myCode)}</Text>
              <Text style={styles.codeHint}>이 코드를 아는 사람만 우리 크루를 찾을 수 있어요.</Text>
              <PressableScale style={styles.btn} onPress={shareCode} dim={false}>
                <Icon name="share" size={16} color="#fff" />
                <Text style={styles.btnText}>공유하기</Text>
              </PressableScale>
              <PressableScale onPress={makeCode} disabled={creating} dim={false}>
                <Text style={styles.remake}>{creating ? "만드는 중…" : "새 코드 만들기"}</Text>
              </PressableScale>
            </>
          ) : (
            <>
              <Text style={styles.codeHint}>아직 만든 코드가 없어요. 코드를 만들어 카톡으로 공유해 보세요.</Text>
              <PressableScale style={styles.btn} onPress={makeCode} disabled={creating || !HAS_FIREBASE} dim={false}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={styles.btnText}>{creating ? "만드는 중…" : "코드 만들기"}</Text>
              </PressableScale>
            </>
          )}
        </View>

        <Text style={styles.sectionH}>코드로 가입하기</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={joinInput}
            onChangeText={setJoinInput}
            placeholder="ABCD-EFGH"
            placeholderTextColor={Brand.placeholder}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={9}
          />
          <PressableScale
            style={[styles.btn, (!joinInput.trim() || joining) && styles.btnOff]}
            onPress={submitJoin}
            disabled={!joinInput.trim() || joining}
            dim={false}>
            <Text style={styles.btnText}>{joining ? "확인 중…" : "가입하기"}</Text>
          </PressableScale>
        </View>
      </View>
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
  topTitle: { fontFamily: FONT, fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },
  body: { padding: 18, gap: 12 },
  sectionH: { fontFamily: FONT, fontSize: 15, lineHeight: leading(15), fontWeight: Weight.bold, color: Brand.ink, marginTop: 6 },
  card: { backgroundColor: Brand.card, borderRadius: Radius.card, padding: 16, gap: 10, ...Shadow.soft },
  codeText: {
    fontFamily: FONT, fontSize: 26, fontWeight: Weight.bold, color: Brand.brandDeep,
    letterSpacing: 2, textAlign: "center",
  },
  codeHint: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft, textAlign: "center" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: Brand.brand, borderRadius: Radius.input, paddingVertical: 13, minHeight: 48,
  },
  btnOff: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT, fontSize: 15 },
  remake: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.soft, textAlign: "center" },
  input: {
    borderWidth: 1, borderColor: Brand.line, borderRadius: Radius.input,
    paddingHorizontal: 12, paddingVertical: 12, fontFamily: FONT, fontSize: 18,
    color: Brand.ink, textAlign: "center", letterSpacing: 2,
  },
});
