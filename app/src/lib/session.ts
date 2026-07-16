/** 내 이름(러너 네임 · 신원) — 웹의 "내 이름"(localStorage)에 대응. 앱은 AsyncStorage 사용.
 *
 *  ⚠ 여기는 **읽는 화면이 여러 개**다(홈 인사말·크루 이름칸·랭킹 내순위·댓글 작성자·마이·온보딩).
 *  예전엔 각 화면이 마운트 때 getMyName()을 한 번만 읽어서, 마이 탭에서 이름을 바꿔도
 *  이미 떠 있는 크루 탭은 옛 이름을 들고 있었다. 그 상태로 [참석]을 누르면 **옛 이름으로
 *  참석이 하나 더 생겨 유령 참석자가 됐다**(실기기 확인). 로그인(auth.ts)도 이름을 바꾸므로
 *  같은 문제를 낳는다.
 *
 *  그래서 이름을 **구독 가능한 단일 저장소**로 둔다. 쓰기는 항상 setMyName을 지나가고,
 *  지나갈 때 구독자 전원에게 알린다. 화면은 useMyName()으로 받아 쓴다.
 *
 *  (이름을 바꾸는 상위 경로는 lib/identity.ts의 saveRunnerName — 기기·계정·과거 기록 전파까지.)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "mm_myname";

/** 마지막으로 알려진 이름. undefined = 아직 AsyncStorage에서 안 읽음. */
let cached: string | undefined;
const listeners = new Set<(name: string) => void>();

export async function getMyName(): Promise<string> {
  if (cached === undefined) cached = (await AsyncStorage.getItem(KEY)) ?? "";
  return cached;
}

export async function setMyName(name: string): Promise<void> {
  const next = name.trim();
  await AsyncStorage.setItem(KEY, next);
  if (next === cached) return; // 같은 값이면 리렌더 낭비 안 함
  cached = next;
  listeners.forEach((fn) => fn(next));
}

/** 이름 변경 구독. @returns 해지 함수 */
export function subscribeMyName(fn: (name: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 화면용 훅 — 현재 러너 네임을 구독한다.
 *  @returns [이름, 최초 로드 완료 여부] — 로드 전엔 빈 문자열이라 온보딩 등에서 구분이 필요하다. */
export function useMyName(): [string, boolean] {
  const [name, setName] = useState(cached ?? "");
  const [loaded, setLoaded] = useState(cached !== undefined);

  useEffect(() => {
    let alive = true;
    void getMyName().then((n) => {
      if (!alive) return;
      setName(n);
      setLoaded(true);
    });
    const off = subscribeMyName((n) => {
      if (alive) setName(n);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  return [name, loaded];
}
