/* garakuta-gp race.js — レース進行(1台+ゴースト録画・激突ダメージ) */
/* ============================================================
   レース進行(自機1台+前回ゴースト)
   ============================================================ */
const canvas=document.getElementById('race'), ctx=canvas.getContext('2d');
const mmCanvas=document.getElementById('minimap'), mmCtx=mmCanvas.getContext('2d');
let DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);
  canvas.width=innerWidth*DPR;canvas.height=innerHeight*DPR;
  mmCanvas.width=mmCanvas.clientWidth*DPR||560;mmCanvas.height=30*DPR;}
addEventListener('resize',resize);resize();

const run={ seed:0, round:0, totalFlips:0, totalAir:0, totalEject:0, totalLost:0,
  curses:0, chaosPicks:0, picks:[], lineage:[], r1FastDeath:false,
  relay:1, origin:null, course:COURSE_LEN/10, genome:null, ghost:null,
  bestDist:0, bestGenome:null };
let scrapRun=0;   // この10走で稼いだ残高(ランごとにリセット)
const race={engine:null,world:null,m:null,T:null,t:0,step:0,speed:1,on:false,
  mod:{},lastProg:0,floaters:[],dust:[],ended:false,rec:[],endAt:Infinity,
  cam:{x:0,y:0,init:false}};

function defaultMod(){return {gravity:1,wind:0,rocket:false,reverseChance:0,terrainFriction:.9,unbreakable:false}}

function startRound(){
  race.engine=Engine.create();
  race.world=race.engine.world;
  race.engine.gravity.y=race.mod.gravity;
  race.engine.enableSleeping=false;
  if(run.equip.rocket)race.mod.rocket=true;
  if(run.equip.weld)race.mod.unbreakable=true;
  race.T=buildTerrain(run.seed);
  terrainBodies(race.world,race.T,race.mod.terrainFriction);
  const sx=40, sy=race.T.pts[1].y-90;
  race.m=buildMachine(race.world,run.genome,sx,sy,race.mod);
  if(race.m.dir<0)showCaption('うしろ向きに載せられた',2200);
  race.t=0; race.step=0; race.lastProg=0; race.floaters=[]; race.dust=[];
  race.ended=false; race.rocketFired=false; race.endAt=Infinity;
  race.impactQ=[]; race.lastDmg=-1; race.shake=0; race.hitstop=0; race.banners=[];
  race.rec=[]; race.cam.init=false;
  race.on=true;
  Events.on(race.engine,'collisionStart',ev=>{
    for(const p of ev.pairs){
      const ta=p.bodyA.label==='terrain', tb=p.bodyB.label==='terrain';
      if(ta===tb)continue;
      const o=ta?p.bodyB:p.bodyA;
      race.m.contacts++;
      const v=o.speed||0;
      if(v>4.5)SFX.thud(v*.055);
      if(v>7.5)race.impactQ.push({v,x:o.position.x,y:o.position.y});
    }
  });
  Events.on(race.engine,'collisionEnd',ev=>{
    for(const p of ev.pairs){
      const ta=p.bodyA.label==='terrain', tb=p.bodyB.label==='terrain';
      if(ta===tb)continue;
      race.m.contacts=Math.max(0,race.m.contacts-1);
    }
  });
  document.getElementById('roundNo').textContent=run.round;
  showCaption(run.lastCardName?'第'+run.round+'走:「'+run.lastCardName+'」を取り付けた'
    :'第'+run.round+'走、いってらっしゃい',run.lastCardName?2200:1500);
  run.lastCardName=null;
  SFX.go(); engineStart();
}
function award(n,txt){
  scrapRun+=n; run.earned=(run.earned||0)+n; SFX.coin();
  const m=race.m;
  race.floaters.push({x:m.chassis.position.x,y:m.chassis.position.y-50,t:0,txt:(txt||'')+' +'+n});
  updHud();
}
function puff(x,y,n,col){for(let i=0;i<n;i++)race.dust.push({x,y,vx:(rng()-.5)*3,vy:-rng()*2.5,t:0,r:3+rng()*5,col})}
const anchorWorld=(b,l)=>Vector.add(b.position,Vector.rotate(l,b.angle));
function banner(txt,small){
  race.banners=race.banners||[];
  race.banners.push({txt,t:0,small:!!small});
  if(race.banners.length>3)race.banners.shift();
}

