/** 러너 네임(신원) 저장의 **단일 경로**.
 *
 *  이름을 바꾸는 곳이 두 군데(마이 탭·크루 탭 NameField)라, 각자 저장하면
 *  한쪽은 과거 기록을 안 고치는 식으로 어긋난다. 그래서 여기 하나로 모은다.
 *
 *  하는 일: ① 이 기기에 저장(session) ② 로그인 상태면 계정 표시이름도 갱신
 *          ③ **이미 남긴 글·참석·러닝·댓글의 작성자명까지 새 이름으로 전파**(crew.renameAuthor)
 *
 *  ③이 필요한 이유: 문서에 작성자가 name 문자열로 박제된다(웹과 공유하는 스키마).
 *  전파하지 않으면 이름을 바꾼 순간 과거 기록이 "남의 것"이 되어 통계·배지에서도 빠진다.
 */
import { updateAccountName } from "./auth";
import { renameAuthor } from "./crew";
import { movePhotoOnRename } from "./profile-photo";
import { setMyName } from "./session";

/** @returns 함께 이름이 바뀐 과거 문서 수
 *  @throws 전파(renameAuthor)가 실패하면 던진다 — 이때 **세션 이름은 안 바뀐 채로 남는다.**
 *
 *  ⚠️ 순서가 중요하다. 예전엔 setMyName을 먼저 했다가 전파가 실패하면, 세션은 이미 새 이름이라
 *  "다시 시도"가 `prev === next`로 막혀 **재시도 자체가 불가능**했다(과거 기록 영구 고아).
 *  → **전파를 먼저** 하고, 성공한 뒤에 세션·계정을 바꾼다. 실패하면 옛 이름 그대로라 재시도가 된다. */
export async function saveRunnerName(prevName: string, nextName: string): Promise<number> {
  const next = nextName.trim();
  if (!next) return 0;

  const changed = await renameAuthor(prevName, next); // 실패하면 여기서 던짐 → 아래 안 실행
  await setMyName(next);
  await updateAccountName(next);
  // 프로필 사진 문서는 id가 러너 네임이라 **따로 옮겨야** 한다(2026-07-31 공유 저장 전환).
  // 실패해도 개명 자체는 이미 성공했으므로 되돌리지 않는다 — 사진만 마스코트로 보일 뿐이고,
  // 사용자가 다시 넣으면 새 이름으로 저장된다. 여기서 던지면 개명이 실패한 것처럼 보인다.
  try {
    await movePhotoOnRename(prevName, next);
  } catch {
    /* 사진 이동 실패는 개명을 막지 않는다 */
  }
  return changed;
}
