/** 플랫폼 분리 컴포넌트(run-map.native.tsx / run-map.web.tsx)의 공용 타입 선언. */
import type { ReactElement, Ref } from "react";

import type { LatLng } from "@/lib/run";

/** 지도 스냅샷 — 공유 카드에 **실제 지도 위 경로**를 넣기 위해 화면에 떠 있는 지도를 그대로 찍는다.
 *
 *  숨겨둔 지도를 따로 렌더해 찍는 방법도 있지만, 화면 밖 MapView는 타일을 안 불러와 빈 지도가
 *  나온다. 그래서 **이미 사용자가 보고 있는 지도**(러닝 요약·러닝 상세)를 찍는다.
 *  @returns `data:image/jpeg;base64,...` 또는 실패 시 null(카드는 벡터 폴리라인으로 폴백) */
export type RunMapHandle = { snapshot: () => Promise<string | null> };

export declare function RunMap(props: {
  path: LatLng[];
  follow?: boolean;
  ref?: Ref<RunMapHandle>;
}): ReactElement;
