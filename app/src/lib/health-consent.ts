/**
 * 건강(심박) 민감정보 별도 동의 게이트.
 * 워치 불러오기는 Health Connect에서 심박(avgHr)을 읽어 저장한다 — 심박은 개인정보보호법상 '민감정보'.
 * 민감정보는 일반 개인정보와 분리해 '별도 동의'를 받아야 하므로(법 §23), 최초 1회 명시 동의를 저장한다.
 * 동의 철회 시 이후 워치 동기화가 심박 없이 동작하도록 clearHealthConsent 제공.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mm_health_consent_v1";

export async function hasHealthConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function setHealthConsent(granted: boolean): Promise<void> {
  if (granted) await AsyncStorage.setItem(KEY, "1");
  else await AsyncStorage.removeItem(KEY);
}
