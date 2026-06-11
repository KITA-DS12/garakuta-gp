/* garakuta-gp ui.js — ラウンド終了・カードUI・呪い開封・URL・日替わり・リザルト・起動 */
/* ---------- ラウンド終了 → 指示票 ---------- */
function endRound(stalled){
  race.ended=true;race.on=false;engineUpdate(0,false);
  const m=race.m, st=m.stats;
  st.dist=Math.max(0,st.maxX)/10;
  if(st.maruSolo)run.maruSoloAny=true;
  const name=nameMachine(st,m.genome,run.round);
  const fate=st.finished?'完走':(st.dead?'殉職':'力尽きる');
  run.lineage.push({gen:run.round,name,dist:Math.round(st.dist),fate});
  const prevBest=run.bestDist;
  if(st.dist>run.bestDist){run.bestDist=st.dist;run.bestGenome=m.genome.slice()}
  if(!st.finished&&st.dist<=prevBest+8)run.stagnant=(run.stagnant||0)+1;else run.stagnant=0;
  const prevGhost=run.ghost;
  const newGhost={rec:race.rec,dist:st.dist,finished:st.finished,finishT:st.finishT};
  let ghostNote='';
  if(prevGhost){
    if(st.finished&&prevGhost.finished){
      const dt=prevGhost.finishT-st.finishT;
      ghostNote=dt>0.3?'まえの自分より '+dt.toFixed(1)+'秒 はやい'
        :dt<-0.3?'まえの自分より '+(-dt).toFixed(1)+'秒 おそい':'まえの自分と ほぼ同タイム';
    }else{
      ghostNote=st.dist>prevGhost.dist+1?'まえの自分を '+Math.round(st.dist-prevGhost.dist)+'m 追い抜いた'
        :st.dist<prevGhost.dist-1?'まえの自分まで あと'+Math.round(prevGhost.dist-st.dist)+'m':'まえの自分と ほぼ同じ';
    }
  }
  if(run.round===10){
    run.lostToGhost=!!(prevGhost&&st.dist<prevGhost.dist-1);
    run.champStats={finished:st.finished,flips:st.flips,dist:st.dist,name,genome:m.genome.slice(),finishT:st.finishT};
    showInterstamp(st.finished?'完走':'検査終了','',()=>showResult());
    return;
  }
  run.ghost=newGhost;
  const word=st.finished?'完走!':(st.dead?'殉職':(stalled?'ストップ':'タイムアップ'));
  const note=run.round===1?'だいじょうぶ、次はもう少しマシにできる':ghostNote;
  showInterstamp(word,note,()=>showCards(st,name,ghostNote));
}
function showInterstamp(word,note,after){
  const el=document.getElementById('interstamp');
  document.getElementById('stampWord').textContent=word;
  const n=document.getElementById('stampNote');
  n.textContent=note;n.style.display=note?'block':'none';
  el.classList.add('show');
  SFX.stamp();
  setTimeout(()=>{el.classList.remove('show');after()},note?2100:1300);
}

