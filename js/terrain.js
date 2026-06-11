/* garakuta-gp terrain.js — コース生成(セットピース合成・難度帯域) */
/* ---------- コース生成 ---------- */
const COURSE_LEN=4300, SEG=58;
/* 難所はあるが詰みなし:指標が帯域に入るまで作り直す */
function buildTerrain(seed){
  let T=null;
  for(let k=0;k<28;k++){
    T=genTerrain((seed+k*0x9E3779B9)>>>0);
    if(T.gapN>=3&&T.gapN<=7&&T.maxGap<=140&&T.climb>=500&&T.climb<=900&&T.signs.length>=7)return T;
  }
  return T;
}
function genTerrain(seed){
  const r=mulberry32(seed);
  const pts=[],signs=[];let x=-300,y=520;
  const push=gap=>pts.push({x,y,gap:!!gap});
  push();
  while(x<350){x+=SEG;push()}
  while(x<COURSE_LEN-380){
    const d=Math.max(0,Math.min(1,x/COURSE_LEN));
    const t=r();
    if(t<.13){ for(let i=0;i<3;i++){x+=SEG;push()} }                       // 平地
    else if(t<.29){ const n=2+(r()*3|0); for(let i=0;i<n;i++){x+=SEG;y-=lerp(8,22,d);push()} }   // のぼり
    else if(t<.45){ const n=2+(r()*3|0); for(let i=0;i<n;i++){x+=SEG;y+=lerp(10,26,d);push()} }  // くだり
    else if(t<.59){ // ガタガタ
      signs.push({x:x+SEG,label:'ガタガタ'});
      const n=4+(r()*3|0);
      for(let i=0;i<n;i++){x+=SEG*.8;y+=(i%2?1:-1)*lerp(16,30,d);push()}
    }
    else if(t<.72){ // ギャップ
      signs.push({x:x+SEG,label:'ギャップ'});
      x+=SEG;y-=lerp(6,18,d);push();
      const gw=Math.min(140,lerp(60,150,d)*(0.7+r()*.6));
      x+=gw;y+=lerp(10,46,d)*r();push(true);
    }
    else if(t<.82){ // ジャンプ台:駆け上がって飛ぶ
      signs.push({x:x+SEG,label:'ジャンプ台'});
      for(let i=0;i<3;i++){x+=SEG*.75;y-=30;push()}
      const gw=90+r()*48; x+=gw; y+=70+r()*55; push(true);
    }
    else if(t<.91){ // かいだん(くだり)
      signs.push({x:x+SEG,label:'かいだん'});
      const n=3+(r()*2|0);
      for(let i=0;i<n;i++){x+=30;push();x+=9;y+=34;push()}
    }
    else{ // がけ
      signs.push({x:x+SEG,label:'がけ'});
      x+=SEG;push(); x+=14; y+=120+r()*70; push();
      x+=SEG;push();
    }
    y=Math.max(210,Math.min(800,y));
  }
  while(x<COURSE_LEN+700){x+=SEG;push()}
  let maxY=0,minY=1e9; pts.forEach(p=>{maxY=Math.max(maxY,p.y);minY=Math.min(minY,p.y)});
  let gapN=0,maxGap=0,climb=0;
  for(let i=1;i<pts.length;i++){
    if(pts[i].gap){gapN++;maxGap=Math.max(maxGap,pts[i].x-pts[i-1].x)}
    else if(pts[i].x<=COURSE_LEN&&pts[i].y<pts[i-1].y)climb+=pts[i-1].y-pts[i].y;
  }
  return {pts, signs, killY:maxY+420, finishX:COURSE_LEN, minY, maxY, gapN, maxGap, climb};
}
function terrainBodies(world,T,fric){
  for(let i=0;i<T.pts.length-1;i++){
    const a=T.pts[i], b=T.pts[i+1];
    if(b.gap) continue;
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    const len=Math.hypot(b.x-a.x,b.y-a.y), ang=Math.atan2(b.y-a.y,b.x-a.x);
    Composite.add(world,Bodies.rectangle(mx,my+13,len+6,26,{isStatic:true,angle:ang,friction:fric,restitution:0,
      label:'terrain',collisionFilter:{category:1,mask:0xFFFF}}));
  }
}
function groundYAt(T,x){
  const pts=T.pts;
  for(let k=0;k<pts.length-1;k++)if(pts[k].x<=x&&pts[k+1].x>x)return pts[k].y;
  return 520;
}
