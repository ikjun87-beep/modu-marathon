/** 러닝 갤러리 — 사진 선택→리사이즈→base64 저장(웹과 동일 gallery 컬렉션·방식). */
import { Image } from "expo-image";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { ClapButton } from "@/components/clap-button";
import { Icon } from "@/components/icon";
import { Brand, FONT, Weight, Radius, Shadow } from "@/lib/brand";
import { add, remove, subscribe, type Row } from "@/lib/crew";
import { COLLECTIONS } from "@/lib/firebase";

export function GallerySection({ myName }: { myName: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribe(COLLECTIONS.gallery, setRows), []);

  async function pick() {
    if (!myName.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("사진 접근 권한이 필요해요");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setBusy(true);
    try {
      // 웹과 동일: 가로 800px로 축소 + JPEG 압축 → base64 data URI로 저장
      const out = await manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: SaveFormat.JPEG, base64: true }
      );
      const dataUri = `data:image/jpeg;base64,${out.base64 ?? ""}`;
      if (dataUri.length > 950000) {
        Alert.alert("사진이 너무 커요", "다른 사진을 시도해 주세요.");
        return;
      }
      await add(COLLECTIONS.gallery, {
        name: myName.trim(),
        caption: "",
        image: dataUri,
      });
    } catch (e: any) {
      Alert.alert("업로드 실패", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  function del(id: string) {
    Alert.alert("사진을 삭제할까요?", "", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => void remove(COLLECTIONS.gallery, id),
      },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.h}>러닝 갤러리</Text>
        <Pressable
          style={[styles.up, busy && styles.upBusy]}
          onPress={pick}
          disabled={busy}
        >
          {!busy && <Icon name="camera" size={15} color={Brand.brandDeep} />}
          <Text style={styles.upText}>{busy ? "업로드 중…" : "사진 올리기"}</Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>아직 사진이 없어요. 첫 인증샷을 올려보세요!</Text>
      ) : (
        // 2열 — 3열은 썸네일이 너무 작아 "누가 어디서 뛰었는지"가 안 읽혔다.
        // 친목 크루 앱의 자산은 사진이므로 크게 보여주고 이름·박수를 얹는다(R12 기획).
        <View style={styles.grid}>
          {rows.map((g) => (
            <Pressable key={g.id} style={styles.cell} onLongPress={() => del(g.id)}>
              <Image source={{ uri: g.image }} style={styles.img} contentFit="cover" />
              {/* 사진 위 어두운 띠 — 밝은 사진에서도 이름이 읽히게 */}
              <View style={styles.overlay}>
                <Text style={styles.cap} numberOfLines={1}>{g.name}</Text>
                {!!g.caption && (
                  <Text style={styles.capSub} numberOfLines={1}>{String(g.caption)}</Text>
                )}
              </View>
              <View style={styles.clapPos}>
                <ClapButton targetId={g.id} myName={myName} size="sm" />
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.hint}>사진을 길게 누르면 삭제돼요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 14,
    gap: 10,
    ...Shadow.soft,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontFamily: FONT,
    fontSize: 15, fontWeight: Weight.bold, color: Brand.ink },
  // 섹션 헤더의 보조 액션 — 솔리드 블루는 화면의 주 액션([참석]) 하나로 아낀다(전역 규칙).
  up: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  upBusy: { opacity: 0.6 },
  upText: { color: Brand.brandDeep, fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 13 },
  empty: { color: Brand.soft, fontFamily: FONT,
    fontSize: 13.5, textAlign: "center", paddingVertical: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "48.5%",
    aspectRatio: 1,
    borderRadius: Radius.input,
    overflow: "hidden",
    backgroundColor: Brand.bg,
  },
  img: { flex: 1, width: "100%" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cap: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: "#fff" },
  capSub: { fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,.82)", marginTop: 1 },
  clapPos: { position: "absolute", right: 6, top: 6 },
  hint: { fontFamily: FONT,
    fontSize: 11.5, color: Brand.soft },
});
