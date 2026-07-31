/**
 * 커스텀 프로필 사진 — 마스코트 대신 내 사진을 아바타로 쓴다. (2026-07-28 R12)
 *
 * ## 2026-07-31 기기 로컬 → **크루 공유**로 전환 (회장 결정 · L3)
 * 크루원끼리 서로 얼굴을 볼 수 있어야 "크루 앱"이 된다는 판단. 되돌릴 수 없는 변경이라
 * 아래 세 가지를 함께 넣었다 — 셋 중 하나라도 빠지면 이 기능은 켜면 안 된다.
 *
 * 1. **처리방침 개정 선행** — `docs/PRIVACY.md` · `web/privacy.html`에 "프로필 사진(선택)"을
 *    수집·공개 항목으로 명시했다. 얼굴은 위치·건강과 다른 종류의 개인정보다.
 * 2. **화면에서의 고지** — 마이 탭 사진 등록 자리에 "크루원에게 보여요"를 적는다. 동의는
 *    약관이 아니라 그 행동을 하는 자리에서 이뤄져야 한다.
 * 3. **삭제 경로** — 언제든 [사진 빼기]로 서버 문서까지 지운다(로컬만 지우는 게 아니다).
 *
 * ⚠️ 알고도 감수하는 것: `firestore.rules`의 컬렉션은 `read: if true`(공개 읽기)다.
 * 링크를 아는 사람은 앱 밖에서도 받아갈 수 있다. 소유 기반 규칙으로 좁히려면 웹까지 Auth를
 * 붙이고 문서에 uid를 심어야 하는데(스키마 전반 공사), 그건 별도 라운드다.
 *
 * ## 왜 base64인가
 * 갤러리(`gallery-section.tsx`)가 이미 검증한 경로다 — Storage 버킷을 따로 쓰지 않아 설정이
 * 단순하다. 아바타는 **가로 256px**로 줄여 담기 때문에 Firestore 문서 1MB 한도에 여유가 크다.
 *
 * ## 문서 id = 러너 네임
 * 이 앱의 신원은 이름이다(웹과 공유하는 스키마라 uid 키를 못 쓴다 — `crew.ts` renameAuthor 주석).
 * 이름을 그대로 id로 쓰면 `/`가 섞였을 때 경로가 깨지므로 **encodeURIComponent**로 감싼다.
 * 개명하면 새 id로 다시 쓰고 옛 문서를 지운다(`movePhotoOnRename`).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { put, remove, subscribe, type Row } from "./crew";
import { COLLECTIONS } from "./firebase";
import { getMyName as getMyNameFromSession, subscribeMyName } from "./session";

/** 로컬 캐시 — 서버가 원본이지만, 앱을 켜자마자 내 얼굴이 보이도록 마지막 값을 들고 있는다. */
const KEY = "mm_profile_photo_v1";

/** 문서 id로 안전한 형태. 러너 네임에 `/`가 들어가면 Firestore 경로가 깨진다. */
function photoDocId(name: string): string {
  return encodeURIComponent(name.trim());
}

// ── 크루 전체의 사진 맵 (이름 → dataUri) ────────────────────────────────
let photoMap: Record<string, string> = {};
const mapListeners = new Set<(m: Record<string, string>) => void>();
let started = false;

function startSubscription() {
  if (started) return;
  started = true;
  subscribe(COLLECTIONS.profiles, (rows: Row[]) => {
    const next: Record<string, string> = {};
    for (const r of rows) {
      const n = String(r.name ?? "").trim();
      const p = typeof r.photo === "string" ? r.photo : "";
      // data:image 가 아닌 값은 무시한다 — 갤러리 XSS 대응과 같은 게이트(2026-07-15).
      if (n && p.startsWith("data:image/")) next[n] = p;
    }
    photoMap = next;
    mapListeners.forEach((fn) => fn(next));
  });
}

/** 크루원 사진 맵을 구독한다. 이름을 키로 아바타가 찾아 쓴다. */
export function useCrewPhotos(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>(photoMap);
  useEffect(() => {
    startSubscription();
    setMap(photoMap);
    const fn = (m: Record<string, string>) => setMap(m);
    mapListeners.add(fn);
    return () => {
      mapListeners.delete(fn);
    };
  }, []);
  return map;
}

