/**
 * 공유 시트 — 카드를 미리 보고, 사진을 얹고, 시스템 공유 시트로 내보낸다.
 *
 * 러닝은 혼자 하지만 자랑은 밖에서 한다. 이 화면이 앱과 카톡·인스타 사이의 유일한 다리라,
 * **탭 한 번**으로 끝나야 한다: 열면 이미 완성된 카드가 떠 있고, 바꾸고 싶은 사람만 만진다.
 * (사진 넣기·비율 바꾸기는 선택. 아무것도 안 만지고 [공유하기]를 눌러도 카드가 나간다.)
 */
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type Svg from "react-native-svg";

import { Icon } from "@/components/icon";
import { CARD_W, cardHeight, ShareCard, type CardRatio } from "@/components/share-card";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius, Shadow, leading } from "@/lib/brand";
import type { Row } from "@/lib/crew";
import type { LatLng } from "@/lib/run";
import { sharePng, svgToPngBase64, type SvgShotRef } from "@/lib/share-image";

type Props = {
  visible: boolean;
  onClose: () => void;
  run: Row;
  path?: LatLng[] | null;
};

export function ShareSheet({ visible, onClose, run, path }: Props) {
  const [ratio, setRatio] = useState<CardRatio>("1:1");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState<"photo" | "share" | null>(null);
  const svgRef = useRef<Svg>(null);
  const { width, height } = useWindowDimensions();

  // 미리보기 크기 — 스토리(9:16)는 폭 기준으로 잡으면 세로가 화면을 뚫는다.
  // 검증 기준기가 320×711dp라 **높이에서 역산**해야 컨트롤과 버튼이 안 밀린다.
  const maxH = height * 0.5;
  const previewW = Math.min(
    width - 48,
    ratio === "1:1" ? maxH : (maxH * CARD_W) / cardHeight(ratio),
    380,
  );

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("사진 접근 권한이 필요해요");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (res.canceled || !res.assets?.[0]) return;

    setBusy("photo");
    try {
      // 갤러리 업로드(800px)보다 크게 잡는다 — 이 사진은 **서버에 안 올라가고** 1080px
      // 카드의 배경으로만 쓰이므로, 800px로 줄이면 확대되면서 뭉갠다.
      const out = await manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.85, format: SaveFormat.JPEG, base64: true },
      );
      setPhoto(`data:image/jpeg;base64,${out.base64 ?? ""}`);
    } catch (e: any) {
      Alert.alert("사진을 불러오지 못했어요", String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function doShare() {
    if (!svgRef.current) return;
    setBusy("share");
    try {
      const h = cardHeight(ratio);
      const base64 = await svgToPngBase64(svgRef.current as unknown as SvgShotRef, CARD_W, h);
      const tag = ratio === "1:1" ? "1x1" : "9x16";
      await sharePng(base64, `5kilo-${run.id}-${tag}.png`);
    } catch (e: any) {
      Alert.alert("공유하지 못했어요", String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* ⚠️ 안드로이드에서 pageSheet는 전체화면으로 뜬다 — SafeArea 없이는 [공유하기]가
          하단 네비게이션 바에 잘린다(실기기 캡처로 확인). */}
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.iconBtn} />
          <Text style={styles.topTitle}>기록 공유</Text>
          <PressableScale style={styles.iconBtn} onPress={onClose} hitSlop={10}>
            <Icon name="close" size={22} color={Brand.ink} />
          </PressableScale>
        </View>

        <View style={styles.previewWrap}>
          <View style={[styles.preview, { width: previewW }]}>
            <ShareCard
              ref={svgRef}
              run={run}
              path={path}
              photo={photo}
              ratio={ratio}
              previewWidth={previewW}
            />
          </View>
        </View>

        <View style={styles.controls}>
          {/* 비율 — 세그먼트 문법(트랙 + 흰 pill)은 러닝 탭·계정 시트와 같다.
              선택 상태는 액션이 아니라 정보라 솔리드 그린을 쓰지 않는다. */}
          <View style={styles.seg}>
            {(["1:1", "9:16"] as CardRatio[]).map((r) => {
              const on = ratio === r;
              return (
                <PressableScale
                  key={r}
                  style={[styles.segBtn, on && styles.segBtnOn]}
                  onPress={() => setRatio(r)}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>
                    {r === "1:1" ? "정사각" : "스토리"}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {/* 사진 — 보조 액션이라 톤온톤. 주 액션(솔리드)은 [공유하기] 하나뿐이다. */}
          <View style={styles.photoRow}>
            <PressableScale style={styles.secondary} onPress={pickPhoto} disabled={busy !== null}>
              {busy === "photo" ? (
                <ActivityIndicator color={Brand.brandDeep} />
              ) : (
                <>
                  <Icon name="camera" size={17} color={Brand.brandDeep} />
                  <Text style={styles.secondaryText}>
                    {photo ? "사진 바꾸기" : "크루 사진 넣기"}
                  </Text>
                </>
              )}
            </PressableScale>
            {photo ? (
              <PressableScale style={styles.ghost} onPress={() => setPhoto(null)}>
                <Text style={styles.ghostText}>빼기</Text>
              </PressableScale>
            ) : null}
          </View>

          <PressableScale style={styles.primary} onPress={doShare} disabled={busy !== null}>
            {busy === "share" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="share" size={18} color="#fff" />
                <Text style={styles.primaryText}>공유하기</Text>
              </>
            )}
          </PressableScale>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: Radius.input },
  topTitle: { fontFamily: FONT,
    fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },

  previewWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  // 실제로 나가는 PNG는 사각형이다 — 미리보기를 카드처럼 크게 둥글리면 "보이는 대로 나온다"가
  // 깨진다. 띄워 보이게 그림자는 주되 모서리는 살짝만.
  preview: { borderRadius: 12, overflow: "hidden", ...Shadow.card },

  controls: { padding: 18, paddingBottom: 28, gap: 12 },

  seg: {
    flexDirection: "row",
    backgroundColor: Brand.warm,
    borderRadius: Radius.input,
    padding: 4,
    gap: 4,
  },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: Radius.chip },
  segBtnOn: { backgroundColor: Brand.card },
  segText: { fontFamily: FONT, fontSize: 14, fontWeight: Weight.regular, color: Brand.soft },
  segTextOn: { color: Brand.brandDeep, fontWeight: Weight.bold },

  photoRow: { flexDirection: "row", gap: 10 },
  secondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.input,
  },
  secondaryText: { fontFamily: FONT, fontSize: 15, fontWeight: Weight.bold, color: Brand.brandDeep },
  ghost: {
    paddingHorizontal: 18,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.input,
    backgroundColor: Brand.warm,
  },
  ghostText: { fontFamily: FONT, fontSize: 15, fontWeight: Weight.regular, color: Brand.soft },

  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    backgroundColor: Brand.brand,
    borderRadius: Radius.input,
  },
  primaryText: { fontFamily: FONT, fontSize: 16, fontWeight: Weight.bold, color: "#fff" },
});
