/** 플랫폼 분리 컴포넌트(run-map.native.tsx / run-map.web.tsx)의 공용 타입 선언. */
import type { ReactElement } from "react";

import type { LatLng } from "@/lib/run";

export declare function RunMap(props: { path: LatLng[] }): ReactElement;
