/* garakuta-gp audio.js — 効果音(WebAudio合成) */
/* ---------- 効果音(WebAudio合成・外部ファイルなし) ---------- */
const AU={ctx:null,master:null,muted:localStorage.getItem('gp_mute')==='1',
  engOsc:null,engGain:null,lastThud:0};
function auInit(){
  if(AU.ctx)return;
  try{
    AU.ctx=new (window.AudioContext||window.webkitAudioContext)();
    AU.master=AU.ctx.createGain();
    AU.master.gain.value=AU.muted?0:0.9;
    AU.master.connect(AU.ctx.destination);
  }catch(e){AU.ctx=null}
}
function auSetMute(m){AU.muted=m;localStorage.setItem('gp_mute',m?'1':'0');
  if(AU.master)AU.master.gain.value=m?0:0.9;
  document.getElementById('muteBtn').textContent=m?'音なし':'音あり';
  const ts=document.getElementById('titleSound');
  if(ts)ts.textContent='音:'+(m?'なし':'あり')+'(タップで切替)';
}
function tone(freq,dur,type,vol,glideTo,delay){
  if(!AU.ctx||AU.muted)return;
  const t0=AU.ctx.currentTime+(delay||0);
  const o=AU.ctx.createOscillator(),g=AU.ctx.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(freq,t0);
  if(glideTo)o.frequency.exponentialRampToValueAtTime(Math.max(20,glideTo),t0+dur);
  g.gain.setValueAtTime(vol||.2,t0);
  g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g);g.connect(AU.master);o.start(t0);o.stop(t0+dur+.02);
}
function noiseBurst(dur,filtFreq,vol,delay){
  if(!AU.ctx||AU.muted)return;
  const t0=AU.ctx.currentTime+(delay||0);
  const len=Math.max(1,(AU.ctx.sampleRate*dur)|0);
  const buf=AU.ctx.createBuffer(1,len,AU.ctx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AU.ctx.createBufferSource();src.buffer=buf;
  const f=AU.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=filtFreq;
  const g=AU.ctx.createGain();g.gain.value=vol;
  src.connect(f);f.connect(g);g.connect(AU.master);src.start(t0);
}
const SFX={
  thud(v){ const now=performance.now(); if(now-AU.lastThud<90)return; AU.lastThud=now;
    noiseBurst(.12,260,Math.min(.6,v)); tone(95,.13,'sine',Math.min(.5,v*.8),38); },
  crash(){ noiseBurst(.3,700,.7); tone(620,.3,'square',.2,120); tone(70,.32,'sine',.6,32);
    tone(980,.18,'square',.12,300,.06); },
  flip(){ noiseBurst(.22,900,.5); tone(740,.25,'square',.16,180); tone(95,.2,'sine',.4,40); },
  pop(){ tone(620,.09,'square',.3,180); },
  eject(){ tone(380,.45,'sine',.3,1300); tone(900,.14,'sine',.22,500,.5); },
  dead(){ tone(280,.5,'sawtooth',.3,70); noiseBurst(.4,180,.4,.1); },
  goal(){ [ [523,0],[659,.09],[784,.18],[1047,.3] ].forEach(([f,d])=>{tone(f,.32,'square',.2,null,d);tone(f/2,.32,'triangle',.2,null,d)});
    noiseBurst(.5,2600,.12,.05); },
  stamp(){ noiseBurst(.07,500,.5); tone(70,.11,'sine',.6,45); },
  go(){ tone(440,.1,'square',.25); tone(880,.3,'square',.3,null,.12); },
  curse(){ tone(220,.6,'sawtooth',.25,180); tone(233,.6,'sawtooth',.25,196); },
  coin(){ tone(1180,.07,'square',.12,1500); },
  click(){ tone(900,.04,'square',.12); },
};
function engineStart(){
  if(!AU.ctx||AU.engOsc)return;
  AU.engOsc=AU.ctx.createOscillator();AU.engOsc.type='sawtooth';AU.engOsc.frequency.value=42;
  const f=AU.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=240;
  AU.engGain=AU.ctx.createGain();AU.engGain.gain.value=0;
  AU.engOsc.connect(f);f.connect(AU.engGain);AU.engGain.connect(AU.master);
  AU.engOsc.start();
}
function engineUpdate(speedAbs,on){
  if(!AU.engOsc||!AU.engGain)return;
  const t=AU.ctx.currentTime;
  AU.engGain.gain.setTargetAtTime(on?Math.min(.085,.02+speedAbs*.006):0,t,.08);
  AU.engOsc.frequency.setTargetAtTime(42+speedAbs*9,t,.1);
}
