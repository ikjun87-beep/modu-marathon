/** 내 이름(신원) — 웹의 "내 이름"(localStorage)에 대응. 앱은 AsyncStorage 사용.
 *  M2 다음 단계에서 Firebase Auth로 대체/확장 예정. */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mm_myname";

export async function getMyName(): Promise<string> {
  return (await AsyncStorage.getItem(KEY)) ?? "";
}

export async function setMyName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEY, name.trim());
}
