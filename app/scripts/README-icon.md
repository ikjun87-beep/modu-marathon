# 앱 아이콘 만들기 (2026-07-31 · 워드마크 + 오키 얼굴)

아이콘은 **글자가 들어가므로 AI로 그리지 않는다** — 한글을 AI에 맡기면 자소가 깨진다
(`CLAUDE.md` 규칙). 마스코트 PNG + 글자를 **HTML로 조판해 크롬 헤드리스로 렌더**한다.

## 1) 얼굴만 잘라내기
```bash
node scripts/crop-mascot-face.mjs assets/images/mascot-m-red.png /mnt/c/adb/icon/oki-face.png
```
사각형 크롭으로는 안 된다 — 엄지척 손이 얼굴 왼쪽 아래에 붙어 있고 귀와 세로로 겹쳐서,
손을 피해 자르면 턱이 직선으로 잘린다. 그래서 **얼굴·울·귀 안쪽에 시드를 찍고 밝은 픽셀만
채워 나가는**(flood fill) 방식으로 형태를 골라낸다. 자세한 근거는 스크립트 주석 참조.

## 2) HTML 생성 → 크롬 헤드리스로 렌더
```bash
cd /mnt/c/adb/icon && python3 gen.py     # = scripts/gen-icon-html.py
C='C:\Program Files\Google\Chrome\Application\chrome.exe'
# 어댑티브 foreground(투명 배경)
powershell.exe -NoProfile -Command "& '$C' --headless=new --disable-gpu \
  --default-background-color=00000000 --virtual-time-budget=8000 \
  --screenshot='C:\adb\icon\fg-green.png' --window-size=1024,1024 --hide-scrollbars \
  'C:\adb\icon\fg-green.html'"
```

### ⚠️ 어댑티브 아이콘의 캔버스 규칙
foreground는 **108dp 캔버스**지만 런처 마스크가 보여주는 건 **가운데 72dp**뿐이다.
그래서 1024px 캔버스에서 디자인을 **가운데 683px**(=1024×72/108) 영역에 넣는다.
이걸 모르고 캔버스 전체에 디자인하면 사방이 잘린다.

### ⚠️ CSS `font-size: %` 함정
`%`는 **부모의 글자 크기** 기준이지 요소 폭 기준이 아니다. 아이콘 폭 대비로 잡으려면
부모(.area)에 `font-size:<폭>px`를 주고 자식은 `em`으로 쓴다. 처음에 이걸 놓쳐 글자가
의도의 1/3 크기로 렌더됐다.

## 3) 자산 배치
| 파일 | 용도 |
|---|---|
| `android-icon-foreground.png` | 어댑티브 foreground (현재 = 녹색 배경용, 흰 글자) |
| `android-icon-foreground-ivory.png` | 아이보리 배경용(녹색 글자) — 배경색 바꿀 때 교체 |
| `icon.png` | 스토어·기본 아이콘 512 (배경 포함) |
| `icon-ivory.png` | 아이보리 버전 보관 |
| `*-oki-only.png` | 글자 넣기 전(얼굴만) 원본 보관 |

배경색은 `app.json`의 `android.adaptiveIcon.backgroundColor`.
아이보리로 바꾸려면 **foreground도 ivory 버전으로 함께** 교체해야 한다(글자 색이 다르다).

⚠️ `adaptiveIcon.backgroundImage`를 두면 `backgroundColor`보다 우선한다 — 색만 바꿔선 안 바뀐다
(2026-07-30에 겪은 함정).
