/** 계정 시트 — 이메일 가입·로그인 + 게스트(익명) 시작.
 *
 *  라우팅을 건드리지 않도록 모달로 띄운다(live-run.tsx와 같은 패턴).
 *  이름은 이미 온보딩에서 받았으므로 여기선 이메일·비밀번호만 묻고,
 *  가입 시 그 이름을 계정 표시이름(displayName)으로 심는다.
 */
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { AuthError, signInEmail, signInGuest, signUpEmail } from "@/lib/auth";
import { Brand } from "@/lib/brand";

type Mode = "signin" | "signup";

export function AccountSheet({
  visible,
  myName,
  onClose,
}: {
  visible: boolean;
  /** 온보딩에서 받은 이 기기의 이름 — 가입 시 표시이름으로 쓴다. */
  myName: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !busy;

  function reset() {
    setEmail("");
    setPassword("");
    setError("");
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function attempt(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      close();
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "문제가 생겼어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  const submit = () =>
    attempt(() =>
      mode === "signup" ? signUpEmail(email, password, myName) : signInEmail(email, password)
    );

  const guest = () => attempt(() => signInGuest(myName));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.head}>
                <Text style={styles.title}>
                  {mode === "signup" ? "계정 만들기" : "로그인"}
                </Text>
                <PressableScale style={styles.iconBtn} onPress={close} accessibilityLabel="닫기">
                  <Icon name="close" size={18} color={Brand.soft} />
                </PressableScale>
              </View>
              <Text style={styles.sub}>
                기기를 바꿔도 기록이 따라옵니다. 지금은 이름만으로도 쓸 수 있어요.
              </Text>

              {/* 로그인 / 가입 전환 */}
              <View style={styles.seg}>
                {(["signin", "signup"] as Mode[]).map((m) => {
                  const on = mode === m;
                  return (
                    <PressableScale
                      key={m}
                      style={[styles.segBtn, on && styles.segBtnOn]}
                      onPress={() => {
                        setMode(m);
                        setError("");
                      }}
                    >
                      <Text style={[styles.segText, on && styles.segTextOn]}>
                        {m === "signin" ? "로그인" : "가입"}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Brand.faint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!busy}
              />

              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="6자 이상"
                placeholderTextColor={Brand.faint}
                secureTextEntry
                autoCapitalize="none"
                textContentType={mode === "signup" ? "newPassword" : "password"}
                editable={!busy}
                returnKeyType="done"
                onSubmitEditing={() => canSubmit && void submit()}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <PressableScale
                style={[styles.primary, !canSubmit && styles.primaryOff]}
                onPress={() => void submit()}
                disabled={!canSubmit}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>
                    {mode === "signup" ? "가입하고 시작" : "로그인"}
                  </Text>
                )}
              </PressableScale>

              <View style={styles.divider}>
                <View style={styles.rule} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.rule} />
              </View>

              <PressableScale style={styles.ghost} onPress={() => void guest()} disabled={busy}>
                <Icon name="user" size={16} color={Brand.brandDeep} />
                <Text style={styles.ghostText}>게스트로 계속하기</Text>
              </PressableScale>
              <Text style={styles.note}>
                게스트는 이 기기에만 남아요. 나중에 이메일로 가입하면 이어서 쓸 수 있어요.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(20,26,43,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Brand.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: "92%",
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "900", color: Brand.ink },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.warm,
  },
  sub: { fontSize: 13, color: Brand.soft, marginTop: 4, marginBottom: 16 },

  seg: {
    flexDirection: "row",
    backgroundColor: Brand.warm,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 9 },
  segBtnOn: { backgroundColor: Brand.card },
  segText: { fontSize: 14, fontWeight: "700", color: Brand.soft },
  segTextOn: { color: Brand.brandDeep, fontWeight: "800" },

  label: { fontSize: 13, fontWeight: "800", color: Brand.ink, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: Brand.ink,
    backgroundColor: Brand.bg,
  },
  error: { marginTop: 12, fontSize: 13, fontWeight: "700", color: "#c0392b", lineHeight: 19 },

  primary: {
    marginTop: 16,
    backgroundColor: Brand.brand,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryOff: { backgroundColor: Brand.brandLine },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  rule: { flex: 1, height: 1, backgroundColor: Brand.line },
  dividerText: { fontSize: 12, color: Brand.faint, fontWeight: "700" },

  ghost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Brand.brandLine,
    backgroundColor: Brand.brandSoft,
    borderRadius: 12,
    paddingVertical: 14,
  },
  ghostText: { fontSize: 15, fontWeight: "800", color: Brand.brandDeep },
  note: { fontSize: 12, color: Brand.faint, textAlign: "center", marginTop: 10, lineHeight: 18 },
});
