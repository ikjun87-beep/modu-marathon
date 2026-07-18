/** "러너 네임" 입력 — 기기에 기억(session). 웹의 #myName 대응.
 *
 *  이름을 바꾸면 이미 남긴 글·참석·러닝의 작성자명도 함께 바뀐다(identity.saveRunnerName).
 *  그 전파는 무겁고 되돌리기 어려우니 **명시적 [저장] 버튼**을 눌러야만 반영한다(마이 탭과 동일).
 *  예전엔 onBlur/onSubmit에서 자동 저장이라, 실수로 글자가 들어가거나 포커스만 벗어나도
 *  전파가 돌아 이름이 오염됐다(회장 지적) → 버튼 방식으로 통일.
 */
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import { saveRunnerName } from "@/lib/identity";
import { useMyName } from "@/lib/session";

export function NameField({ onName }: { onName?: (name: string) => void }) {
  const [stored] = useMyName(); // 마이 탭·로그인이 이름을 바꾸면 여기로 전달된다
  const [draft, setDraft] = useState(""); // 입력 중인 값(저장 눌러야 반영)
  const [saving, setSaving] = useState(false);

  // 저장된 이름이 바뀌면 입력칸도 맞춘다. 단 사용자가 고쳐둔 값은 덮지 않는다.
  useEffect(() => {
    setDraft((d) => (d.trim() === "" || d.trim() === stored.trim() ? stored : d));
    onName?.(stored);
    // onName은 부모가 매 렌더 새로 만드는 콜백일 수 있어 의존성에서 뺀다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const dirty = draft.trim().length > 0 && draft.trim() !== stored.trim();

  async function save() {
    const next = draft.trim();
    const prev = stored.trim();
    if (!next || next === prev) return;
    setSaving(true);
    try {
      await saveRunnerName(prev, next);
      // 화면의 stored는 session 구독(useMyName)이 갱신 → onName도 위 effect에서 따라온다.
    } catch {
      Alert.alert("이름을 바꾸지 못했어요", "잠시 후 [저장]을 다시 눌러 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>러너 네임</Text>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="예: 홍길동"
          placeholderTextColor={Brand.soft}
          maxLength={20}
          editable={!saving}
          returnKeyType="done"
          onSubmitEditing={() => dirty && void save()}
        />
        {dirty && (
          <PressableScale style={styles.saveBtn} onPress={() => void save()} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>저장</Text>
            )}
          </PressableScale>
        )}
      </View>
      {dirty && (
        <Text style={styles.note}>이미 남긴 글·참석·러닝 기록의 이름도 함께 바뀝니다.</Text>
      )}
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
  label: { fontWeight: Weight.regular, fontFamily: FONT, fontSize: 14, color: Brand.ink },
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
  saveBtn: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 52,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontFamily: FONT, fontSize: 13.5, fontWeight: Weight.bold },
  note: { fontFamily: FONT, fontSize: 12, color: Brand.soft, marginTop: 6, marginLeft: 2 },
});
