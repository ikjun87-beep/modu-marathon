"""TTF 직접 파싱 — 한글 음절이 ①cmap에 매핑됐는지 ②실제 윤곽선이 있는지 확인.
   조사에서 '매핑은 됐는데 윤곽선이 비어 안 보이는' 폰트들이 나왔다 → 둘 다 봐야 한다."""
import struct, sys

def u16(b,o): return struct.unpack(">H", b[o:o+2])[0]
def i16(b,o): return struct.unpack(">h", b[o:o+2])[0]
def u32(b,o): return struct.unpack(">I", b[o:o+4])[0]

data = open(sys.argv[1],"rb").read()
num = u16(data,4)
tables={}
for i in range(num):
    o=12+i*16
    tag=data[o:o+4].decode("latin1")
    tables[tag]=(u32(data,o+8), u32(data,o+12))

# cmap format 4 파싱
co,_=tables["cmap"]
n=u16(data,co+2)
sub=None
for i in range(n):
    p=co+4+i*8
    pid,eid=u16(data,p),u16(data,p+2)
    off=u32(data,p+4)
    if (pid,eid) in ((3,1),(3,10),(0,3),(0,4)):
        sub=co+off
        if (pid,eid)==(3,1): break
fmt=u16(data,sub)
cmap={}
if fmt==4:
    segX2=u16(data,sub+6); seg=segX2//2
    endO=sub+14; startO=endO+segX2+2; deltaO=startO+segX2; rangeO=deltaO+segX2
    for s in range(seg):
        end=u16(data,endO+s*2); start=u16(data,startO+s*2)
        delta=i16(data,deltaO+s*2); ro=u16(data,rangeO+s*2)
        if start==0xFFFF: continue
        for c in range(start,end+1):
            if ro==0: g=(c+delta)&0xFFFF
            else:
                gi=rangeO+s*2+ro+(c-start)*2
                if gi+2>len(data): continue
                g=u16(data,gi)
                if g: g=(g+delta)&0xFFFF
            if g: cmap[c]=g
else:
    print("cmap format", fmt, "— 파서 미지원"); sys.exit(1)

# loca/glyf로 윤곽선 유무
ho,_=tables["head"]; longLoca=u16(data,ho+50)
lo,_=tables["loca"]; go,_=tables["glyf"]
mo,_=tables["maxp"]; nGlyphs=u16(data,mo+4)
def glyph_len(g):
    if longLoca: a=u32(data,lo+g*4); b=u32(data,lo+(g+1)*4)
    else: a=u16(data,lo+g*2)*2; b=u16(data,lo+(g+1)*2)*2
    return b-a

total=mapped=blank=0; missing=[]
for cp in range(0xAC00,0xD7A4):
    total+=1
    g=cmap.get(cp)
    if not g: missing.append(cp); continue
    mapped+=1
    if glyph_len(g)==0: blank+=1

print(f"한글 음절 {total}자")
print(f"  매핑됨            : {mapped}")
print(f"  매핑 안 됨(두부)   : {len(missing)}")
print(f"  매핑O 윤곽X(안보임): {blank}")
if missing: print("  누락 예:", "".join(chr(c) for c in missing[:12]))
ok = len(missing)==0 and blank==0
print("판정:", "✅ 완전 지원" if ok else "❌ 결함 있음")
