/**
 * 워치 기록 자동 불러오기 — 앱을 열면(그리고 포그라운드로 돌아오면) 조용히 오늘 기록을 가져온다.
 *
 * 왜: [워치 불러오기] 버튼을 매번 누르게 하면 실제로는 안 누른다. 뛰고 나서 앱을 열면
 *     기록이 이미 들어와 있어야 "연동됐다"는 느낌이 난다.
 *
 * 규칙 — 자동은 **조용해야 한다**:
 *  1) 권한창을 띄우지 않는다(`silent`). 이미 허용된 권한이 있을 때만 동작하고 없으면 물러난다.
 *     권한 요청은 사용자가 [워치 불러오기]를 직접 누른 경로에서만 한다.
 *  2) 성공/실패 어느 쪽도 알림을 띄우지 않는다. 사용자가 요청하지 않은 작업이기 때문이다.
 *     결과는 화면(runs 구독)에 조용히 반영된다.
 *  3) 동의(자동 불러오기 켬)가 있어야만 돈다. 기본값은 꺼짐.
 *  4) 심박은 별도 동의가 있을 때만 함께 읽는다 — 수동 경로와 같은 최소수집 규칙.
 */
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  hasHealthConsent,
  isWatchAutoSync,
  markAutoSyncAttempt,
  shouldAutoSyncNow,
} from "./health-consent";
import { HC_SUPPORTED, syncTodayRuns } from "./healthconnect";
import { useMyName } from "./session";

export function useWatchAutoSync(): void {
  const [name] = useMyName();
  const busy = useRef(false); // 앱 전환을 빠르게 반복해도 두 번 겹쳐 돌지 않게

  useEffect(() => {
    const who = name?.trim();
    if (!HC_SUPPORTED || !who) return;

    async function run() {
      if (busy.current) return;
      busy.current = true;
      try {
        if (!(await isWatchAutoSync())) return;
        if (!(await shouldAutoSyncNow())) return;
        await markAutoSyncAttempt();
        const withHeartRate = await hasHealthConsent();
        await syncTodayRuns(who!, { readHeartRate: withHeartRate, silent: true });
      } catch {
        // 자동은 조용히 실패한다(위 규칙 2). 수동 버튼을 누르면 원인 안내가 뜬다.
      } finally {
        busy.current = false;
      }
    }

    void run(); // 앱 시작
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void run(); // 다른 앱 갔다 돌아왔을 때(워치 동기화 직후가 여기)
    });
    return () => sub.remove();
  }, [name]);
}
