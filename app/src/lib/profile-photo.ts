/**
 * 커스텀 프로필 사진 — 마스코트 대신 내 사진을 아바타로 쓴다. (2026-07-28 R12)
 *
 * ## 왜 기기 로컬인가
 * 마스코트(`lib/mascot.ts`)와 같은 모델이다. 이유는 두 가지.
 *
 * 1. **개인정보** — `firestore.rules`의 컬렉션들은 `read: if true`(전체 공개 읽기)다. 거기에
 *    얼굴 사진을 올리면 링크를 아는 누구나 받아갈 수 있다. 처리방침이 다루는 범위는 위치·건강이지
 *    얼굴이 아니다. **공유 저장은 처리방침 개정과 회장 결정이 선행돼야 한다.**
 * 2. **되돌리기 쉬움** — 로컬로 시작하면 나중에 공유로 올리는 건 쉽지만, 한 번 공개 컬렉션에
 *    올라간 사진은 되돌릴 수 없다.
 *
 * 그래서 지금은 **내 기기에서 내 아바타만** 바뀐다. 크루원에게도 보이게 하려면 별도 라운드에서
 * 공유 스키마 + 처리방침을 함께 손봐야 한다.
 *
 * ## 왜 base64인가
 * 갤러리(`gallery-section.tsx`)가 이미 검증한 경로다 — Storage 버킷을 따로 쓰지 않아
 * 설정이 단순하고, 아바타는 작아서 용량 부담도 없다(가로 256px로 더 줄인다).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "mm_profile_photo_v1";

let cached: string | null | undefined; // undefined = 아직 안 읽음, null = 없음
const listeners = new Set<(v: string | null) => void>();

export async function getProfilePhoto(): Promise<string | null> {
  if (cached === undefined) {
    try {
      cached = await AsyncStorage.getItem(KEY);
    } catch {
      cached = null;
    }
  }
  return cached ?? null;
}

/** dataUri를 넘기면 설정, null이면 해제(마스코트로 되돌아감). */
export async function setProfilePhoto(dataUri: string | null): Promise<void> {
  try {
    if (dataUri) await AsyncStorage.setItem(KEY, dataUri);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    return; // 저장 실패 시 화면도 안 바꾼다(구독자에게 거짓말하지 않게)
  }
  cached = dataUri;
  listeners.forEach((fn) => fn(dataUri));
}

/** 마이 탭에서 바꾸면 홈 타임라인·랭킹의 내 아바타도 즉시 따라온다(마스코트와 같은 이유). */
export function useProfilePhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(cached ?? null);

  useEffect(() => {
    let alive = true;
    void getProfilePhoto().then((v) => alive && setPhoto(v));
    const fn = (v: string | null) => alive && setPhoto(v);
    listeners.add(fn);
    return () => {
      alive = false;
      listeners.delete(fn);
    };
  }, []);

  return photo;
}
