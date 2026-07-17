/**
 * 이미 축하한 배지 기록 — "새로 딴 배지"를 알아내려면 "이전에 뭘 갖고 있었나"를 알아야 한다.
 *
 * ⚠️ 첫 실행 시딩이 핵심: 이 키가 없는 사용자(=업데이트로 이 기능을 처음 받은 사람, 또는 재설치)는
 * 이미 배지를 여러 개 갖고 있다. 그대로 비교하면 **앱을 켜자마자 축하가 5번 터진다.**
 * → 키가 없으면 축하 없이 현재 상태를 그대로 심어두고(seed), 그 다음부터 비교한다.
 *
 * 기기 로컬(AsyncStorage)에만 둔다 — 서버에 올릴 가치가 없고(연출용), 기기 바꾸면 다시 시딩되면 그만.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mm_seen_badges_v1";

/** 이미 축하한 배지 id들. 아직 시딩 전이면 null(=축하하지 말고 시딩부터). */
export async function loadSeenBadges(): Promise<Set<string> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw == null) return null;
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return null; // 깨진 값 → 시딩부터 다시(축하 폭발보다 낫다)
  }
}

export async function saveSeenBadges(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // 저장 실패는 삼킨다 — 최악이라도 다음에 축하가 한 번 더 뜨는 정도(앱은 멀쩡)
  }
}