/* ---------- 指示票UI(プレビュー付き) ---------- */
function newCfg(){return {noise:1,locks:new Set(),post:[],mod:defaultMod(),useBest:null,equip:null}}
function computeAfter(cfg){
  let g;
  if(cfg.useBest==='full'&&run.bestGenome)g=run.bestGenome.slice();
  else if(cfg.useBest==='half'&&run.bestGenome){g=run.genome.slice();
    for(let i=0;i<GSIZE;i++)g[i]=(g[i]+run.bestGenome[i])/2;}
  else g=run.genome.slice();
  for(const post of cfg.post)post(g);
  for(const gg of [g]){let any=false;for(let w=0;w<4;w++)if(gg[W0+w*WS+3]>0.45)any=true;if(!any)gg[W0+3]=0.9;}
  return g;
}
function genomeDiff(a,b){let d=0;for(let i=0;i<GSIZE;i++)d+=Math.abs(a[i]-b[i]);return d}
function sketchExtent(sp){
  let ex=55*sp.sx*1.35, ey=26*sp.sy*1.35;
  for(const w of sp.wheels){if(!w.en)continue;
    ex=Math.max(ex,Math.abs(Math.cos(w.ang))*55*sp.sx*1.05+w.rad);
    ey=Math.max(ey,Math.abs(Math.sin(w.ang))*26*sp.sy*1.05+w.rad);}
  for(const a of sp.apps){if(!a.en)continue;
    ex=Math.max(ex,55*sp.sx+a.len*.75);ey=Math.max(ey,26*sp.sy+a.len*.75);}
  ey+=24;
  return {ex,ey};
}
function drawSketch(cv,genome,pxW,pxH,opts){
  opts=opts||{};
  const sp=decode(genome),c=cv.getContext('2d');
  cv.width=pxW;cv.height=pxH;
  c.fillStyle='#cfe0da';c.fillRect(0,0,pxW,pxH);
  const gh=pxH*0.87;
  c.fillStyle='#a98a5d';c.fillRect(0,gh,pxW,pxH-gh);
  c.strokeStyle='#6e5638';c.lineWidth=2;c.beginPath();c.moveTo(0,gh);c.lineTo(pxW,gh);c.stroke();
  // 比較対象すべてが収まる共有スケール(大きさの変化がそのまま見える)
  let ex=1,ey=1;
  for(const g of (opts.scaleRef||[genome])){const e=sketchExtent(decode(g));ex=Math.max(ex,e.ex);ey=Math.max(ey,e.ey)}
  const sc=Math.min((pxW*0.47)/ex,(pxH*0.42)/ey);
  const cx=pxW/2, cy=pxH*0.5;
  function silhouette(spX,old){
    c.save();c.translate(cx,cy);c.scale(sc,sc);
    const W=55*spX.sx,H=26*spX.sy,lw=v=>v/sc;
    if(old){c.setLineDash([lw(5),lw(4)]);c.strokeStyle='#7b7972';c.fillStyle='rgba(0,0,0,0)'}
    for(const a of spX.apps){if(!a.en)continue;
      c.save();c.rotate(a.ang);
      if(old){c.lineWidth=lw(2);c.strokeRect(W*.9,-4.5,a.len*.75,9)}
      else{c.fillStyle='#8a7a55';c.fillRect(W*.9,-4.5,a.len*.75,9);
        c.strokeStyle='#2e2a24';c.lineWidth=lw(1.6);c.strokeRect(W*.9,-4.5,a.len*.75,9)}
      c.restore();}
    c.beginPath();
    for(let i=0;i<8;i++){const th=i/8*Math.PI*2,r=spX.verts[i];
      const px=Math.cos(th)*W*r,py=Math.sin(th)*H*r;
      i?c.lineTo(px,py):c.moveTo(px,py);}
    c.closePath();
    if(old){c.lineWidth=lw(2.4);c.stroke()}
    else{c.fillStyle='#c2401c';c.fill();c.strokeStyle='#2e2a24';c.lineWidth=lw(2);c.stroke()}
    for(const w of spX.wheels){if(!w.en)continue;
      const wx=Math.cos(w.ang)*W*1.05,wy=Math.sin(w.ang)*H*1.05;
      if(old){c.lineWidth=lw(2.2);c.beginPath();c.arc(wx,wy,w.rad,0,7);c.stroke()}
      else{c.fillStyle='#33302a';c.beginPath();c.arc(wx,wy,w.rad,0,7);c.fill();
        c.fillStyle='#8a8378';c.beginPath();c.arc(wx,wy,w.rad*.5,0,7);c.fill()}}
    if(!old){
      c.fillStyle='#efe2cc';c.beginPath();c.arc(0,-H-12,6,0,7);c.fill();
      c.fillStyle='#d8632a';c.beginPath();c.arc(0,-13-H,6.2,Math.PI,0);c.fill();
    }
    c.setLineDash([]);c.restore();
  }
  const baseSp=opts.base?decode(opts.base):null;
  if(baseSp)silhouette(baseSp,true);
  silhouette(sp,false);
  // 変わったタイヤを赤丸で囲む(径の変化・新規・没収)
  if(baseSp){
    c.save();c.translate(cx,cy);c.scale(sc,sc);
    c.strokeStyle='#c2401c';c.setLineDash([5/sc,4/sc]);c.lineWidth=2.4/sc;
    const W=55*sp.sx,H=26*sp.sy,Wb=55*baseSp.sx,Hb=26*baseSp.sy;
    for(let i=0;i<4;i++){
      const a=sp.wheels[i],b=baseSp.wheels[i];
      if(a.en&&(!b.en||Math.abs(a.rad-b.rad)>6)){
        const wx=Math.cos(a.ang)*W*1.05,wy=Math.sin(a.ang)*H*1.05;
        c.beginPath();c.arc(wx,wy,a.rad+7/sc,0,7);c.stroke();
      }else if(!a.en&&b.en){
        const wx=Math.cos(b.ang)*Wb*1.05,wy=Math.sin(b.ang)*Hb*1.05;
        c.beginPath();c.moveTo(wx-b.rad,wy-b.rad);c.lineTo(wx+b.rad,wy+b.rad);
        c.moveTo(wx+b.rad,wy-b.rad);c.lineTo(wx-b.rad,wy+b.rad);c.stroke();
      }
    }
    c.setLineDash([]);c.restore();
  }
  // 見えない変化は赤ペンで書き込む
  if(opts.note){
    c.save();c.translate(pxW-7,17);c.rotate(-.07);
    c.font='900 14px "Hiragino Kaku Gothic ProN",sans-serif';
    c.fillStyle='#c2401c';c.textAlign='right';c.textBaseline='top';
    c.fillText(opts.note,0,0);c.restore();
  }
}
function meterCell(label,v){
  const sym=v==='?'?'?':(v>=2?'▲▲':v===1?'▲':v===0?'─':v===-1?'▼':'▼▼');
  const cls=v==='?'?'q':(v>0?'up':v<0?'dn':'fl');
  return '<div class="meter"><div class="ml">'+label+'</div><div class="mv '+cls+'">'+sym+'</div></div>';
}
function metersHtml(m){return '<div class="meters">'+meterCell('はやさ',m.sp)+meterCell('あんてい',m.st)+meterCell('スクラップ',m.fun)+'</div>'}
function weightedPick3(){
  const pool=[...CARDS],out=[];
  for(let k=0;k<3;k++){
    let total=pool.reduce((s,c)=>s+c.w,0),r=rng()*total,pick=pool[0],pi=0;
    for(let i=0;i<pool.length;i++){r-=pool[i].w;if(r<=0){pick=pool[i];pi=i;break}}
    out.push(pick);pool.splice(pi,1);
  }
  return out;
}
function spendScrap(n){
  if(scrapRun<n)return false;
  scrapRun-=n;updHud();return true;
}
let lastDeal=null;
function starBar(v){
  const n=Math.max(1,Math.min(5,Math.round(v*4+1)));
  return '<span class="st">'+'★'.repeat(n)+'</span>'+'☆'.repeat(5-n);
}
function renderNowBox(){
  drawSketch(document.getElementById('nowSketch'),run.genome,240,144,{});
  const sp=decode(run.genome);
  const on=sp.wheels.filter(w=>w.en);
  const pw=on.length?on.reduce((a,w)=>a+(w.spd-.16)/(.8-.16),0)/on.length:0;
  const gr=on.length?on.reduce((a,w)=>a+(w.grip-.2)/(1.6-.2),0)/on.length:0;
  const wt=(sp.density-.0015)/(.006-.0015);
  const bn=1-(sp.sus-.13)/(.9-.13);
  document.getElementById('nowStats').innerHTML=
    'タイヤ'+on.length+'本'+(sp.apps.filter(a=>a.en).length?'・ツノあり':'')+'<br>'
    +'パワー '+starBar(pw)+'<br>グリップ '+starBar(gr)+'<br>'
    +'おもさ '+starBar(wt)+'・バネ '+starBar(bn);
}
function showCards(st,name,ghostNote){
  lastDeal={st,name,ghostNote};
  renderNowBox();
  const ov=document.getElementById('cardOverlay');
  document.getElementById('cardHead').textContent='どれか1枚えらべ('+run.round+'/10)';
  document.getElementById('roundSummary').innerHTML=
    '第'+run.round+'走「<b>'+name+'</b>」 '+Math.round(st.dist)+'m'+(st.finished?' ◎完走':'')
    +(ghostNote?'<br>'+ghostNote:'');
  const box=document.getElementById('slipBox');box.innerHTML='';
  let three=weightedPick3();
  if(rng()<.05){
    const cs=CARDS.filter(c=>c.cat==='chaos');three=[];
    const pool=[...cs];for(let k=0;k<3;k++){const i=(rng()*pool.length)|0;three.push(pool[i]);pool.splice(i,1)}
    document.getElementById('cardHead').textContent='今日はカオスしか入荷してない('+run.round+'/10)';
  }
  // 救済:記録が伸びていない/動けないなら荒療治カードを強制混入
  let rescued=false;
  if(st.dist<30||run.stagnant>=2){
    const ids=['reroll','monster','yakekuso'];
    if(run.bestGenome&&run.bestDist>st.dist+40)ids.push('ancestor');
    if(!three.some(c=>ids.includes(c.id))){
      const pick=ids[(rng()*ids.length)|0];
      three[0]=CARDS.find(c=>c.id===pick);
    }
    rescued=true;
  }
  if(rescued)document.getElementById('roundSummary').innerHTML+='<br>記録が止まりぎみ。<b>荒療治</b>を1枚混ぜておいた';
  // ボロボロ(部品2個以上ロス or 人形射出)なら整備カードを保証
  if((st.lost>=2||st.ejected)&&!three.some(c=>c.cat==='fix')){
    const fixes=CARDS.filter(c=>c.cat==='fix');
    three[three.length-1]=fixes[(rng()*fixes.length)|0];
    document.getElementById('roundSummary').innerHTML+='<br>整備班「そろそろ直しませんか」';
  }
  let picked=false;
  three.forEach(card=>{
    const cfg=newCfg();card.fn(cfg);
    const after=computeAfter(cfg);
    const changed=genomeDiff(after,run.genome)>0.02;
    const el=document.createElement('div');el.className='slip';
    let pv;
    if(changed){
      pv='<div class="pv"><canvas class="pvA"></canvas><div class="arr">→</div><canvas class="pvB"></canvas></div>';
    }else if(cfg.equip){
      pv='<div class="pv"><div class="modicon"><canvas class="mic"></canvas></div><div class="modtxt">ずっと装備される</div></div>';
    }else{
      pv='<div class="pv"><div class="modicon"><canvas class="mic"></canvas></div><div class="modtxt">つぎからの改造の<br>かかり方が変わる</div></div>';
    }
    el.innerHTML='<canvas class="ic"></canvas>'
      +'<div class="cat">'+CATNAME[card.cat]+'</div>'
      +'<h3>'+card.name+(card.rare?'<span class="rare">レア</span>':'')+'</h3>'
      +'<div class="desc">'+card.desc+'</div>'
      +pv+metersHtml(card.m)
      +'<div class="stamp">受領</div>';
    doodle(el.querySelector('.ic'),card.ic,56);
    if(changed){
      const refs=[run.genome,after];
      drawSketch(el.querySelector('.pvA'),run.genome,160,96,{scaleRef:refs});
      drawSketch(el.querySelector('.pvB'),after,160,96,{scaleRef:refs,base:run.genome,note:card.note||''});
    }else{
      doodle(el.querySelector('.mic'),card.ic,88);
    }
    el.onclick=()=>{
      if(picked)return;picked=true;el.classList.add('stamped');SFX.stamp();
      setTimeout(()=>{ov.classList.remove('show');applyCard(card,cfg,after)},420);
    };
    box.appendChild(el);
  });
  // 拒否票
  const rf=document.createElement('div');rf.className='slip refuse';
  rf.innerHTML='<canvas class="ic"></canvas><div class="cat">のろい</div>'
    +'<h3>全部いやだ</h3><div class="desc">3枚とも破り捨てる。<br>かわりに<b>呪い</b>を受ける。<br>何が起きるかは知らない。</div>'
    +'<div class="pv"><div class="modicon"><canvas class="mic"></canvas></div><div class="modtxt">お楽しみ</div></div>'
    +metersHtml({sp:'?',st:'?',fun:'?'})
    +'<div class="stamp">却下</div>';
  doodle(rf.querySelector('.ic'),'skull',56);
  doodle(rf.querySelector('.mic'),'question',88);
  rf.onclick=()=>{
    if(picked)return;picked=true;rf.classList.add('stamped');SFX.stamp();
    setTimeout(()=>{ov.classList.remove('show');applyCurse()},420);
  };
  box.appendChild(rf);
  const rb=document.getElementById('redrawBtn');
  const have=scrapRun;
  rb.textContent='スクラップ50で ひきなおす(いま '+have+')';
  if(have<50)rb.setAttribute('disabled','');else rb.removeAttribute('disabled');
  rb.onclick=()=>{
    if(!spendScrap(50))return;
    SFX.click();
    showCards(lastDeal.st,lastDeal.name,lastDeal.ghostNote);
  };
  ov.classList.add('show');
}

