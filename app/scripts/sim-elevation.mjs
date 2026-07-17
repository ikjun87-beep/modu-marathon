/**
 * 누적 상승고도 알고리즘 시뮬레이터 — `src/components/live-run.tsx`의 로직을 그대로 옮긴 것.
 *
 * 왜 있나: GPS 고도는 ±6m씩 흔들려서 **실기기로는 검증이 거의 불가능하다**(같은 코스를
 * 같은 노이즈로 다시 뛸 수 없다). 그래서 합성 시나리오(평지·정지·언덕·오르내리막)로
 * 파라미터를 고른다. live-run.tsx의 상수를 바꾸면 여기 먼저 돌려서 표를 확인할 것.
 *
 * 실행: node app/scripts/sim-elevation.mjs
 *
 * 배운 것(2026-07-17):
 *  - 단순 문턱(anchor+3m)은 잔떨림이 문턱보다 크면 그대로 샌다 → 정지 30분에 3003m.
 *  - 문턱을 키우면 봉우리 직전을 놓쳐 60m 언덕이 33m가 된다 → 그래서 골짜기→봉우리로 바꿈.
 */
const ACC_MAX = 8;
function pv({alpha,rev}){ return (s)=>{
  let ema=null,valley=null,peak=null,gain=0,rising=true;
  for(const {alt,acc=5} of s){
    if(alt==null||acc>ACC_MAX)continue;
    ema=ema==null?alt:ema+alpha*(alt-ema);
    if(valley==null){valley=peak=ema;continue;}
    if(rising){ if(ema>peak)peak=ema; else if(ema<peak-rev){gain+=peak-valley;rising=false;valley=ema;} }
    else{ if(ema<valley)valley=ema; else if(ema>valley+rev){rising=true;peak=ema;} }
  }
  if(rising&&peak!=null&&valley!=null)gain+=Math.max(0,peak-valley);
  return gain;};}
let seed; const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
const nz=a=>(rnd()-0.5)*2*a;
const S={
 "평지 20분":()=>{seed=1;return Array.from({length:1200},()=>({alt:50+nz(2)}));},
 "정지(현실·60샘플)":()=>{seed=2;return Array.from({length:60},()=>({alt:50+nz(6)}));},
 "정지(최악·1800)":()=>{seed=3;return Array.from({length:1800},()=>({alt:50+nz(6)}));},
 "언덕 60m 왕복":()=>{seed=4;const s=[];for(let i=0;i<=300;i++)s.push({alt:60*i/300+nz(2)});for(let i=0;i<=300;i++)s.push({alt:60-60*i/300+nz(2)});return s;},
 "오르내림 20m×3":()=>{seed=5;const s=[];for(let r=0;r<3;r++){for(let i=0;i<=100;i++)s.push({alt:20*i/100+nz(2)});for(let i=0;i<=100;i++)s.push({alt:20-20*i/100+nz(2)});}return s;},
 "짧은언덕 15m×4":()=>{seed=6;const s=[];for(let r=0;r<4;r++){for(let i=0;i<=20;i++)s.push({alt:15*i/20+nz(2)});for(let i=0;i<=20;i++)s.push({alt:15-15*i/20+nz(2)});}return s;},
};
const EXP={"평지 20분":0,"정지(현실·60샘플)":0,"정지(최악·1800)":0,"언덕 60m 왕복":60,"오르내림 20m×3":60,"짧은언덕 15m×4":60};
const C=[{alpha:0.2,rev:3},{alpha:0.15,rev:4},{alpha:0.12,rev:4},{alpha:0.1,rev:4}];
const names=Object.keys(S);
console.log("설정".padEnd(16)+names.map(n=>n.padStart(17)).join(""));
console.log("기대".padEnd(16)+names.map(n=>String(EXP[n]).padStart(17)).join(""));
console.log("-".repeat(16+17*names.length));
for(const c of C){
  const g=pv(c);
  console.log(`EMA ${c.alpha} rev${c.rev}`.padEnd(16)+names.map(n=>g(S[n]()).toFixed(0).padStart(17)).join(""));
}
