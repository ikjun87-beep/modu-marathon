/** 첫 실행 온보딩 게이트 — 이름(신원)이 없으면 환영 화면으로 맞이하고,
 *  저장 후 앱으로 진입시킨다. 웹의 "내 이름" 최초 입력에 대응.
 *
 *  현재는 이름 기반 신원(session/AsyncStorage). Firebase 실연결 후에는
 *  여기에서 게스트(익명)·이메일 로그인(auth.ts)으로 확장할 수 있다. */
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { openBrowserAsync } from "expo-web-browser";

import { Icon, type IconName } from "@/components/icon";
import { Brand } from "@/lib/brand";
import { getMyName, setMyName } from "@/lib/session";

const PRIVACY_URL = "https://modu-marathon.web.app/privacy";

const PERKS: { icon: IconName; label: string }[] = [
  { icon: "calendar", label: "모임 참석 체크" },
  { icon: "camera", label: "함께 뛴 순간 갤러리" },
  { icon: "activity", label: "거리·페이스 기록" },
];

export function OnboardingGate({ children }: { children: ReactNode }) {
  // ready=false: 저장된 이름 확인 중 / done=true: 이름 있음 → 앱 진입
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    getMyName().then((n) => {
      if (n.trim()) setDone(true);
      setReady(true);
    });
  }, []);

  function start() {
    const v = name.trim();
    if (!v) return;
    void setMyName(v);
    setDone(true);
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Brand.brand} />
      </View>
    );
  }

  if (done) return <>{children}</>;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 키보드가 이름 입력칸을 가리지 않도록 스크롤 가능하게 감싼다(안드로이드 edge-to-edge 대응). */}
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <Text style={styles.eyebrow}>MODU MARATHON</Text>
            <Text style={styles.title}>
              모두의 <Text style={{ color: Brand.brand }}>마라톤</Text>
            </Text>
            <Text style={styles.sub}>혼자 뛰면 운동, 같이 뛰면 추억.</Text>

            <View style={styles.perks}>
              {PERKS.map((p) => (
                <View key={p.label} style={styles.perk}>
                  <View style={styles.perkBadge}>
                    <Icon name={p.icon} size={20} color={Brand.brandDeep} />
                  </View>
                  <Text style={styles.perkLabel}>{p.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>러너 네임을 정해주세요</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 김캡틴"
              placeholderTextColor={Brand.soft}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={start}
            />
            <Pressable
              style={[styles.btn, !name.trim() && styles.btnOff]}
              onPress={start}
              disabled={!name.trim()}
            >
              <Text style={styles.btnText}>시작하기</Text>
            </Pressable>
            <Text style={styles.note}>크루에서 이렇게 보여요. 언제든 바꿀 수 있어요.</Text>
            <Text style={styles.consent}>
              시작하면{" "}
              <Text style={styles.consentLink} onPress={() => void openBrowserAsync(PRIVACY_URL)}>
                개인정보 처리방침
              </Text>
              에 동의하는 것으로 봅니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Brand.bg },
  screen: { flex: 1, backgroundColor: Brand.bg },
  scrollBody: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  body: { justifyContent: "center", paddingHorizontal: 28, gap: 10 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 3, color: Brand.brand },
  title: { fontSize: 40, fontWeight: "900", color: Brand.ink },
  sub: { fontSize: 15, color: Brand.soft, marginBottom: 8 },
  perks: { gap: 10, marginTop: 8 },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  perkBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  perkLabel: { fontSize: 15, fontWeight: "700", color: Brand.ink },
  form: { paddingHorizontal: 28, paddingBottom: 12, gap: 10 },
  label: { fontSize: 15, fontWeight: "800", color: Brand.ink },
  input: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Brand.ink,
    backgroundColor: Brand.card,
  },
  btn: {
    backgroundColor: Brand.brand,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 2,
  },
  btnOff: { backgroundColor: Brand.brandLine },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { fontSize: 12.5, color: Brand.soft, textAlign: "center", marginTop: 2 },
  consent: { fontSize: 11.5, color: Brand.soft, textAlign: "center", marginTop: 6, lineHeight: 17 },
  consentLink: { color: Brand.brand, fontWeight: "700", textDecorationLine: "underline" },
});