/* ---------- 改造の適用 ---------- */
function mutate(g,cfg){
  const out=g.slice();
  const sigma=0.02*cfg.noise;
  for(let i=0;i<GSIZE;i++){
    if(cfg.locks.has(i))continue;
    out[i]=clamp01(out[i]+gauss()*sigma);
  }
  let any=false;for(let w=0;w<4;w++)if(out[W0+w*WS+3]>0.45)any=true;
  if(!any)out[W0+3]=0.9;
  return out;
}
function applyCard(card,cfg,after){
  run.picks.push(card.cat);if(card.cat==='chaos')run.chaosPicks++;
  run.genome=mutate(after,cfg);
  if(cfg.equip)Object.assign(run.equip,cfg.equip);
  race.mod=cfg.mod;
  run.lastCardName=card.name;
  nextRound();
}
function applyCurse(){
  run.picks.push('curse');run.curses++;
  const curse=CURSES[(rng()*CURSES.length)|0];
  const before=run.genome.slice();
  const g=run.genome.slice();curse.f(g);
  const after=mutate(g,newCfg());
  race.mod=defaultMod();
  SFX.curse();
  // 開封:何をされたか見せてから走る
  const ov=document.getElementById('curseOverlay');
  doodle(document.getElementById('curseSkull'),'skull',108);
  document.getElementById('curseText').textContent=curse.t;
  const refs=[before,after];
  drawSketch(document.getElementById('curseA'),before,220,132,{scaleRef:refs});
  drawSketch(document.getElementById('curseB'),after,220,132,{scaleRef:refs,base:before});
  ov.classList.add('show');
  const go=document.getElementById('curseGo');
  go.onclick=()=>{
    go.onclick=null;
    ov.classList.remove('show');
    run.genome=after;
    run.lastCardName='呪い';
    SFX.stamp();
    nextRound();
  };
}
function nextRound(){run.round++;startRound()}
function showCaption(t,ms){
  const el=document.getElementById('caption');el.textContent=t;el.classList.add('show');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),ms);
}

