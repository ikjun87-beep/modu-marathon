/** "내 이름" 입력 — 기기에 기억(session). 웹의 #myName 대응. */
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Brand } from "@/lib/brand";
import { getMyName, setMyName } from "@/lib/session";

export function NameField({ onName }: { onName?: (name: string) => void }) {
  const [name, setName] = useState("");

  useEffect(() => {
    getMyName().then((n) => {
      setName(n);
      onName?.(n);
    });
    // 최초 1회만 로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(v: string) {
    setName(v);
    void setMyName(v);
    onName?.(v.trim());
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>내 이름</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={update}
        placeholder="예: 김캡틴"
        placeholderTextColor={Brand.soft}
        maxLength={20}
      />
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
