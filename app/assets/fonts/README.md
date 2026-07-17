# LINE Seed Sans KR

- **출처(공식)**: https://seed.line.me/index_kr.html → `LINE_Seed_Sans_KR.zip` (2023.09.06)
- **라이선스**: SIL Open Font License 1.1 — **폰트 파일 안(name table)에 직접 명시**돼 있음:
  > "This Font Software is licensed under the SIL Open Font License, Version 1.1."
  > http://scripts.sil.org/OFL
- **저작권**: © LY Corporation / Sandoll Inc. / LINE VX Design / Dalton Maag Ltd.
- **상업 이용·앱 임베딩 가능.** 단 폰트 파일 자체를 판매하는 것은 금지.

## 왜 이 폰트인가 (2026-07-17 조사)

회장 요청 "당근처럼 부드럽고 귀염귀염하게". 후보를 전수 검토한 결과:

- **나눔스퀘어라운드 · 카페24 써라운드(기본) · BM 주아 · SUIT · Paperlogy → 전부 탈락.**
  한글 11,172자를 다 담지 않는다. **드문 글자가 든 러너 네임이 통째로 안 보이게 렌더된다.**
  러너 네임은 사용자 자유 입력이라 이건 테스트로 못 잡는 치명적 결함.
- **나눔스퀘어 Neo** — 커버리지는 되나 name table에 `All rights reserved`뿐, OFL 선언 없음 → 번들 금지.
- **CookieRun** — 둥글고 좋지만 독점 라이선스(Devsisters 권리 유보) → 탈락.
- **카페24 써라운드 에어** — OFL·완전지원·더 둥글지만 **가는 굵기 하나뿐**이라 제목이 연약해짐.

→ **LINE Seed Sans KR**: OFL(파일 내 확인) · 한글 완전지원 · 굵기 3종.

## 우리 손으로 검증함 (남의 말 안 믿고)

`scripts/check-font-hangul.py`로 TTF를 직접 파싱:
- Regular / Bold 둘 다 **한글 11,172자 전부 매핑 + 윤곽선 존재** (매핑만 되고 빈 글리프 = 0)

## 담은 파일

- `LINESeedKR-Rg.ttf` (weight 400)
- `LINESeedKR-Bd.ttf` (weight 700)
- Thin은 쓸 데가 없어 뺐다(3.4MB 절약).
