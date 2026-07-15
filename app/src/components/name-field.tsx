/** "러너 네임" 입력 — 기기에 기억(session). 웹의 #myName 대응.
 *
 *  이름을 바꾸면 이미 남긴 글·참석·러닝의 작성자명도 함께 바뀌어야 한다(identity.saveRunnerName).
 *  그 전파는 무겁고 되돌리기 어려우니 **타이핑마다가 아니라 입력이 끝났을 때 한 번만** 저장한다.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

import { Brand } from "@/lib/brand";
import { saveRunnerName } from "@/lib/identity";
import { getMyName } from "@/lib/session";

export function NameField({ onName }: { onName?: (name: string) => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const saved = useRef(""); // 마지막으로 저장된 이름(전파 기준점)

  useEffect(() => {
    getMyName().then((n) => {
      setName(n);
      saved.current = n;
      onName?.(n);
    });
    // 최초 1회만 로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function commit() {
    const next = name.trim();
    const prev = saved.current.trim();
    if (!next || next === prev) return;

    setSaving(true);
    try {
      await saveRunnerName(prev, next);
      saved.current = next;
      onName?.(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>러너 네임</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        onBlur={() => void commit()}
        onSubmitEditing={() => void commit()}
        placeholder="예: 홍길동"
        placeholderTextColor={Brand.soft}
        maxLength={20}
        editable={!saving}
        returnKeyType="done"
      />
      {saving && <ActivityIndicator color={Brand.brand} size="small" />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: { fontWeight: "700", fontSize: 14, color: Brand.ink },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: Brand.ink,
  },
});
