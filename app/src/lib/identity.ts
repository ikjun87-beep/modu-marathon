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
import { setMyName } from "./session";

/** @returns 함께 이름이 바뀐 과거 문서 수 */
export async function saveRunnerName(prevName: string, nextName: string): Promise<number> {
  const next = nextName.trim();
  if (!next) return 0;

  await setMyName(next);
  await updateAccountName(next);
  return renameAuthor(prevName, next);
}
