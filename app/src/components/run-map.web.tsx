/**
 * RunMap (웹) — react-native-maps는 웹 미빌드. 웹 미리보기에선 안내 플레이스홀더만.
 * 실제 지도는 안드로이드 앱에서 표시된다.
 */
import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { Brand, FONT, Weight, Radius } from "@/lib/brand";
import type { LatLng } from "@/lib/run";

type Props = { path: LatLng[]; follow?: boolean };

export function RunMap(_props: Props) {
  return (
    <View style={styles.ph}>
      <Icon name="run" size={28} color={Brand.faint} />
      <Text style={styles.t}>지도는 앱(안드로이드)에서 표시돼요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ph: {
    flex: 1,
    borderRadius: Radius.card,
    backgroundColor: Brand.warm,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  t: { color: Brand.soft, fontFamily: FONT,
    fontSize: 13, fontWeight: Weight.regular },
});
