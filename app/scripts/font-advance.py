"""TTF hmtx 파싱 — 글자별 advance width(em 비율)를 뽑는다.
   공유 카드는 SVG로 그려서 RN 레이아웃 엔진이 없다 → 숫자 뒤에 "km"을 붙이려면
   숫자 블록의 실제 폭을 알아야 한다. 눈대중 상수 대신 폰트에서 실측한다."""
import struct, sys

def u16(b, o): return struct.unpack(">H", b[o:o+2])[0]
def i16(b, o): return struct.unpack(">h", b[o:o+2])[0]
def u32(b, o): return struct.unpack(">I", b[o:o+4])[0]

data = open(sys.argv[1], "rb").read()
tables = {}
for i in range(u16(data, 4)):
    o = 12 + i * 16
    tables[data[o:o+4].decode("latin1")] = (u32(data, o+8), u32(data, o+12))

co, _ = tables["cmap"]
sub = None
for i in range(u16(data, co+2)):
    p = co + 4 + i * 8
    pid, eid = u16(data, p), u16(data, p+2)
    if (pid, eid) in ((3, 1), (3, 10), (0, 3), (0, 4)):
        sub = co + u32(data, p+4)
        if (pid, eid) == (3, 1): break
cmap = {}
segX2 = u16(data, sub+6); seg = segX2 // 2
endO = sub + 14; startO = endO + segX2 + 2; deltaO = startO + segX2; rangeO = deltaO + segX2
for s in range(seg):
    end = u16(data, endO+s*2); start = u16(data, startO+s*2)
    delta = i16(data, deltaO+s*2); ro = u16(data, rangeO+s*2)
    if start == 0xFFFF: continue
    for c in range(start, end+1):
        if ro == 0: g = (c + delta) & 0xFFFF
        else:
            gi = rangeO + s*2 + ro + (c - start) * 2
            if gi + 2 > len(data): continue
            g = u16(data, gi)
            if g: g = (g + delta) & 0xFFFF
        if g: cmap[c] = g

ho, _ = tables["head"]; upem = u16(data, ho+18)
hh, _ = tables["hhea"]; nhm = u16(data, hh+34)
hm, _ = tables["hmtx"]

def adv(ch):
    g = cmap.get(ord(ch))
    if g is None: return None
    if g >= nhm: g = nhm - 1
    return u16(data, hm + g*4) / upem

print(f"unitsPerEm={upem}")
for ch in sys.argv[2]:
    a = adv(ch)
    print(f"  {ch!r}: {a:.4f}" if a is not None else f"  {ch!r}: (없음)")
