/**
 * 건강(심박) 민감정보 별도 동의 게이트 + 워치 자동 불러오기 설정.
 *
 * 워치 불러오기는 Health Connect에서 심박(avgHr)을 읽어 저장한다 — 심박은 개인정보보호법상 '민감정보'.
 * 민감정보는 일반 개인정보와 분리해 '별도 동의'를 받아야 하므로(법 §23), 최초 1회 명시 동의를 저장한다.
 * 동의 철회 시 이후 워치 동기화가 심박 없이 동작하도록 setHealthConsent(false) 제공.
 *
 * ⚠️ 키가 **v2**인 이유: v1 동의 문구는 "불러올 때 심박을 함께 저장"만 고지했고,
 *    **앱을 열 때 자동으로 불러온다**는 사실은 없었다. 자동 수집은 고지 범위를 넘으므로
 *    문구를 바꾼 이상 v1 동의를 그대로 승계하면 안 된다 → 키를 올려 새 문구로 다시 받는다.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mm_health_consent_v2"; // 심박(민감정보) 수집 동의
const AUTO_KEY = "mm_watch_autosync_v1"; // 자동 불러오기 켬/끔
const AT_KEY = "mm_watch_autosync_at_v1"; // 마지막 자동 시도 시각(ms)

/** 자동 시도 최소 간격. 앱을 연달아 열고 닫아도 이 간격 안에는 다시 조회하지 않는다. */
const MIN_GAP_MS = 30 * 60 * 1000; // 30분

export async function hasHealthConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function setHealthConsent(granted: boolean): Promise<void> {
  if (granted) await AsyncStorage.setItem(KEY, "1");
  else await AsyncStorage.removeItem(KEY);
}

/** 워치 자동 불러오기 켜짐 여부. **기본값 꺼짐** — 동의 화면에서 명시적으로 켠 사람만 돈다. */
export async function isWatchAutoSync(): Promise<boolean> {
  return (await AsyncStorage.getItem(AUTO_KEY)) === "1";
}

/** 마이 탭 토글·동의 화면에서 호출. 끄면 시도 기록도 지워, 다시 켤 때 곧바로 한 번 돈다. */
export async function setWatchAutoSync(on: boolean): Promise<void> {
  if (on) await AsyncStorage.setItem(AUTO_KEY, "1");
  else {
    await AsyncStorage.removeItem(AUTO_KEY);
    await AsyncStorage.removeItem(AT_KEY);
  }
}

/**
 * 지금 자동 동기화를 시도해도 되는지. 마지막 시도로부터 30분이 지났으면 true.
 *
 * ⚠️ "하루 1회"(날짜 키)로 만들지 않은 이유: 아침에 앱을 한 번 열면 그날 몫이 소진돼
 *    **저녁에 뛴 기록이 다음 날까지 자동으로 안 들어온다.** 시간 간격 기준이면
 *    "앱 켤 때마다"와 "하루 한 번"을 동시에 만족하면서 그 함정이 없다.
 *    Health Connect 조회는 온디바이스라 싸고, 저장은 sourceId 멱등이라 중복도 안 생긴다.
 */
export async function shouldAutoSyncNow(): Promise<boolean> {
  const last = Number(await AsyncStorage.getItem(AT_KEY)) || 0;
  return Date.now() - last >= MIN_GAP_MS;
}

/** 자동 동기화를 **시도한** 시각 기록. 성공/실패와 무관하게 찍어 실패 시 재시도 폭주를 막는다. */
export async function markAutoSyncAttempt(): Promise<void> {
  await AsyncStorage.setItem(AT_KEY, String(Date.now()));
}