/* ---------- URL(設計図+リレー) ---------- */
/* ---------- 日替わり現場 ---------- */
function jstDate(offsetDays){
  const t=new Date(Date.now()+9*3600*1000+(offsetDays||0)*86400*1000);
  return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate()};
}
function dayKey(off){const j=jstDate(off);return j.y*10000+j.m*100+j.d}
function dayLabel(){const j=jstDate(0);return j.m+'/'+j.d}
function daySeed(){
  let h=dayKey(0);
  h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);
  return (h^(h>>>16))>>>0;
}
function calcScore(st,earned){
  const dist=Math.round(Math.max(0,st.dist));
  const finish=st.finished?100+Math.round(Math.max(0,25-st.finishT)*12):0;
  const flashy=Math.round((earned||0)*0.5);
  return {total:dist+finish+flashy, dist, finish, flashy};
}

const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function bytesToB64u(bytes){
  let s='';for(let i=0;i<bytes.length;i+=3){
    const a=bytes[i],b=bytes[i+1]||0,c=bytes[i+2]||0;
    s+=B64[a>>2]+B64[((a&3)<<4)|(b>>4)];
    if(i+1<bytes.length)s+=B64[((b&15)<<2)|(c>>6)];
    if(i+2<bytes.length)s+=B64[c&63];
  }return s;
}
function b64uToBytes(s){
  const idx=ch=>B64.indexOf(ch),out=[];
  for(let i=0;i<s.length;i+=4){
    const a=idx(s[i]),b=idx(s[i+1]),c=i+2<s.length?idx(s[i+2]):-1,d=i+3<s.length?idx(s[i+3]):-1;
    out.push((a<<2)|(b>>4));
    if(c>=0)out.push(((b&15)<<4)|(c>>2));
    if(d>=0)out.push(((c&3)<<6)|d);
  }return out;
}
function encodeShare(champGenome){
  const bytes=[1, run.relay&255, (run.relay>>8)&255,
    run.seed&255,(run.seed>>8)&255,(run.seed>>16)&255,(run.seed>>24)&255];
  champGenome.forEach(v=>bytes.push(Math.round(clamp01(v)*255)));
  (run.origin||champGenome).forEach(v=>bytes.push(Math.round(clamp01(v)*255)));
  return bytesToB64u(bytes);
}
function decodeShare(s){
  try{
    const b=b64uToBytes(s);
    if(b[0]!==1||b.length<7+GSIZE*2)return null;
    const relay=b[1]|(b[2]<<8);
    const seed=(b[3]|(b[4]<<8)|(b[5]<<16)|(b[6]<<24))>>>0;
    const g=[],o=[];
    for(let i=0;i<GSIZE;i++)g.push(b[7+i]/255);
    for(let i=0;i<GSIZE;i++)o.push(b[7+GSIZE+i]/255);
    return {relay,seed,genome:g,origin:o};
  }catch(e){return null}
}

