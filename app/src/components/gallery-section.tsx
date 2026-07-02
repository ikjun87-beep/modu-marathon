/** 러닝 갤러리 — 사진 선택→리사이즈→base64 저장(웹과 동일 gallery 컬렉션·방식). */
import { Image } from "expo-image";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Brand } from "@/lib/brand";
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
          <Text style={styles.upText}>{busy ? "업로드 중…" : "📸 사진 올리기"}</Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>아직 사진이 없어요. 첫 인증샷을 올려보세요! 📸</Text>
      ) : (
        <View style={styles.grid}>
          {rows.map((g) => (
            <Pressable key={g.id} style={styles.cell} onLongPress={() => del(g.id)}>
              <Image source={{ uri: g.image }} style={styles.img} contentFit="cover" />
              <Text style={styles.cap} numberOfLines={1}>
                {g.name}
              </Text>
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
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontSize: 15, fontWeight: "800", color: Brand.ink },
  up: {
    backgroundColor: Brand.brand,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  upBusy: { opacity: 0.6 },
  upText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  empty: { color: Brand.soft, fontSize: 13.5, textAlign: "center", paddingVertical: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  img: { flex: 1, width: "100%" },
  cap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  hint: { fontSize: 11.5, color: Brand.soft },
});
