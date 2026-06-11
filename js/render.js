/* garakuta-gp render.js — 描画(カメラ・ミニマップ・バナー)とメインループ */
/* ---------- 描画 ---------- */
function drawMaruyama(c,m){
  const t=m.driver.torso,h=m.driver.head;
  c.save();c.translate(t.position.x,t.position.y);c.rotate(t.angle);
  c.fillStyle='#5a708c';c.fillRect(-5,-9.5,10,19);
  c.restore();
  c.save();c.translate(h.position.x,h.position.y);c.rotate(h.angle);
  c.fillStyle='#efe2cc';c.beginPath();c.arc(0,0,8.5,0,7);c.fill();
  c.fillStyle='#d8632a';c.beginPath();c.arc(0,-1.5,8.6,Math.PI,0);c.fill();
  c.fillStyle='#fff';c.fillRect(-6,-4.5,12,2);
  c.fillStyle='#2e2a24';
  c.fillRect(-3.5,1,1.8,1.8);c.fillRect(2,1,1.8,1.8);
  c.fillRect(-2,5,4,1.2);
  c.restore();
}
function drawMachineBody(c,m){
  const ch=m.chassis;
  for(const a of m.apps){
    c.save();c.translate(a.body.position.x,a.body.position.y);c.rotate(a.body.angle);
    c.fillStyle='#8a7a55';c.fillRect(-a.len/2,-4.5,a.len,9);
    c.strokeStyle='#2e2a24';c.lineWidth=2;c.strokeRect(-a.len/2,-4.5,a.len,9);
    c.restore();
  }
  c.save();
  c.beginPath();
  const vs=ch.vertices;
  c.moveTo(vs[0].x,vs[0].y);for(let i=1;i<vs.length;i++)c.lineTo(vs[i].x,vs[i].y);
  c.closePath();
  c.fillStyle='#c2401c';c.fill();
  c.strokeStyle='#2e2a24';c.lineWidth=2.5;c.stroke();
  c.save();c.clip();
  c.translate(ch.position.x,ch.position.y);c.rotate(ch.angle);
  c.fillStyle='rgba(190,186,175,.65)';c.fillRect(-60,-4,120,8);
  c.fillStyle='#efe6cf';c.beginPath();c.arc(0,0,11,0,7);c.fill();
  c.strokeStyle='#2e2a24';c.lineWidth=1.5;c.stroke();
  c.fillStyle='#2e2a24';c.font='bold 12px "Courier New"';c.textAlign='center';c.textBaseline='middle';
  c.fillText(String(run.round),0,1);
  c.restore();
  for(const w of m.wheels){
    const b=w.body;
    c.save();c.translate(b.position.x,b.position.y);c.rotate(b.angle);
    c.fillStyle='#33302a';c.beginPath();c.arc(0,0,w.rad,0,7);c.fill();
    c.fillStyle='#8a8378';c.beginPath();c.arc(0,0,w.rad*.5,0,7);c.fill();
    c.strokeStyle='#33302a';c.lineWidth=3;
    c.beginPath();c.moveTo(0,0);c.lineTo(w.rad*.85,0);c.stroke();
    c.restore();
  }
  drawMaruyama(c,m);
}
function drawGhostFrame(c,f){
  c.save();c.globalAlpha=.38;
  c.beginPath();
  c.moveTo(f.v[0],f.v[1]);
  for(let i=2;i<f.v.length;i+=2)c.lineTo(f.v[i],f.v[i+1]);
  c.closePath();
  c.fillStyle='#6b6b66';c.fill();
  c.strokeStyle='#44423c';c.lineWidth=2;c.stroke();
  for(const w of f.w){
    c.beginPath();c.arc(w[0],w[1],w[2],0,7);
    c.fillStyle='#55534d';c.fill();
    c.strokeStyle='#44423c';c.stroke();
  }
  c.save();c.translate(f.tx,f.ty);c.rotate(f.ta);
  c.fillStyle='#7d7d78';c.fillRect(-5,-9.5,10,19);c.restore();
  c.beginPath();c.arc(f.hx,f.hy,8.5,0,7);c.fillStyle='#8d8d88';c.fill();
  c.restore();
}
function plank(c,x,y,txt,bg,fg){
  c.save();c.translate(x,y);
  c.font='bold 13px "Hiragino Kaku Gothic ProN",sans-serif';
  const w=c.measureText(txt).width+18;
  c.fillStyle=bg;c.fillRect(-w/2,-12,w,24);
  c.strokeStyle='#2e2a24';c.lineWidth=2;c.strokeRect(-w/2,-12,w,24);
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,0,1);
  c.restore();
}
function render(){
  const c=ctx,Wp=canvas.width,Hp=canvas.height;
  c.setTransform(1,0,0,1,0,0);
  const sky=c.createLinearGradient(0,0,0,Hp);
  sky.addColorStop(0,'#9fbcb8');sky.addColorStop(.65,'#cfcab2');sky.addColorStop(1,'#c2b394');
  c.fillStyle=sky;c.fillRect(0,0,Wp,Hp);
  if(!race.m)return;
  const m=race.m;
  const scale=(Hp/760)*0.98;
  // カメラ:自機をなめらか追従(急変させない)
  const tgtX=Math.max(-80,m.chassis.position.x-Wp/scale*0.38);
  const tgtY=m.chassis.position.y-Hp/scale*0.52;
  if(!race.cam.init){race.cam.x=tgtX;race.cam.y=tgtY;race.cam.init=true}
  race.cam.x=lerp(race.cam.x,tgtX,.09);
  race.cam.y=lerp(race.cam.y,tgtY,.07);
  if(race.shake>0)race.shake*=0.88;
  const shX=(rng()-.5)*race.shake, shY=(rng()-.5)*race.shake;
  const camX=race.cam.x+shX, camY=race.cam.y+shY;
  // 遠景
  c.save();c.scale(scale,scale);
  for(const [p,col,amp,base] of [[.25,'#a8b49a',60,430],[.45,'#8e9c82',90,500]]){
    c.fillStyle=col;c.beginPath();
    const ox=camX*p;
    c.moveTo(-50,2000);
    for(let x=-50;x<Wp/scale+100;x+=40){
      c.lineTo(x,base-camY*.3+Math.sin((x+ox)*.006)*amp+Math.sin((x+ox)*.0021)*amp*.6);
    }
    c.lineTo(Wp/scale+100,2000);c.closePath();c.fill();
  }
  c.restore();
  c.save();c.scale(scale,scale);c.translate(-camX,-camY);
  // 地面
  const pts=race.T.pts;
  c.fillStyle='#a98a5d';
  let i=0;
  while(i<pts.length-1){
    if(pts[i+1]&&pts[i+1].gap){i++;continue;}
    let j=i;c.beginPath();c.moveTo(pts[i].x,pts[i].y);
    while(j+1<pts.length&&!pts[j+1].gap){j++;c.lineTo(pts[j].x,pts[j].y);}
    c.lineTo(pts[j].x,pts[j].y+900);c.lineTo(pts[i].x,pts[i].y+900);c.closePath();c.fill();
    c.strokeStyle='#6e5638';c.lineWidth=5;
    c.beginPath();c.moveTo(pts[i].x,pts[i].y);
    for(let k=i+1;k<=j;k++)c.lineTo(pts[k].x,pts[k].y);
    c.stroke();
    i=j+1;
  }
  // 距離標識
  c.font='bold 15px "Courier New"';c.textAlign='center';
  for(let d=500;d<COURSE_LEN;d+=500){
    const gy=groundYAt(race.T,d);
    c.fillStyle='#6e5638';c.fillRect(d-2,gy-46,4,46);
    c.fillStyle='#efe6cf';c.fillRect(d-26,gy-66,52,24);
    c.fillStyle='#2e2a24';c.fillText((d/10)+'m',d,gy-49);
  }
  // セットピースの立て看板
  for(const sgn of (race.T.signs||[])){
    if(sgn.x>camX+Wp/scale+200||sgn.x<camX-200)continue;
    const sy2=groundYAt(race.T,sgn.x);
    c.fillStyle='#6e5638';c.fillRect(sgn.x-2,sy2-56,4,56);
    plank(c,sgn.x,sy2-66,sgn.label,'#39483f','#f0e8d4');
  }
  // ゴール(でかく)
  const fx=race.T.finishX, fy=groundYAt(race.T,fx);
  c.fillStyle='rgba(46,42,36,.25)';
  for(let q=0;q<8;q++)for(let r=0;r<2;r++){
    if((q+r)%2)continue;
    c.fillRect(fx-64+q*16,fy-2+r*8,16,8);
  }
  c.fillStyle='#2e2a24';c.fillRect(fx-4,fy-230,8,230);
  for(let r=0;r<4;r++)for(let q=0;q<8;q++){
    c.fillStyle=(r+q)%2?'#2e2a24':'#efe6cf';
    c.fillRect(fx+4+q*14,fy-226+r*14,14,14);
  }
  plank(c,fx,fy-260,'ゴール','#39483f','#f0e8d4');
  // ゴースト(まえの自分)
  if(run.ghost&&run.ghost.rec.length){
    const gi=Math.min(race.step,run.ghost.rec.length-1);
    const f=run.ghost.rec[gi];
    drawGhostFrame(c,f);
    if(race.step<200){
      const gx=(f.v[0]+f.v[4])/2, gy2=Math.min(f.v[1],f.v[5]);
      c.globalAlpha=.8;plank(c,gx,gy2-66,'まえの自分','#8d8d88','#2e2a24');c.globalAlpha=1;
    }
  }
  // 自機
  if(!m.stats.dead||race.t<race.endAt)drawMachineBody(c,m);
  // 飛んだ人形マーカー(数秒間追従)
  if(m.driver.ejected&&m.ejectT!==undefined&&race.t-m.ejectT<4){
    const h=m.driver.head.position;
    c.strokeStyle='#c2401c';c.setLineDash([6,5]);c.lineWidth=2.5;
    c.beginPath();c.arc(h.x,h.y,20,0,7);c.stroke();c.setLineDash([]);
    plank(c,h.x,h.y-40,'人形','#c2401c','#f0e8d4');
  }
  // 「キミの」マーカー
  if(!m.stats.dead){
    const px=m.chassis.position.x, py=m.chassis.position.y;
    const bob=Math.sin(race.step*.15)*4;
    c.fillStyle='#c2401c';
    c.beginPath();c.moveTo(px,py-58+bob);c.lineTo(px-9,py-74+bob);c.lineTo(px+9,py-74+bob);c.closePath();c.fill();
    if(race.step<240)plank(c,px,py-94+bob,'キミの','#c2401c','#f0e8d4');
  }
  // 砂ぼこり・紙ふぶき
  race.dust=race.dust.filter(d=>d.t<1);
  for(const d of race.dust){d.t+=.03;d.x+=d.vx;d.y+=d.vy;d.vy+=.05;
    c.globalAlpha=(1-d.t)*.6;c.fillStyle=d.col||'rgba(170,150,115,.9)';
    c.beginPath();c.arc(d.x,d.y,d.r*(1+d.t),0,7);c.fill();}
  c.globalAlpha=1;
  // スクラップ表示
  c.textAlign='center';
  race.floaters=race.floaters.filter(f=>f.t<1.4);
  for(const f of race.floaters){f.t+=1/50;
    c.globalAlpha=Math.max(0,1.2-f.t);
    c.font='bold 15px "Hiragino Kaku Gothic ProN",sans-serif';
    c.fillStyle='#2e2a24';c.fillText(f.txt,f.x+1.5,f.y-f.t*34+1.5);
    c.fillStyle='#efe6cf';c.fillText(f.txt,f.x,f.y-f.t*34);}
  c.globalAlpha=1;
  c.restore();
  // 画面固定バナー(倍速・カメラの影響なし。2秒強しっかり読める)
  if(race.banners&&race.banners.length){
    race.banners=race.banners.filter(b=>b.t<2.3);
    c.save();c.textAlign='center';
    let by=Hp*0.24;
    for(const b of race.banners){
      b.t+=1/60;
      const fade=b.t<1.8?1:Math.max(0,(2.3-b.t)/0.5);
      const pop=1+Math.max(0,.25-b.t)*1.6;
      let fs=(b.small?22:30)*DPR;
      c.font='900 '+fs+'px "Hiragino Kaku Gothic ProN",sans-serif';
      const tw=c.measureText(b.txt).width, maxW=Wp*0.92;
      if(tw>maxW){fs=Math.max(13*DPR,fs*maxW/tw);
        c.font='900 '+fs+'px "Hiragino Kaku Gothic ProN",sans-serif';}
      c.globalAlpha=fade;
      c.save();c.translate(Wp/2,by);c.scale(pop,pop);c.rotate(-.04);
      c.lineWidth=7*DPR;c.strokeStyle='#f0e8d4';c.strokeText(b.txt,0,0);
      c.fillStyle='#c2401c';c.fillText(b.txt,0,0);
      c.restore();
      by+=fs*1.45;
    }
    c.globalAlpha=1;c.restore();
  }
  document.getElementById('leadDist').textContent=Math.max(0,Math.round(m.stats.maxX/10));
  renderMinimap();
}
function renderMinimap(){
  const c=mmCtx,W=mmCanvas.width,H=mmCanvas.height;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
  if(!race.T)return;
  const x0=-300, x1=COURSE_LEN+250;
  const yTop=race.T.minY, yBot=race.T.maxY;
  const mx=x=> (x-x0)/(x1-x0)*(W-10)+5;
  const my=y=> ((y-yTop)/(Math.max(1,yBot-yTop)))*(H*0.55)+H*0.22;
  // 起伏プロファイル
  c.strokeStyle='#6e5638';c.lineWidth=2*DPR;c.beginPath();
  const pts=race.T.pts;
  c.moveTo(mx(pts[0].x),my(pts[0].y));
  for(let i=1;i<pts.length;i++){
    if(pts[i].gap){c.moveTo(mx(pts[i].x),my(pts[i].y));continue}
    c.lineTo(mx(pts[i].x),my(pts[i].y));
  }
  c.stroke();
  // ゴール旗
  const gx=mx(COURSE_LEN);
  c.fillStyle='#2e2a24';c.fillRect(gx,2*DPR,1.6*DPR,H-6*DPR);
  c.fillStyle='#c2401c';
  c.beginPath();c.moveTo(gx,2*DPR);c.lineTo(gx+8*DPR,5.5*DPR);c.lineTo(gx,9*DPR);c.closePath();c.fill();
  // ゴースト位置
  if(run.ghost&&run.ghost.rec.length){
    const gi=Math.min(race.step,run.ghost.rec.length-1);
    const f=run.ghost.rec[gi];
    c.fillStyle='#7d7d78';
    c.beginPath();c.arc(mx(f.v[0]),my(f.v[1]),3*DPR,0,7);c.fill();
  }
  // 自機位置
  if(race.m){
    const p=race.m.chassis.position;
    c.fillStyle='#c2401c';
    c.beginPath();c.arc(mx(p.x),my(p.y),3.6*DPR,0,7);c.fill();
    c.strokeStyle='#f0e8d4';c.lineWidth=1.2*DPR;c.stroke();
  }
}
function updHud(){document.getElementById('scrapV').textContent=scrapRun}

/* ---------- メインループ ---------- */
function loop(){
  if(race.on&&!race.ended){
    if(race.hitstop>0)race.hitstop--;
    else for(let s=0;s<race.speed&&!race.ended;s++)stepSim();
  }
  render();
  requestAnimationFrame(loop);
}