/**
 * 이 사람의 사진(없으면 null). 아바타가 마스코트/이니셜로 폴백할지 판단하는 데 쓴다.
 *
 * @param me 내 아바타인가. **이름 비교 대신 이 플래그를 쓴다** — 모듈이 들고 있는 내 이름은
 *   세션 로드 타이밍에 따라 잠깐 비어 있을 수 있고, 그러면 등록 직후 내 얼굴이 안 나온다.
 *   호출부(Avatar)는 자기가 나인지 이미 알고 있으므로 그 정보를 그대로 받는다.
 */
export function usePhotoOf(name: string | undefined, me = false): string | null {
  const map = useCrewPhotos();
  const local = useProfilePhoto();
  const key = (name ?? "").trim();
  // 내 사진은 서버 반영 전에도 즉시 보여야 한다(등록 직후 한 박자 비는 걸 막는다).
  return (key ? map[key] : null) ?? (me ? local : null) ?? null;
}

// ── 내 사진 ───────────────────────────────────────────────────────────
let cached: string | null | undefined; // undefined = 아직 안 읽음, null = 없음
let myName = "";
const listeners = new Set<(v: string | null) => void>();

/** 내 러너 네임을 알려준다 — 저장·삭제할 문서 id를 정하는 데 필요하다.
 *
 *  화면에서 부르지 않고 **세션을 직접 구독**한다. 마이 탭에 들어가야만 owner가 정해지는 구조면,
 *  개명 직후처럼 그 화면을 거치지 않은 경로에서 엉뚱한 id로 쓰게 된다. */
export function setPhotoOwner(name: string) {
  myName = (name ?? "").trim();
}
// ⚠️ `subscribeMyName`은 **변경될 때만** 부른다. 앱을 재시작하면 이름은 저장소에서 읽히기만 하고
//    setMyName을 지나가지 않아 콜백이 한 번도 안 온다 → owner가 빈 채로 남는다.
//    그 상태로 사진을 등록하면 아래 `if (owner)` 가드에 걸려 **서버 쓰기가 조용히 건너뛰어지고**,
//    로컬만 저장돼 "성공한 것처럼" 보였다(2026-07-31 실기기에서 이 증상으로 발견).
//    → 구독과 함께 **현재 값도 즉시 읽어온다.**
void getMyNameFromSession().then((n) => setPhotoOwner(n));
subscribeMyName((n) => setPhotoOwner(n));

/** 저장 직전에 소유자를 확실히 확보한다 — 위 초기화가 아직 안 끝났을 수도 있다. */
async function currentOwner(): Promise<string> {
  if (!myName) myName = (await getMyNameFromSession()).trim();
  return myName;
}

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

/**
 * dataUri를 넘기면 설정, null이면 해제(마스코트로 되돌아감).
 *
 * 서버에 먼저 쓰고 로컬을 갱신한다 — 반대로 하면 서버 실패 시 "내 화면에만 있는 사진"이 생겨,
 * 크루에게 보이는 줄 알았는데 아무도 못 보는 상태가 된다.
 */
export async function setProfilePhoto(dataUri: string | null): Promise<void> {
  const owner = await currentOwner();
  if (owner) {
    const id = photoDocId(owner);
    if (dataUri) await put(COLLECTIONS.profiles, id, { name: owner, photo: dataUri });
    else await remove(COLLECTIONS.profiles, id);
  }

  try {
    if (dataUri) await AsyncStorage.setItem(KEY, dataUri);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // 로컬 캐시 실패는 치명적이지 않다(서버가 원본) — 화면 갱신은 그대로 진행한다.
  }
  cached = dataUri;
  listeners.forEach((fn) => fn(dataUri));
}

/** 개명 시 사진 문서도 새 이름으로 옮긴다 — 안 하면 아바타만 마스코트로 돌아간다. */
export async function movePhotoOnRename(oldName: string, newName: string): Promise<void> {
  const photo = await getProfilePhoto();
  if (!photo) return;
  const from = photoDocId(oldName);
  const to = photoDocId(newName);
  if (from === to) return;
  await put(COLLECTIONS.profiles, to, { name: newName.trim(), photo });
  await remove(COLLECTIONS.profiles, from);
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
