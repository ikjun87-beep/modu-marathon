/** 초대 코드 — 크루를 늘리는 공유 코드(CREW-GATE.md §1 · PHASE 2-C 세션23).
 *
 *  ⚠️ **지금은 접근 통제가 아니라 공유 편의다.** `crew.ts`의 `ensureCrewMembership()`이
 *  로그인 직후 자동으로 크루원을 만들어 코드 없이도 이미 전원이 `crews/modu`의 멤버다
 *  (1인 1크루 MVP). 그래서 이 화면의 [코드로 가입하기]는 대부분 "이미 멤버예요"로 끝난다 —
 *  실질 가치는 [코드 만들기]로 카톡 등에 공유할 때의 크루 정체성이고, 두 번째 크루(PHASE 4)가
 *  생겨 CREW_ID가 동적이 되는 시점에 이 경로가 진짜 게이트로 승격된다.
 *
 *  발급 권한: 지금은 **크루원 누구나**(오너 판단 대기 — `crews/modu.ownerUid`가 실제 사용자
 *  uid와 연결돼 있지 않아 owner 전용으로 좁히지 못한다. PHASE 2-C 보고 참조). rules는
 *  `isMember(crewId)`만 요구한다(firestore.rules PHASE 2-C).
 *
 *  ⚠️ **CSPRNG 미사용.** CREW-GATE.md는 `expo-crypto`(네이티브 모듈, 재빌드 필요)를 지정했지만
 *  이번 루프에서 새 의존성을 임의로 추가하지 않았다(`CLAUDE.md` "큰 의존성 추가는 확인 후").
 *  지금은 코드가 게이트가 아니라 공유 편의라 낮은 리스크로 Math.random()을 잠정 사용한다 —
 *  두 번째 크루가 생겨 코드가 실제 접근 통제가 되면 expo-crypto 도입을 승인받아 교체할 것.
 */
import { doc, getDoc, setDoc } from "firebase/firestore";

import { ensureSignedIn } from "./auth";
import { put } from "./crew";
import { CREW_ID, db, HAS_FIREBASE } from "./firebase";

// Crockford Base32(0/O·1/I/L·U 제외 — 구두·카톡 전달 오탈자 방지). CREW-GATE.md §1 표와 동일.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LEN = 8;

function randomCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** 화면 표시용 4-4 구분("ABCD-EFGH") — 저장·비교엔 하이픈 없는 원형을 쓴다. */
export function formatCode(code: string): string {
  return code.length === CODE_LEN ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** 손입력 정규화 — 대문자화 + 하이픈·공백 제거 + 헷갈리는 글자 치환(CREW-GATE.md §1). */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/O/g, "0");
}

/** 이 크루(CREW_ID)의 새 공유 코드를 발급한다. 호출 시점엔 이미 크루원이어야 한다
 *  (앱 진입 자체가 `ensureCrewMembership()`을 거치므로 이 화면에 온 사용자는 항상 멤버).
 *  40비트 공간이라 충돌은 사실상 없지만 방어적으로 재시도한다. */
export async function createInviteCode(): Promise<string> {
  if (!HAS_FIREBASE) throw new Error("아직 크루와 연결되지 않았어요.");
  await ensureSignedIn();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const exists = (await getDoc(doc(db, "invites", code))).exists();
    if (exists) continue;
    await put("invites", code, { crewId: CREW_ID, revoked: false });
    return code;
  }
  throw new Error("코드 생성에 실패했어요. 다시 시도해 주세요.");
}

export type JoinResult =
  | { ok: true; already: boolean }
  | { ok: false; reason: "invalid" | "revoked" | "unsupported-crew" | "offline" };

/** 코드로 가입 — 검증은 앱이 선행한다(CREW-GATE.md §1, rules는 코드-멤버십 연결을 강제하지 않음).
 *  이미 멤버면(=대부분의 경우, 위 주석 참조) 조용히 already:true로 성공 처리한다. */
export async function joinWithCode(rawCode: string): Promise<JoinResult> {
  if (!HAS_FIREBASE) return { ok: false, reason: "offline" };
  const code = normalizeCode(rawCode);
  const snap = await getDoc(doc(db, "invites", code));
  if (!snap.exists()) return { ok: false, reason: "invalid" };
  const data = snap.data() as { crewId?: string; revoked?: boolean };
  if (data.revoked) return { ok: false, reason: "revoked" };
  // 지금은 CREW_ID가 정적 상수라 다른 크루로는 실제로 이동할 수 없다(PHASE 4에서 동적 전환).
  if (data.crewId !== CREW_ID) return { ok: false, reason: "unsupported-crew" };

  const account = await ensureSignedIn();
  if (!account?.uid) return { ok: false, reason: "offline" };
  const memberRef = doc(db, "crews", CREW_ID, "members", account.uid);
  const already = (await getDoc(memberRef)).exists();
  if (!already) await setDoc(memberRef, { role: "member" });
  return { ok: true, already };
}