/* ---------- 車両検査証(リザルト) ---------- */
let shareText='';
function showResult(){
  const ch=run.champStats;
  const r={maruSolo:run.maruSoloAny,r1FastDeath:run.r1FastDeath,lostToGhost:run.lostToGhost,
    curses:run.curses,totalAir:run.totalAir,totalFlips:run.totalFlips,totalEject:run.totalEject,
    totalLost:run.totalLost,chaosPicks:run.chaosPicks,bestDist:run.bestDist,course:run.course,
    champ:{finished:ch.finished,flips:ch.flips,dist:ch.dist}};
  const title=pickTitle(r);
  const sc=calcScore(ch,run.earned);
  const score=sc.total;
  // きょうのベスト
  const dk=String(dayKey(0));
  let dayBest=(localStorage.getItem('gp_day')===dk)?parseInt(localStorage.getItem('gp_dayBest')||'0',10):0;
  const newBest=score>dayBest;
  if(newBest){localStorage.setItem('gp_day',dk);localStorage.setItem('gp_dayBest',String(score));dayBest=score}
  // 連続日数
  const last=localStorage.getItem('gp_lastDay');
  if(last!==dk){
    const stk=(last===String(dayKey(-1)))?parseInt(localStorage.getItem('gp_streak')||'0',10)+1:1;
    localStorage.setItem('gp_streak',String(stk));
    localStorage.setItem('gp_lastDay',dk);
  }
  const streak=parseInt(localStorage.getItem('gp_streak')||'1',10);
  const code=encodeShare(ch.genome);
  const url=location.origin+location.pathname+'#r='+code;
  shareText='ガラクタGP '+dayLabel()+'\nスコア '+score+(ch.finished?'(完走 '+ch.finishT.toFixed(1)+'秒)':'('+Math.round(ch.dist)+'m)')
    +'\n「'+ch.name+'」/ 称号:'+title
    +'\nこのマシンは'+run.relay+'人目 → 引き継いで改造しろ\n'+url+'\n#ガラクタGP';
  const lineageHtml=run.lineage.slice(-4,-1).map(l=>
    '第'+l.gen+'走 <b>'+l.name+'</b> '+l.dist+'m・'+l.fate).join('<br>')||'(記録なし)';
  const box=document.getElementById('certBox');
  box.innerHTML='<div class="head"><span>車両検査証</span><span>'+dayLabel()+'の現場・第'+run.relay+'継承</span></div>'
    +'<div class="name">'+ch.name+'</div>'
    +'<div class="relay">このマシンは '+run.relay+'人目'+(run.relay>1?' — 初代の原型は、もうない':'')+'</div>'
    +'<div class="titlestamp">称号:'+title+'</div>'
    +'<table><tr><td>スコア</td><td><b>'+score+'</b>'+(newBest?' <b style="color:#c2401c">★ベスト更新</b>':'(きょうのベスト '+dayBest+')')+'</td></tr>'
    +'<tr><td>内訳</td><td>きょり'+sc.dist+' + 完走'+sc.finish+' + 派手さ'+sc.flashy+'</td></tr>'
    +'<tr><td>到達</td><td>'+Math.round(ch.dist)+' m'+(ch.finished?' ◎完走 '+ch.finishT.toFixed(1)+'秒':'')+'</td></tr>'
    +'<tr><td>れんぞく</td><td>'+streak+' 日目</td></tr>'
    +'<tr><td>ぐるんと回った</td><td>'+run.totalFlips+' 回</td></tr>'
    +'<tr><td>人形ふっとび</td><td>'+run.totalEject+' 回</td></tr>'
    +'<tr><td>部品もげた</td><td>'+run.totalLost+' 個</td></tr>'
    +'<tr><td>スクラップ稼ぎ</td><td>+'+(run.earned||0)+'</td></tr></table>'
    +'<div class="ba"><div class="pane"><span>'+(run.relay>1?'初代':'第1走')+'</span><canvas id="baA"></canvas></div>'
    +'<div class="arrow">→</div>'
    +'<div class="pane"><span>いま</span><canvas id="baB"></canvas></div></div>'
    +'<div class="lineage"><span class="lt">血統記録</span><br>'+lineageHtml
    +'<br>第10走 <b>'+ch.name+'</b> '+Math.round(ch.dist)+'m ← <b style="color:#c2401c">王者</b></div>'
    +'<div class="sharebox"><textarea readonly id="shareTa"></textarea></div>';
  document.getElementById('shareTa').value=shareText;
  const baRefs=[run.origin,ch.genome];
  drawSketch(document.getElementById('baA'),run.origin,360,160,{scaleRef:baRefs});
  drawSketch(document.getElementById('baB'),ch.genome,360,160,{scaleRef:baRefs,base:run.origin});
  document.getElementById('resultOverlay').classList.add('show');
  SFX.goal();
}

