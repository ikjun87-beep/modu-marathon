# 아이콘 자산 HTML 생성 — 크롬 헤드리스로 정확한 픽셀 크기로 렌더한다.
# 어댑티브 foreground 는 108dp 캔버스이고 **마스크가 보여주는 건 가운데 72dp**뿐이라,
# 디자인을 1024 캔버스의 가운데 683px(=1024*72/108) 영역에 넣어야 잘리지 않는다.
import io, os

def page(size, area, bg, wordcolor, transparent):
    off = (size - area) / 2
    body_bg = "transparent" if transparent else bg
    return f"""<!doctype html><meta charset="utf-8">
<style>
@font-face{{font-family:'BHS';src:url('bhs.ttf') format('truetype');font-display:block}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{size}px;height:{size}px;background:{body_bg};overflow:hidden}}
.area{{position:absolute;left:{off}px;top:{off}px;width:{area}px;height:{area}px;font-size:{area}px}}
.word{{position:absolute;left:0;right:0;text-align:center;top:19%;
  font-family:'BHS';font-size:.34em;line-height:1;letter-spacing:-.02em;color:{wordcolor}}}
.face{{position:absolute;left:50%;transform:translateX(-50%);bottom:7%;width:56%}}
.face img{{width:100%;display:block}}
</style>
<div class="area">
  <div class="word">5키로</div>
  <div class="face"><img src="oki-face.png"></div>
</div>"""

GREEN="#2f6e4a"; IVORY="#f9f1e4"
jobs = [
    # (파일명, 캔버스, 디자인영역, 배경, 글자색, 투명배경)
    ("fg-green.html",  1024, 683, GREEN, "#ffffff", True),   # 어댑티브 foreground(녹색 배경용)
    ("fg-ivory.html",  1024, 683, IVORY, GREEN,     True),   # 어댑티브 foreground(아이보리 배경용)
    ("store-green.html", 512, 512, GREEN, "#ffffff", False), # 스토어 512 (배경 포함)
    ("store-ivory.html", 512, 512, IVORY, GREEN,     False),
]
for name, size, area, bg, wc, tr in jobs:
    open(name, "w", encoding="utf-8").write(page(size, area, bg, wc, tr))
    print("wrote", name, f"{size}px / 디자인영역 {area}px")
