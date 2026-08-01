# 스토어 자산 만들기

아이콘과 같은 방식 — **글자는 AI가 아니라 HTML로 조판해 크롬 헤드리스로 렌더**한다
(`scripts/README-icon.md`와 같은 이유).

## 그래픽 이미지 (1024×500)
스토어 목록 상단에 크게 걸리는 배너다. 규격은 **1024×500 · JPG 또는 24bit PNG · 투명 불가**.

```bash
# 자산 준비(마스코트·폰트를 렌더 폴더로)
D=/mnt/c/adb/store; mkdir -p $D
cp app/assets/images/mascot-m-red.png $D/oki-full.png
cp app/assets/fonts/BlackHanSans-Regular.ttf $D/bhs.ttf
cp app/assets/fonts/LINESeedKR-Bd.ttf $D/ls-bd.ttf
cp app/scripts/store-feature.html $D/feature.html

C='C:\Program Files\Google\Chrome\Application\chrome.exe'
powershell.exe -NoProfile -Command "& '$C' --headless=new --disable-gpu \
  --virtual-time-budget=8000 --screenshot='C:\adb\store\feature.png' \
  --window-size=1024,500 --hide-scrollbars 'C:\adb\store\feature.html'"
```
결과: `assets/store/feature-graphic-1024x500.png`

구성 = 워드마크 + 슬로건("오늘 5키로, 오키?") + 한 줄 설명 + 기능 칩 3개 + 오키 전신.
오키를 오른쪽에서 살짝 잘리게 둬서 화면 밖으로 이어지는 느낌을 준다.

## 스크린샷
**비공개 테스트 중 실데이터로 찍는다** — 이유와 찍을 화면 목록은 `docs/PLAYSTORE.md` §4-1 참조.
