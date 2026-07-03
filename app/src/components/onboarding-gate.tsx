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
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand } from "@/lib/brand";
import { getMyName, setMyName } from "@/lib/session";

const PERKS = [
  { icon: "🗓️", label: "모임 참석 체크" },
  { icon: "📸", label: "함께 뛴 순간 갤러리" },
  { icon: "🏃", label: "거리·페이스 기록" },
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.eyebrow}>MODU MARATHON</Text>
          <Text style={styles.title}>
            모두의 <Text style={{ color: Brand.brand }}>마라톤</Text>
          </Text>
          <Text style={styles.sub}>혼자 뛰면 운동, 같이 뛰면 추억 🏃</Text>

          <View style={styles.perks}>
            {PERKS.map((p) => (
              <View key={p.label} style={styles.perk}>
                <Text style={styles.perkIcon}>{p.icon}</Text>
                <Text style={styles.perkLabel}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>어떻게 불러드릴까요?</Text>
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
          <Text style={styles.note}>이름은 이 기기에만 저장돼요. 언제든 바꿀 수 있어요.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Brand.bg },
  screen: { flex: 1, backgroundColor: Brand.bg },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 10 },
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
  perkIcon: { fontSize: 20 },
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
  btnOff: { backgroundColor: "#f0b6ab" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { fontSize: 12.5, color: Brand.soft, textAlign: "center", marginTop: 2 },
});