/* ---------- 起動・操作 ---------- */
document.querySelectorAll('.spd').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.spd').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');race.speed=parseInt(b.dataset.s,10);SFX.click();
});
document.getElementById('muteBtn').onclick=()=>{auInit();auSetMute(!AU.muted)};
document.getElementById('titleSound').onclick=()=>{auSetMute(!AU.muted)};
document.getElementById('howtoLink').onclick=()=>{document.getElementById('howtoModal').classList.add('show');SFX.click()};
document.getElementById('howtoBtn').onclick=()=>{document.getElementById('howtoModal').classList.add('show')};
document.getElementById('howtoClose').onclick=()=>{document.getElementById('howtoModal').classList.remove('show');SFX.click()};
document.getElementById('copyBtn').onclick=function(){
  const ta=document.getElementById('shareTa');ta.select();
  const done=()=>{this.textContent='コピーした(送りつけろ)';setTimeout(()=>this.textContent='挑戦状をコピー',2200)};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(shareText).then(done,done);
  else{try{document.execCommand('copy')}catch(e){}done();}
  SFX.click();
};
document.getElementById('tweetBtn').onclick=()=>{
  SFX.click();
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText),'_blank');
};
document.getElementById('againBtn').onclick=()=>{
  document.getElementById('resultOverlay').classList.remove('show');
  initRun(null);SFX.click();
};
document.getElementById('carryBtn').onclick=()=>{
  document.getElementById('resultOverlay').classList.remove('show');
  const carry={relay:run.relay-1,origin:run.origin,genome:run.champStats.genome,self:true};
  initRun(carry);SFX.click();
};
function initRun(relayData){
  run.round=1;run.totalFlips=0;run.totalAir=0;run.totalEject=0;run.totalLost=0;
  run.curses=0;run.chaosPicks=0;run.picks=[];run.lineage=[];
  run.r1FastDeath=false;run.maruSoloAny=false;run.lostToGhost=false;
  run.ghost=null;run.bestDist=0;run.bestGenome=null;run.champStats=null;run.equip={};run.stagnant=0;run.earned=0;
  scrapRun=0;race.mod=defaultMod();
  run.seed=daySeed();rng=mulberry32(run.seed); // 現場も初期マシンも配布も、きょうは全員共通
  if(relayData){
    run.relay=relayData.relay+1;
    run.origin=relayData.origin;
    run.genome=relayData.genome.slice();
    if(relayData.self){
      document.getElementById('subplate').textContent=dayLabel()+'の現場'+(run.relay>1?'・第'+run.relay+'継承':'');
      showCaption('さっきの王者を持ち込んだ。続きから改造だ',3000);
    }else{
      document.getElementById('subplate').textContent=dayLabel()+'の現場・第'+run.relay+'継承';
      showCaption('他人のマシンを引き継いだ。あなたは'+run.relay+'人目の整備士',3400);
    }
  }else{
    run.relay=1;run.origin=null;
    run.genome=starterGenome();
    document.getElementById('subplate').textContent=dayLabel()+'の現場';
  }
  if(!run.origin)run.origin=run.genome.slice();
  updHud();startRound();
}
const hashM=location.hash.match(/#r=([A-Za-z0-9\-_]+)/);
const relayData=hashM?decodeShare(hashM[1]):null;
if(relayData){
  const n=document.getElementById('relayNotice');
  n.style.display='block';
  n.innerHTML='だれかのマシンが届いている。<br>あなたは <b>'+(relayData.relay+1)+'人目</b> の整備士。引き継いで改造しろ。';
}
auSetMute(AU.muted);
(function(){
  const di=document.getElementById('dailyInfo');
  const dk=String(dayKey(0));
  const db=(localStorage.getItem('gp_day')===dk)?localStorage.getItem('gp_dayBest'):null;
  di.innerHTML='きょうの現場:<b>'+dayLabel()+'</b>'
    +(db?'<br>きょうのベスト:<b>'+db+'</b>':'<br>とおくへ。完走したら、はやく。');
})();
document.querySelectorAll('canvas.hd').forEach(cv=>doodle(cv,cv.dataset.d==='ghost'?'ghostd':cv.dataset.d,76));
document.getElementById('startBtn').onclick=()=>{
  auInit();
  if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();
  document.getElementById('titleOverlay').classList.add('hide');
  SFX.go();
  initRun(relayData);
};
loop();
