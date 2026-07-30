/**
 * 공유 카드 → PNG → 시스템 공유 시트.
 *
 * ## 왜 뷰 캡처가 아니라 SVG인가
 * 화면에 보이는 RN 뷰를 그대로 캡처하려면 `react-native-view-shot` 같은 네이티브 모듈이
 * 하나 더 필요하고, 캡처 해상도가 **기기 화면 밀도에 묶인다** — 320dp 폭 테스트폰에서
 * 뽑으면 인스타에 올렸을 때 흐리다. `react-native-svg`는 이미 쓰고 있고,
 * `viewBox`를 준 Svg는 `toDataURL(w, h)`에서 **캔버스 크기에 맞춰 정확히 스케일**된다
 * (네이티브 `SvgView.drawChildren`이 canvas 크기로 viewBox 행렬을 다시 계산한다).
 * 그래서 화면엔 300px로 보여주고 파일은 1080px로 뽑을 수 있다.
 *
 * ## 대신 감수하는 것
 * SVG에는 레이아웃 엔진이 없다. 텍스트를 나란히 놓으려면 **글자 폭을 직접 계산**해야 한다
 * → `lib/text-metrics.ts`. 좌표표는 `lib/share-layout.ts`(둘 다 RN 비의존이라 node로 검산된다).
 */
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/** react-native-svg의 `Svg` ref — `toDataURL`만 쓴다(타입이 export 되지 않아 최소 형태로 선언). */
export type SvgShotRef = { toDataURL: (cb: (base64: string) => void, options?: object) => void };

/** Svg를 지정 해상도 PNG(base64)로. 렌더 전이면 네이티브가 알아서 기다렸다 콜백한다. */
export function svgToPngBase64(ref: SvgShotRef, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    // 네이티브 콜백이 영영 안 오는 경우(뷰가 언마운트됨)에 사용자를 무한 대기시키지 않는다.
    const timer = setTimeout(() => reject(new Error("카드 이미지를 만들지 못했어요.")), 8000);
    try {
      ref.toDataURL(
        (base64) => {
          clearTimeout(timer);
          base64 ? resolve(base64) : reject(new Error("카드 이미지가 비어 있어요."));
        },
        { width, height },
      );
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

/**
 * PNG(base64)를 캐시에 쓰고 공유 시트를 연다.
 *
 * 캐시 디렉터리를 쓰는 이유: 공유가 끝나면 남겨둘 이유가 없는 파일이고, 저장공간이 부족하면
 * 시스템이 알아서 지운다. 파일명을 고정하지 않고 러닝 id를 붙이는 건 **카톡·인스타가
 * 같은 이름의 옛 파일을 캐시해 이전 카드를 보내는** 사고를 막기 위해서다.
 */
export async function sharePng(base64: string, fileName: string): Promise<void> {
  // 가용성부터 확인한다 — 웹 미리보기처럼 공유가 없는 환경에서 파일을 먼저 만들면
  // 파일시스템 쪽에서 엉뚱한 에러가 나고, 사용자는 "왜 안 되는지"를 못 읽는다.
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("이 기기에서는 공유를 쓸 수 없어요.");
  }

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create({ overwrite: true });
  file.write(base64, { encoding: "base64" });

  await Sharing.shareAsync(file.uri, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "러닝 기록 공유",
  });
}
