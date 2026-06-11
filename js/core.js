/* garakuta-gp core.js — 乱数・48パラメータ設計図のエンコード/デコード */
/* ============================================================
   ガラクタGP v2 — 自機1台+ゴースト/カード視覚化/効果音
   ============================================================ */
const {Engine,Bodies,Body,Composite,Constraint,Events,Vector} = Matter;

/* ---------- 乱数 ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rng = mulberry32((Math.random()*2**32)>>>0);
function gauss(){let u=0,v=0;while(u===0)u=rng();while(v===0)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
const clamp01=x=>Math.max(0,Math.min(1,x));
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- 設計図(48パラメータ) ----------
 0-7  : 車体の出っ張り(放射状8点)
 8,9  : 車体の横幅・縦幅
 10-12: 密度 / 摩擦 / 反発
 13,14: 重心オフセット x,y
 15,16: サスの硬さ / 減衰
 17   : 塗装色相(自機は固定色なので証明書用)
 18,19: 人形の体重 / シートベルト強度
 20-39: ホイール×4 [取付角, 半径, 出力, 有無, グリップ]
 40-45: ツノ×2 [角度, 長さ, 有無]
 46,47: 予備                                            */
const GSIZE=48, W0=20, WS=5;
function randomGenome(){
  const g=new Array(GSIZE); for(let i=0;i<GSIZE;i++)g[i]=rng();
  let any=false; for(let w=0;w<4;w++) if(g[W0+w*WS+3]>0.45) any=true;
  if(!any) g[W0+3]=0.9;
  return g;
}
/* ひどいのは歓迎、置物は退屈 — 最低限「転がりだす」初期車を作る */
function starterGenome(){
  const g=randomGenome();
  const on=[];for(let w=0;w<4;w++)if(g[W0+w*WS+3]>0.45)on.push(w);
  while(on.length<2){const w=(rng()*4)|0;if(!on.includes(w)){g[W0+w*WS+3]=0.9;on.push(w)}}
  // 下半分(接地側)にタイヤが1本もないなら、1本だけ下へ回す(性能は盛らない)
  const down=on.find(w=>Math.sin(g[W0+w*WS]*Math.PI*2)>0.25);
  if(down===undefined){
    const hero=on[(rng()*on.length)|0], b=W0+hero*WS;
    g[b]=0.15+rng()*0.2;
  }
  return g;
}
function decode(g){
  const verts=[]; for(let i=0;i<8;i++) verts.push(lerp(.55,1.35,g[i]));
  const wheels=[]; for(let w=0;w<4;w++){const b=W0+w*WS;
    wheels.push({ang:g[b]*Math.PI*2, rad:lerp(11,46,g[b+1]), spd:lerp(.16,.8,g[b+2]), en:g[b+3]>0.45, grip:lerp(.2,1.6,g[b+4])});
  }
  const apps=[]; for(let a=0;a<2;a++){const b=40+a*3;
    apps.push({ang:g[b]*Math.PI*2, len:lerp(18,85,g[b+1]), en:g[b+2]>0.62});
  }
  return {verts, sx:lerp(.8,2,g[8]), sy:lerp(.5,1.2,g[9]),
    density:lerp(.0015,.006,g[10]), friction:lerp(.05,1.2,g[11]), rest:lerp(0,.85,g[12]),
    cx:lerp(-.45,.45,g[13]), cy:lerp(-.3,.55,g[14]),
    sus:lerp(.13,.9,g[15]), dmp:lerp(.02,.18,g[16]),
    hue:g[17]*360, dms:lerp(.5,3,g[18]), belt:lerp(.045,.25,g[19]),
    wheels, apps};
}
const WHEEL_GENES=[],CHASSIS_GENES=[];
for(let w=0;w<4;w++)for(let k=0;k<WS;k++)WHEEL_GENES.push(W0+w*WS+k);
for(let i=0;i<10;i++)CHASSIS_GENES.push(i);
CHASSIS_GENES.push(13,14);