function recordFrame(){
  const m=race.m, ch=m.chassis;
  const vs=[]; for(const v of ch.vertices){vs.push(v.x,v.y)}
  const ws=m.wheels.filter(w=>!w.lost).map(w=>[w.body.position.x,w.body.position.y,w.rad,w.body.angle]);
  race.rec.push({v:vs,w:ws,
    tx:m.driver.torso.position.x,ty:m.driver.torso.position.y,ta:m.driver.torso.angle,
    hx:m.driver.head.position.x,hy:m.driver.head.position.y});
}

function stepSim(){
  const DT=1000/60, m=race.m, ch=m.chassis;
  race.t+=1/60; race.step++;
  // 激突ダメージ:勢いよく叩きつけられると壊れる(溶接中は無効)
  while(race.impactQ.length){
    const im=race.impactQ.shift();
    if(m.stats.dead||race.t<0.8)continue;
    if(race.t-race.lastDmg<0.7)continue;
    race.lastDmg=race.t;
    puff(im.x,im.y,7,'#d8632a');puff(im.x,im.y,5,'#efe6cf');
    if(race.mod.unbreakable){SFX.thud(.5);continue}
    const armor=run.equip&&run.equip.armor?2.5:0;
    if(im.v>13+armor&&!m.driver.ejected){
      m.driver.cons.forEach(c=>Composite.remove(race.world,c));
      m.driver.ejected=true;m.stats.ejected=true;run.totalEject++;
      m.ejectT=race.t;
      award(20,'激突で人形発射');SFX.crash();SFX.eject();
      race.hitstop=12;race.shake=16;
      banner('人形ふっとんだ!');
    }else if(im.v>10.5+armor){
      const parts=m.wheels.filter(w=>!w.lost);
      const horns=m.apps.filter(a=>!a.lost);
      if(parts.length>1&&(horns.length===0||rng()<.7)){
        const w=parts[(rng()*parts.length)|0];
        Composite.remove(race.world,w.cons);w.lost=true;
        m.stats.lost++;run.totalLost++;award(12,'激突でもげた');SFX.crash();
        race.hitstop=8;race.shake=11;
        banner('クラッシュ! タイヤふっとび');
      }else if(horns.length){
        const a=horns[(rng()*horns.length)|0];
        a.cons.forEach(c=>Composite.remove(race.world,c));a.lost=true;
        m.stats.lost++;run.totalLost++;award(12,'激突でもげた');SFX.crash();
        race.hitstop=8;race.shake=11;
        banner('クラッシュ! ツノふっとび');
      }else SFX.crash();
    }else{race.shake=Math.max(race.shake,5)}
  }
  if(race.mod.rocket&&!race.rocketFired&&race.t>=3&&!m.stats.dead&&!m.stats.finished){
    race.rocketFired=true;
    Body.setVelocity(ch,{x:ch.velocity.x+13*m.dir,y:ch.velocity.y-9});
    puff(ch.position.x,ch.position.y,10); noiseBurst(.5,1400,.5); tone(120,.6,'sawtooth',.4,60);
    showCaption('点火',900);
  }
  if(!m.stats.dead){
    const _v=ch.velocity,_s=Math.hypot(_v.x,_v.y);
    if(_s>55)Body.setVelocity(ch,{x:_v.x*55/_s,y:_v.y*55/_s});
    {const tv=m.driver.torso.velocity,ts=Math.hypot(tv.x,tv.y);
      if(ts>70)Body.setVelocity(m.driver.torso,{x:tv.x*70/ts,y:tv.y*70/ts});}
    if(race.mod.wind)Body.applyForce(ch,ch.position,{x:race.mod.wind*ch.mass*0.0006,y:0});
    // 高速ふらつき:スピードの出しすぎは身を滅ぼす
    const spd=Math.abs(ch.velocity.x);
    if(spd>9&&m.contacts>0)Body.setAngularVelocity(ch,ch.angularVelocity+(rng()-.5)*0.022*(spd-9));
    if(!m.stats.finished)for(const w of m.wheels){
      if(w.lost)continue;
      const tgt=w.spd*0.55*m.dir;
      Body.setAngularVelocity(w.body,lerp(w.body.angularVelocity,tgt,.15));
    }
    // 回転カウント
    let da=ch.angle-m.lastAngle;
    while(da>Math.PI)da-=2*Math.PI; while(da<-Math.PI)da+=2*Math.PI;
    m.rotAcc+=da; m.lastAngle=ch.angle;
    if(Math.abs(m.rotAcc)>Math.PI*2){
      m.rotAcc-=Math.sign(m.rotAcc)*Math.PI*2;
      m.stats.flips++; run.totalFlips++;
      award(10,'一回転'); puff(ch.position.x,ch.position.y,5); SFX.flip();
    }
    // 滞空
    if(m.contacts<=0){m.airStreak+=1/60; m.stats.airT+=1/60; run.totalAir+=1/60;}
    else{ if(m.airStreak>1.0)award(Math.floor(m.airStreak)*5,'滞空'+m.airStreak.toFixed(1)+'秒');
      m.airStreak=0;}
    // 部品脱落
    if(!race.mod.unbreakable&&race.t>0.6){
      for(const w of m.wheels){
        if(w.lost)continue;
        const aw=anchorWorld(ch,w.local);
        if(Vector.magnitude(Vector.sub(w.body.position,aw))>w.rad+85){
          Composite.remove(race.world,w.cons); w.lost=true;
          m.stats.lost++; run.totalLost++; award(8,'タイヤもげた'); puff(w.body.position.x,w.body.position.y,4); SFX.pop();
          banner('タイヤがもげた',true);
        }
      }
      for(const a of m.apps){
        if(a.lost)continue;
        const aw=anchorWorld(ch,a.local);
        if(Vector.magnitude(Vector.sub(a.body.position,aw))>a.len*0.8+62){
          a.cons.forEach(c=>Composite.remove(race.world,c)); a.lost=true;
          m.stats.lost++; run.totalLost++; award(8,'ツノもげた'); SFX.pop();
          banner('ツノがもげた',true);
        }
      }
      if(!m.driver.ejected){
        const sw=anchorWorld(ch,m.driver.seat);
        if(Vector.magnitude(Vector.sub(m.driver.torso.position,sw))>105){
          m.driver.cons.forEach(c=>Composite.remove(race.world,c));
          m.driver.ejected=true; m.stats.ejected=true; run.totalEject++;
          m.ejectT=race.t;
          award(15,'人形ふっとんだ'); SFX.eject();
          banner('人形がとんだ!');
        }
      }
    }
    // 進行・ゴール・転落
    const x=ch.position.x;
    if(x>m.stats.maxX+2){m.stats.maxX=Math.min(x,race.T.finishX+120);race.lastProg=race.t;}
    if(x<-160)m.stats.rev=true;
    if(!m.stats.finished&&x>=race.T.finishX){
      m.stats.finished=true;m.stats.finishT=race.t;
      SFX.goal();
      banner('完走!!');
      for(let i=0;i<26;i++)puff(x+rng()*60-30,ch.position.y-40-rng()*60,1,['#c2401c','#2f6f4f','#d8a23a'][i%3]);
      race.endAt=Math.min(race.endAt,race.t+1.6);
    }
    if(!m.stats.finished&&ch.position.y>race.T.killY){
      m.stats.dead=true;award(12,'殉職');SFX.dead();
      banner('殉職');
      if(run.round===1&&race.t<5)run.r1FastDeath=true;
      race.endAt=Math.min(race.endAt,race.t+1.1);
    }
    if(m.driver.ejected&&!m.stats.maruSolo&&m.driver.head.position.x>=race.T.finishX&&m.driver.head.position.y<race.T.killY){
      m.stats.maruSolo=true; award(50,'人形、単独ゴール'); SFX.goal();
      banner('人形だけゴール!?');
    }
  }
  Engine.update(race.engine,DT);
  recordFrame();
  engineUpdate(Math.abs(ch.velocity.x),!m.stats.dead&&!m.stats.finished);
  // 終了判定
  const stalled=race.t-race.lastProg>4.5;
  if(race.t>=race.endAt||race.t>25||(race.t>6&&stalled&&!m.stats.finished))endRound(stalled);
}
