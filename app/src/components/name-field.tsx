/** "러너 네임" 입력 — 기기에 기억(session). 웹의 #myName 대응.
 *
 *  이름을 바꾸면 이미 남긴 글·참석·러닝의 작성자명도 함께 바뀌어야 한다(identity.saveRunnerName).
 *  그 전파는 무겁고 되돌리기 어려우니 **타이핑마다가 아니라 입력이 끝났을 때 한 번만** 저장한다.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { saveRunnerName } from "@/lib/identity";
import { useMyName } from "@/lib/session";

export function NameField({ onName }: { onName?: (name: string) => void }) {
  const [stored] = useMyName(); // 마이 탭·로그인이 이름을 바꾸면 여기로 전달된다
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const saved = useRef(""); // 마지막으로 저장된 이름(전파 기준점)

  // 저장소의 이름을 입력칸에 반영한다. 단 **사용자가 타이핑 중일 땐 건드리지 않는다**
  // (외부 변경이 입력 중인 글자를 덮어쓰면 안 됨).
  useEffect(() => {
    if (editing || saving) return;
    setName(stored);
    saved.current = stored;
    onName?.(stored);
    // onName은 부모가 매 렌더 새로 만드는 콜백일 수 있어 의존성에서 뺀다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, editing, saving]);

  async function commit() {
    setEditing(false);
    const next = name.trim();
    const prev = saved.current.trim();
    if (!next) {
      setName(saved.current); // 빈 이름으로 지워버리는 사고 방지 — 되돌린다
      return;
    }
    if (next === prev) return;

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
        onFocus={() => setEditing(true)}
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
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: { fontWeight: Weight.regular, fontFamily: FONT,
    fontSize: 14, color: Brand.ink },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONT,
    fontSize: 14,
    color: Brand.ink,
  },
});
