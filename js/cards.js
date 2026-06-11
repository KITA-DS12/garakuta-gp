/* garakuta-gp cards.js — 作業指示票(カード)・手描きアイコン・呪い・命名・称号 */
/* ---------- 作業指示票(44枚+拒否) ----------
   m: はやさ/あんてい/スクラップ(壊れて稼げる度)の見込み(-2..2 or '?')
   fn(cfg): cfg.post に設計図変換、cfg.mod に次走の現場条件 */
const N=(g,i,d)=>{g[i]=clamp01(g[i]+d)};
const eachWheel=(g,fn)=>{for(let w=0;w<4;w++)fn(W0+w*WS,w)};
const CARDS=[
/* ===== 形状 ===== */
{id:'bigwheel',cat:'form',ic:'wheel',name:'とにかくデカいタイヤ',desc:'タイヤがぜんぶ でかくなる',m:{sp:1,st:1,fun:0},w:10,fn:c=>c.post.push(g=>eachWheel(g,b=>N(g,b+1,.5)))},
{id:'mini4',cat:'form',ic:'wheelS',name:'ミニ四駆主義',desc:'タイヤ小さく、回転はやく',m:{sp:2,st:-1,fun:0},w:8,note:'回転↑',fn:c=>c.post.push(g=>eachWheel(g,b=>{N(g,b+1,-.4);N(g,b+2,.3)}))},
{id:'longbody',cat:'form',ic:'long',name:'ロングボディ計画',desc:'車体が ぐいっと のびる',m:{sp:0,st:1,fun:1},w:9,fn:c=>c.post.push(g=>N(g,8,.45))},
{id:'flat',cat:'form',ic:'flat',name:'ぺちゃんこ化',desc:'車高を ふみつぶす',m:{sp:-1,st:2,fun:1},w:8,fn:c=>c.post.push(g=>N(g,9,-.5))},
{id:'nose',cat:'form',ic:'nose',name:'前のめり',desc:'重心がまえへ。はやい。刺さる',m:{sp:2,st:-2,fun:1},w:9,note:'重心まえ',fn:c=>c.post.push(g=>N(g,13,.42))},
{id:'tail',cat:'form',ic:'tail',name:'ケツ重',desc:'重心がうしろへ。ウイリーする',m:{sp:-1,st:-1,fun:2},w:8,note:'重心うしろ',fn:c=>c.post.push(g=>N(g,13,-.42))},
{id:'addwheel',cat:'form',ic:'plus',name:'タイヤを生やす',desc:'タイヤが1本ふえる。場所は運',m:{sp:'?',st:'?',fun:1},w:8,fn:c=>c.post.push(g=>{const off=[];for(let w=0;w<4;w++)if(g[W0+w*WS+3]<=0.45)off.push(w);if(off.length){const w=off[(rng()*off.length)|0];g[W0+w*WS+3]=0.9}})},
{id:'bumpy',cat:'form',ic:'blob',name:'でこぼこボディ',desc:'輪郭が ぐちゃっとなる。芸術',m:{sp:'?',st:-1,fun:2},w:7,fn:c=>c.post.push(g=>{for(let i=0;i<8;i++)N(g,i,(rng()-.5)*.95)})},
{id:'round',cat:'form',ic:'circle',name:'まんまるボディ',desc:'角をぜんぶ削る。転がって進め',m:{sp:'?',st:-2,fun:2},w:7,fn:c=>c.post.push(g=>{for(let i=0;i<8;i++)g[i]=lerp(g[i],.75,.7);N(g,9,.25)})},
{id:'horn',cat:'form',ic:'horn',name:'ツノを生やす',desc:'りっぱなツノ。意味はない',m:{sp:0,st:-1,fun:2},w:8,fn:c=>c.post.push(g=>{const a=rng()<.5?40:43;g[a+2]=0.95;N(g,a+1,.4)})},
{id:'low',cat:'form',ic:'low',name:'シャコタン',desc:'腹スレスレ。直線番長',m:{sp:2,st:-1,fun:0},w:7,note:'車高↓',fn:c=>c.post.push(g=>{N(g,14,.4);eachWheel(g,b=>N(g,b+1,-.12))})},
{id:'shuffle',cat:'form',ic:'shuffle',name:'タイヤ大移動',desc:'タイヤぜんぶ つけ直し。場所は運',m:{sp:'?',st:'?',fun:2},w:6,fn:c=>c.post.push(g=>eachWheel(g,b=>{g[b]=rng()}))},
/* ===== 物理 ===== */
{id:'leadpants',cat:'phys',ic:'pants',name:'鉛のパンツ',desc:'重心がさがる。転ばない。地味',m:{sp:0,st:2,fun:-1},w:10,note:'重心↓↓',fn:c=>c.post.push(g=>N(g,14,.55))},
{id:'helium',cat:'phys',ic:'balloon',name:'ヘリウム頭',desc:'重心があがる。よく転ぶ',m:{sp:0,st:-2,fun:2},w:6,note:'重心↑↑',fn:c=>c.post.push(g=>N(g,14,-.5))},
{id:'softsus',cat:'phys',ic:'spring',name:'バネびよんびよん',desc:'サスやわやわ。着地で跳ねる',m:{sp:0,st:-1,fun:2},w:8,note:'やわらか',fn:c=>c.post.push(g=>N(g,15,-.5))},
{id:'hardsus',cat:'phys',ic:'bricks',name:'ガチガチサス',desc:'サスが石。衝撃はぜんぶ人形へ',m:{sp:1,st:1,fun:0},w:8,note:'ガチガチ',fn:c=>c.post.push(g=>N(g,15,.55))},
{id:'slippy',cat:'phys',ic:'slip',name:'ぬるぬるコート',desc:'摩擦が消える。止まれない',m:{sp:2,st:-2,fun:1},w:7,note:'ツルツル',fn:c=>c.post.push(g=>{N(g,11,-.55);eachWheel(g,b=>N(g,b+4,-.3))})},
{id:'grippy',cat:'phys',ic:'grip',name:'ハイグリップ宣言',desc:'タイヤが路面に吸いつく',m:{sp:1,st:2,fun:-1},w:9,note:'すいつき',fn:c=>c.post.push(g=>eachWheel(g,b=>N(g,b+4,.55)))},
{id:'ball',cat:'phys',ic:'ball',name:'スーパーボール車体',desc:'落ちたら跳ねる。もう止まらない',m:{sp:'?',st:-2,fun:2},w:7,note:'はずむ',fn:c=>c.post.push(g=>N(g,12,.6))},
{id:'heavy',cat:'phys',ic:'anvil',name:'重量級',desc:'ぜんぶ重く。動じない。坂は無理',m:{sp:-2,st:2,fun:0},w:7,note:'ずっしり',fn:c=>c.post.push(g=>N(g,10,.5))},
{id:'light',cat:'phys',ic:'hole',name:'穴あけ軽量化',desc:'軽い。強度はあとで考える',m:{sp:2,st:-1,fun:1},w:8,note:'かるい',fn:c=>c.post.push(g=>{N(g,10,-.5);N(g,19,-.1)})},
{id:'torque',cat:'phys',ic:'boltz',name:'トルク増し増し',desc:'パワーアップ。発進でウイリー',m:{sp:2,st:-1,fun:1},w:9,note:'パワー↑',fn:c=>c.post.push(g=>eachWheel(g,b=>N(g,b+2,.45)))},
{id:'nobrake',cat:'phys',ic:'fire',name:'ブレーキ?知らない子',desc:'全力。グリップは捨てた',m:{sp:2,st:-2,fun:2},w:6,note:'全開',fn:c=>c.post.push(g=>{eachWheel(g,b=>{N(g,b+2,.55);N(g,b+4,-.3)})})},
/* ===== 整備(性能を削って耐久を取り戻す) ===== */
{id:'overhaul',cat:'fix',ic:'wrench',name:'オーバーホール',desc:'パワー2割引きで、全部しっかり直す',note:'がっちり',m:{sp:-1,st:2,fun:-2},w:8,fn:c=>c.post.push(g=>{
  g[15]=lerp(g[15],.6,.6);N(g,16,.2);N(g,11,.25);N(g,12,-.4);N(g,19,.2);
  eachWheel(g,b=>{N(g,b+2,-.13);N(g,b+4,.25)})})},
{id:'rotation',cat:'fix',ic:'wheel',name:'タイヤ整備',desc:'タイヤを揃えて締め直す。少しおそく',note:'そろえた',m:{sp:-1,st:2,fun:-1},w:7,fn:c=>c.post.push(g=>{
  const on=[];for(let w=0;w<4;w++)if(g[W0+w*WS+3]>0.45)on.push(W0+w*WS);
  if(on.length){const avg=on.reduce((a,b)=>a+g[b+1],0)/on.length;
    on.forEach(b=>{g[b+1]=lerp(g[b+1],avg,.7);N(g,b+4,.2);N(g,b+2,-.08)})}})},
{id:'armor',cat:'fix',ic:'bricks',name:'装甲化',desc:'激突に強くなる。そのぶん重い(ずっと)',m:{sp:-1,st:2,fun:-1},w:6,fn:c=>{c.equip={armor:true};c.post.push(g=>N(g,10,.2))}},
/* ===== 探索(自分の設計図いじり) ===== */
{id:'mutbig',cat:'evo',ic:'dice',name:'現状維持は悪',desc:'改造のブレが2倍。大ばくち',m:{sp:'?',st:'?',fun:1},w:9,fn:c=>{c.noise*=2.5}},
{id:'mutsmall',cat:'evo',ic:'hush',name:'そっと、そっとだ',desc:'いまの形を ほぼ守る',m:{sp:0,st:1,fun:-1},w:8,fn:c=>{c.noise*=0.2}},
{id:'lockwheel',cat:'evo',ic:'lock',name:'タイヤだけは信じろ',desc:'タイヤまわりを固定する',m:{sp:0,st:1,fun:0},w:8,fn:c=>{WHEEL_GENES.forEach(i=>c.locks.add(i))}},
{id:'lockbody',cat:'evo',ic:'lock',name:'ボディは完成している',desc:'車体のかたちを固定する',m:{sp:0,st:1,fun:0},w:8,fn:c=>{CHASSIS_GENES.forEach(i=>c.locks.add(i))}},
{id:'reroll',cat:'evo',ic:'star',name:'振り出しに戻る',desc:'完全に新しい車に とりかえ',m:{sp:'?',st:'?',fun:'?'},w:7,fn:c=>c.post.push(g=>{const n=starterGenome();for(let i=0;i<GSIZE;i++)g[i]=n[i]})},
{id:'ancestor',cat:'evo',ic:'frame',name:'ご先祖さま召喚',desc:'いちばん走れた回の車にもどす',m:{sp:1,st:1,fun:-1},w:4,rare:true,fn:c=>{c.useBest='full'}},
{id:'nikoichi',cat:'evo',ic:'wrench',name:'ニコイチ',desc:'ベストの回と今を 半分こ',m:{sp:1,st:0,fun:0},w:7,fn:c=>{c.useBest='half'}},
{id:'tighten',cat:'evo',ic:'screw',name:'ネジぜんぶ締め直し',desc:'ぜんぶ平均的に。おとなしくなる',m:{sp:-1,st:2,fun:-2},w:6,note:'平均化',fn:c=>c.post.push(g=>{for(let i=0;i<GSIZE;i++)g[i]=lerp(g[i],.5,.55)})},
{id:'yakekuso',cat:'evo',ic:'zigzag',name:'ヤケクソ全開',desc:'ぜんぶ極端に。知らん',m:{sp:'?',st:-2,fun:2},w:4,rare:true,fn:c=>c.post.push(g=>{for(let i=0;i<GSIZE;i++)g[i]=clamp01(.5+(g[i]-.5)*2.2)})},
/* ===== カオス ===== */
{id:'rocketeq',cat:'chaos',ic:'rocket',name:'ロケットエンジン搭載',desc:'毎回3秒後に点火する(ずっと)',m:{sp:2,st:-2,fun:2},w:3,rare:true,fn:c=>{c.equip={rocket:true}}},
{id:'upside',cat:'chaos',ic:'uturn',name:'さかさま組み立て',desc:'タイヤを反対側に つけ直す',m:{sp:'?',st:'?',fun:2},w:5,fn:c=>c.post.push(g=>{eachWheel(g,b=>{g[b]=(g[b]+.5)%1});g[40]=(g[40]+.5)%1;g[43]=(g[43]+.5)%1})},
{id:'confiscate',cat:'chaos',ic:'slash',name:'タイヤ没収',desc:'1本もってかれる。経費削減',m:{sp:-2,st:-1,fun:2},w:6,fn:c=>c.post.push(g=>{const on=[];for(let w=0;w<4;w++)if(g[W0+w*WS+3]>0.45)on.push(w);if(on.length>1){const w=on[(rng()*on.length)|0];g[W0+w*WS+3]=0.1}})},
{id:'fatdoll',cat:'chaos',ic:'maru',name:'人形、増量',desc:'人形がふとる。重心がそっちへ行く',m:{sp:-1,st:-2,fun:2},w:6,note:'人形おもい',fn:c=>c.post.push(g=>N(g,18,.6))},
{id:'nobelt',cat:'chaos',ic:'scissors',name:'シートベルト撤去',desc:'人形はとぶ。スクラップは入る',m:{sp:0,st:-1,fun:2},w:6,note:'ベルトなし',fn:c=>c.post.push(g=>N(g,19,-.3))},
{id:'weld',cat:'chaos',ic:'drop',name:'ぜんぶ溶接',desc:'部品がもう外れない(ずっと)',m:{sp:0,st:2,fun:-2},w:5,fn:c=>{c.equip={weld:true};c.post.push(g=>N(g,19,.3))}},
{id:'onewheel',cat:'chaos',ic:'one',name:'1本だけ本気',desc:'1本だけ全力、他はやる気なし',m:{sp:'?',st:-2,fun:2},w:6,note:'1本に全振り',fn:c=>c.post.push(g=>{const on=[];for(let w=0;w<4;w++)if(g[W0+w*WS+3]>0.45)on.push(w);if(on.length){const hero=on[(rng()*on.length)|0];on.forEach(w=>{g[W0+w*WS+2]=w===hero?1:Math.max(0,g[W0+w*WS+2]-.25)})}})},
{id:'monster',cat:'form',ic:'wheel',name:'モンスタートラック',desc:'タイヤぜんぶ最大サイズ+力もり',m:{sp:2,st:1,fun:1},w:3,rare:true,fn:c=>c.post.push(g=>eachWheel(g,b=>{g[b+1]=.95;N(g,b+2,.3)}))},
{id:'frontw',cat:'chaos',ic:'wheelS',name:'タイヤぜんぶ前へ',desc:'前輪駆動どころの話ではない',m:{sp:'?',st:-2,fun:2},w:5,fn:c=>c.post.push(g=>eachWheel(g,b=>{g[b]=(1+(rng()*.24-.12))%1}))},
{id:'rearw',cat:'chaos',ic:'wheelS',name:'タイヤぜんぶ後ろへ',desc:'押して走るスタイル',m:{sp:'?',st:-2,fun:2},w:5,fn:c=>c.post.push(g=>eachWheel(g,b=>{g[b]=.5+(rng()*.24-.12)}))},
{id:'noppo',cat:'form',ic:'balloon',name:'のっぽビル',desc:'背がたかくなる。倒れる',m:{sp:-1,st:-2,fun:2},w:5,fn:c=>c.post.push(g=>{N(g,9,.6);N(g,14,-.4)})},
{id:'chibi',cat:'form',ic:'hole',name:'ミニカー化',desc:'ぜんぶ小さく、かるくなる',m:{sp:1,st:0,fun:1},w:5,note:'かるい',fn:c=>c.post.push(g=>{N(g,8,-.4);N(g,9,-.3);N(g,10,-.3);eachWheel(g,b=>N(g,b+1,-.2))})},
{id:'hedgehog',cat:'chaos',ic:'burst',name:'はりねずみ化',desc:'ツノ全開+ボディぐちゃぐちゃ',m:{sp:'?',st:-1,fun:2},w:4,fn:c=>c.post.push(g=>{g[40]=.78;g[41]=.95;g[42]=.95;g[43]=.28;g[44]=.85;g[45]=.95;for(let i=0;i<8;i++)N(g,i,(rng()-.5)*.9)})},
{id:'tallhorn',cat:'chaos',ic:'antenna',name:'アンテナ義務化',desc:'長すぎるツノが2本つく',m:{sp:0,st:-2,fun:2},w:5,fn:c=>c.post.push(g=>{g[40]=.78;g[41]=.95;g[42]=.95;g[43]=.28;g[44]=.85;g[45]=.95})},
];
const CATNAME={form:'かたち',phys:'ぶつり',evo:'かいぞう',chaos:'カオス',fix:'せいび'};

/* ---------- 手描きアイコン(絵文字は使わない) ---------- */
const INK='#2e2a24';
const DOODLES={
 wheel(c,s){c.beginPath();c.arc(0,0,s*.8,0,7);c.stroke();
  for(let i=0;i<3;i++){const a=i*Math.PI/1.5+.4;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*s*.7,Math.sin(a)*s*.7);c.stroke()}
  c.beginPath();c.arc(0,0,s*.16,0,7);c.fill()},
 wheelS(c,s){for(const x of[-s*.45,s*.45]){c.beginPath();c.arc(x,s*.2,s*.38,0,7);c.stroke();c.beginPath();c.arc(x,s*.2,s*.08,0,7);c.fill()}
  c.beginPath();c.moveTo(-s*.6,-s*.35);c.lineTo(s*.6,-s*.35);c.stroke()},
 long(c,s){c.strokeRect(-s,-s*.28,s*2,s*.56);c.beginPath();c.moveTo(-s*1.2,s*.55);c.lineTo(s*1.2,s*.55);c.stroke()},
 flat(c,s){c.strokeRect(-s*.9,s*.1,s*1.8,s*.5);
  c.beginPath();c.moveTo(0,-s*.8);c.lineTo(0,-s*.15);c.moveTo(-s*.22,-s*.4);c.lineTo(0,-s*.15);c.lineTo(s*.22,-s*.4);c.stroke()},
 nose(c,s){c.save();c.rotate(.35);c.strokeRect(-s*.7,-s*.25,s*1.4,s*.5);c.restore();
  c.beginPath();c.moveTo(s*.5,s*.5);c.lineTo(s*.9,s*.8);c.moveTo(s*.9,s*.45);c.lineTo(s*.9,s*.8);c.lineTo(s*.55,s*.8);c.stroke()},
 tail(c,s){c.save();c.rotate(-.5);c.strokeRect(-s*.7,-s*.2,s*1.4,s*.5);c.restore();
  c.beginPath();c.arc(s*.55,s*.55,s*.3,0,7);c.stroke()},
 plus(c,s){c.beginPath();c.moveTo(0,-s*.7);c.lineTo(0,s*.1);c.moveTo(-s*.4,-s*.3);c.lineTo(s*.4,-s*.3);c.stroke();
  c.beginPath();c.arc(0,s*.55,s*.32,0,7);c.stroke()},
 blob(c,s){const r=[.9,.6,.95,.55,.85,.65,.9];c.beginPath();
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const p=[Math.cos(a)*s*r[i],Math.sin(a)*s*r[i]];i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}
  c.closePath();c.stroke()},
 circle(c,s){c.beginPath();c.arc(0,0,s*.78,0,7);c.stroke();
  c.beginPath();c.arc(s*.95,s*.6,s*.12,0,7);c.stroke()},
 horn(c,s){c.strokeRect(-s*.7,0,s*1.4,s*.55);
  c.beginPath();c.moveTo(s*.1,0);c.lineTo(s*.65,-s*.85);c.moveTo(s*.65,-s*.85);c.lineTo(s*.45,-s*.3);c.stroke()},
 low(c,s){c.strokeRect(-s*.8,s*.15,s*1.6,s*.4);c.beginPath();c.moveTo(-s,s*.75);c.lineTo(s,s*.75);c.stroke();
  c.beginPath();c.moveTo(-s*.3,-s*.6);c.lineTo(-s*.3,0);c.moveTo(s*.3,-s*.6);c.lineTo(s*.3,0);c.stroke()},
 shuffle(c,s){c.beginPath();c.moveTo(-s*.8,-s*.4);c.bezierCurveTo(0,-s*.4,0,s*.4,s*.7,s*.4);c.stroke();
  c.beginPath();c.moveTo(-s*.8,s*.4);c.bezierCurveTo(0,s*.4,0,-s*.4,s*.7,-s*.4);c.stroke();
  c.beginPath();c.moveTo(s*.45,-s*.65);c.lineTo(s*.8,-s*.4);c.lineTo(s*.45,-s*.15);c.stroke()},
 pants(c,s){c.beginPath();c.moveTo(-s*.6,-s*.5);c.lineTo(s*.6,-s*.5);c.lineTo(s*.7,s*.6);c.lineTo(s*.18,s*.6);c.lineTo(0,-s*.05);
  c.lineTo(-s*.18,s*.6);c.lineTo(-s*.7,s*.6);c.closePath();c.stroke()},
 balloon(c,s){c.beginPath();c.arc(0,-s*.3,s*.5,0,7);c.stroke();
  c.beginPath();c.moveTo(0,s*.2);c.quadraticCurveTo(s*.25,s*.55,0,s*.85);c.stroke()},
 spring(c,s){c.beginPath();c.moveTo(0,-s*.85);
  for(let i=0;i<5;i++)c.lineTo((i%2?-1:1)*s*.5,-s*.85+(i+1)*s*.34);c.stroke()},
 bricks(c,s){c.strokeRect(-s*.8,-s*.6,s*.78,s*.55);c.strokeRect(.02,-s*.6,s*.78,s*.55);
  c.strokeRect(-s*.4,.03,s*.78,s*.55)},
 slip(c,s){c.beginPath();c.moveTo(-s*.5,-s*.3);c.lineTo(s*.9,-s*.3);c.lineTo(s*.6,s*.25);c.lineTo(-s*.8,s*.25);c.closePath();c.stroke();
  c.beginPath();c.moveTo(-s*.9,s*.6);c.lineTo(-s*.3,s*.6);c.moveTo(-s*.05,s*.6);c.lineTo(s*.45,s*.6);c.stroke()},
 grip(c,s){c.beginPath();c.arc(0,-s*.15,s*.62,0,7);c.stroke();
  for(let i=-1;i<2;i++){c.beginPath();c.moveTo(i*s*.4,s*.5);c.lineTo(i*s*.4,s*.85);c.stroke()}},
 ball(c,s){c.beginPath();c.arc(0,-s*.25,s*.5,0,7);c.stroke();
  c.beginPath();c.moveTo(-s*.8,s*.7);c.quadraticCurveTo(-s*.3,s*.1,s*.1,s*.7);c.quadraticCurveTo(s*.5,s*.3,s*.85,s*.7);c.stroke()},
 anvil(c,s){c.beginPath();c.moveTo(-s*.85,-s*.45);c.lineTo(s*.85,-s*.45);c.lineTo(s*.55,-s*.05);c.lineTo(s*.2,-s*.05);
  c.lineTo(s*.35,s*.5);c.lineTo(-s*.35,s*.5);c.lineTo(-s*.2,-s*.05);c.lineTo(-s*.55,-s*.05);c.closePath();c.stroke()},
 hole(c,s){c.setLineDash([s*.25,s*.18]);c.beginPath();c.arc(0,0,s*.7,0,7);c.stroke();c.setLineDash([])},
 boltz(c,s){c.beginPath();c.moveTo(s*.25,-s*.9);c.lineTo(-s*.35,s*.1);c.lineTo(s*.05,s*.1);c.lineTo(-s*.25,s*.9);
  c.lineTo(s*.45,-s*.15);c.lineTo(s*.05,-s*.15);c.closePath();c.stroke()},
 fire(c,s){c.beginPath();c.moveTo(0,s*.8);c.bezierCurveTo(-s*.8,s*.4,-s*.3,-s*.2,0,-s*.85);
  c.bezierCurveTo(s*.15,-s*.3,s*.7,-s*.1,s*.45,s*.35);c.bezierCurveTo(s*.4,s*.65,s*.25,s*.75,0,s*.8);c.stroke()},
 dice(c,s){c.strokeRect(-s*.65,-s*.65,s*1.3,s*1.3);
  for(const[x,y]of[[-.3,-.3],[.3,.3],[0,0]]){c.beginPath();c.arc(x*s,y*s,s*.1,0,7);c.fill()}},
 hush(c,s){c.beginPath();c.moveTo(0,-s*.85);c.lineTo(0,s*.4);c.stroke();
  c.beginPath();c.arc(0,s*.75,s*.1,0,7);c.fill()},
 lock(c,s){c.strokeRect(-s*.55,-s*.1,s*1.1,s*.8);
  c.beginPath();c.arc(0,-s*.15,s*.38,Math.PI,0);c.stroke()},
 star(c,s){for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?s*.35:s*.85;
  c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke()}},
 frame(c,s){c.strokeRect(-s*.65,-s*.75,s*1.3,s*1.5);
  c.beginPath();c.moveTo(s*.15,-s*.75);c.lineTo(s*.65,-s*.25);c.stroke();
  c.beginPath();c.arc(0,-s*.1,s*.28,0,7);c.stroke();c.beginPath();c.moveTo(-s*.3,s*.55);c.lineTo(s*.3,s*.55);c.stroke()},
 wrench(c,s){c.beginPath();c.arc(-s*.45,-s*.45,s*.34,.7,5.6);c.stroke();
  c.beginPath();c.moveTo(-s*.2,-s*.2);c.lineTo(s*.65,s*.65);c.stroke()},
 screw(c,s){c.beginPath();c.arc(0,0,s*.7,0,7);c.stroke();
  c.beginPath();c.moveTo(-s*.45,0);c.lineTo(s*.45,0);c.stroke()},
 zigzag(c,s){c.beginPath();c.moveTo(-s*.8,-s*.7);c.lineTo(s*.6,-s*.7);c.lineTo(-s*.6,s*.1);c.lineTo(s*.8,s*.1);
  c.lineTo(-s*.2,s*.8);c.stroke()},
 rocket(c,s){c.save();c.rotate(.6);c.beginPath();c.moveTo(0,-s*.9);c.quadraticCurveTo(s*.4,-s*.2,s*.28,s*.45);
  c.lineTo(-s*.28,s*.45);c.quadraticCurveTo(-s*.4,-s*.2,0,-s*.9);c.stroke();
  c.beginPath();c.moveTo(-s*.28,s*.45);c.lineTo(-s*.5,s*.75);c.moveTo(s*.28,s*.45);c.lineTo(s*.5,s*.75);c.stroke();
  c.beginPath();c.moveTo(-s*.1,s*.5);c.lineTo(0,s*.9);c.lineTo(s*.1,s*.5);c.stroke();c.restore()},
 back(c,s){c.beginPath();c.moveTo(s*.8,0);c.lineTo(-s*.5,0);c.stroke();
  c.beginPath();c.moveTo(-s*.1,-s*.4);c.lineTo(-s*.6,0);c.lineTo(-s*.1,s*.4);c.stroke()},
 uturn(c,s){c.beginPath();c.arc(0,0,s*.6,Math.PI*.1,Math.PI*1.6);c.stroke();
  c.beginPath();c.moveTo(s*.2,s*.75);c.lineTo(s*.62,s*.42);c.lineTo(s*.15,s*.2);c.stroke()},
 slash(c,s){c.beginPath();c.arc(0,0,s*.75,0,7);c.stroke();
  c.beginPath();c.moveTo(-s*.52,-s*.52);c.lineTo(s*.52,s*.52);c.stroke()},
 wind(c,s){for(let i=-1;i<2;i++){c.beginPath();c.moveTo(-s*.85,i*s*.45);
  c.bezierCurveTo(-s*.2,i*s*.45-s*.2,s*.2,i*s*.45+s*.2,s*.85,i*s*.45);c.stroke()}},
 moon(c,s){c.beginPath();c.arc(0,0,s*.7,Math.PI*.65,Math.PI*2.35);
  c.arc(s*.45,0,s*.52,Math.PI*1.8,Math.PI*1.2,true);c.stroke()},
 magnet(c,s){c.beginPath();c.arc(0,-s*.15,s*.55,Math.PI,0,true);c.stroke();
  c.beginPath();c.moveTo(-s*.55,-s*.15);c.lineTo(-s*.55,s*.5);c.moveTo(s*.55,-s*.15);c.lineTo(s*.55,s*.5);c.stroke();
  c.strokeRect(-s*.7,s*.5,s*.32,s*.3);c.strokeRect(s*.38,s*.5,s*.32,s*.3)},
 flake(c,s){for(let i=0;i<3;i++){const a=i*Math.PI/3;
  c.beginPath();c.moveTo(-Math.cos(a)*s*.8,-Math.sin(a)*s*.8);c.lineTo(Math.cos(a)*s*.8,Math.sin(a)*s*.8);c.stroke()}},
 maru(c,s){c.beginPath();c.arc(0,s*.08,s*.62,0,7);c.stroke();
  c.beginPath();c.arc(0,0,s*.66,Math.PI*1.05,Math.PI*1.95);c.stroke();
  c.beginPath();c.arc(-s*.22,s*.18,s*.06,0,7);c.fill();c.beginPath();c.arc(s*.22,s*.18,s*.06,0,7);c.fill();
  c.beginPath();c.moveTo(-s*.18,s*.45);c.lineTo(s*.18,s*.45);c.stroke()},
 scissors(c,s){c.beginPath();c.moveTo(-s*.6,-s*.6);c.lineTo(s*.7,s*.5);c.moveTo(s*.7,-s*.5);c.lineTo(-s*.6,s*.6);c.stroke();
  c.beginPath();c.arc(-s*.72,-s*.66,s*.18,0,7);c.stroke();c.beginPath();c.arc(-s*.72,s*.66,s*.18,0,7);c.stroke()},
 drop(c,s){c.beginPath();c.moveTo(0,-s*.85);c.bezierCurveTo(s*.65,0,s*.5,s*.6,0,s*.7);
  c.bezierCurveTo(-s*.5,s*.6,-s*.65,0,0,-s*.85);c.stroke()},
 one(c,s){c.beginPath();c.arc(0,0,s*.8,0,7);c.stroke();
  c.beginPath();c.moveTo(-s*.2,-s*.25);c.lineTo(s*.05,-s*.45);c.lineTo(s*.05,s*.45);c.stroke()},
 antenna(c,s){c.beginPath();c.moveTo(0,s*.85);c.lineTo(0,-s*.55);c.stroke();
  c.beginPath();c.arc(0,-s*.55,s*.3,Math.PI*1.15,Math.PI*1.85);c.stroke();
  c.beginPath();c.arc(0,-s*.55,s*.55,Math.PI*1.2,Math.PI*1.8);c.stroke();
  c.beginPath();c.arc(0,-s*.55,s*.07,0,7);c.fill()},
 skull(c,s){c.beginPath();c.arc(0,-s*.15,s*.6,0,7);c.stroke();
  c.beginPath();c.arc(-s*.24,-s*.2,s*.11,0,7);c.fill();c.beginPath();c.arc(s*.24,-s*.2,s*.11,0,7);c.fill();
  for(let i=-1;i<2;i++){c.beginPath();c.moveTo(i*s*.2,s*.4);c.lineTo(i*s*.2,s*.7);c.stroke()}},
 question(c,s){c.font='900 '+(s*1.7)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',0,s*.08)},
 car(c,s){c.beginPath();c.moveTo(-s*.85,s*.2);c.lineTo(-s*.85,-s*.15);c.lineTo(-s*.3,-s*.15);c.lineTo(-s*.05,-s*.5);
  c.lineTo(s*.5,-s*.5);c.lineTo(s*.65,-s*.15);c.lineTo(s*.85,s*.2);c.closePath();c.stroke();
  c.beginPath();c.arc(-s*.45,s*.35,s*.25,0,7);c.stroke();c.beginPath();c.arc(s*.45,s*.35,s*.25,0,7);c.stroke()},
 burst(c,s){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;
  c.beginPath();c.moveTo(Math.cos(a)*s*.3,Math.sin(a)*s*.3);c.lineTo(Math.cos(a)*s*(.6+(i%2)*.3),Math.sin(a)*s*(.6+(i%2)*.3));c.stroke()}},
 ghostd(c,s){c.beginPath();c.arc(0,-s*.2,s*.55,Math.PI,0);c.lineTo(s*.55,s*.55);
  for(let i=2;i>=-2;i--)c.quadraticCurveTo((i+.5)*s*.275,s*.75,i*s*.275,s*.55);c.closePath();c.stroke();
  c.beginPath();c.arc(-s*.2,-s*.2,s*.08,0,7);c.fill();c.beginPath();c.arc(s*.2,-s*.2,s*.08,0,7);c.fill()},
 flag(c,s){c.beginPath();c.moveTo(-s*.5,s*.85);c.lineTo(-s*.5,-s*.85);c.stroke();
  c.beginPath();c.moveTo(-s*.5,-s*.85);c.lineTo(s*.7,-s*.5);c.lineTo(-s*.5,-s*.15);c.closePath();c.stroke()},
 mail(c,s){c.strokeRect(-s*.8,-s*.5,s*1.6,s);
  c.beginPath();c.moveTo(-s*.8,-s*.5);c.lineTo(0,s*.15);c.lineTo(s*.8,-s*.5);c.stroke()},
};
function doodle(cv,name,px){
  if(!cv||!cv.getContext)return;
  cv.width=px;cv.height=px;
  const c=cv.getContext('2d');
  c.clearRect(0,0,px,px);
  c.strokeStyle=INK;c.fillStyle=INK;
  c.lineWidth=Math.max(2,px*.075);c.lineCap='round';c.lineJoin='round';
  c.save();c.translate(px/2,px/2);
  (DOODLES[name]||DOODLES.question)(c,px/2*.8);
  c.restore();
}

/* 呪い(全部拒否) */
const CURSES=[
 {t:'タイヤが1本、ありえないサイズになった',f:g=>{const w=(rng()*4)|0;g[W0+w*WS+1]=.99;g[W0+w*WS+3]=.9}},
 {t:'車体が めちゃくちゃ細長くなった',f:g=>{g[8]=.99;g[9]=.05}},
 {t:'重心がどこか変なところへ行った',f:g=>{g[13]=rng()<.5?.99:.01;g[14]=rng()<.5?.99:.01}},
 {t:'サスペンションがこんにゃくになった',f:g=>{g[15]=.01}},
 {t:'車体がスーパーボールの素材になった',f:g=>{g[12]=.99}},
 {t:'人形がとんでもなく重くなった',f:g=>{g[18]=.99}},
 {t:'タイヤがぜんぶ 微妙な位置に移動した',f:g=>{eachWheel(g,b=>{g[b]=rng()})}},
 {t:'りっぱすぎるツノが生えた',f:g=>{g[40]=rng();g[41]=.99;g[42]=.99}},
];

/* ---------- 命名(走行ログから引く・ひらがな) ---------- */
function nameMachine(st,g,gen){
  const sp=decode(g);
  let pre='';
  if(st.maruSolo) pre='でんせつの';
  else if(st.flips>=5) pre='ぐるぐる';
  else if(st.flips>=2) pre='まえまわり';
  else if(st.rev) pre='おうちかえる';
  else if(st.lost>=2) pre='バラバラ寸前';
  else if(st.lost===1) pre='もげた';
  else if(st.airT>2.2) pre='ふわふわ';
  else if(st.ejected) pre='ポイすて';
  else if(st.finished&&st.flips===0) pre='おすまし';
  else if(st.dead) pre='とっこう';
  const wls=sp.wheels.filter(w=>w.en);
  const maxR=wls.length?Math.max(...wls.map(w=>w.rad)):0;
  let noun='ガラクタ';
  if(sp.apps.some(a=>a.en)) noun='ツノつき';
  if(wls.length>=4) noun='よんりん';
  if(sp.sy<0.62) noun='ぺったんこ';
  if(sp.sx>1.7) noun='ながいの';
  if(maxR>38) noun='でかタイヤ';
  if(sp.density>0.005) noun='おもいの';
  const sfx = st.maruSolo?'(人形)': gen>=9?'カイ' : (rng()<.25?'さん':gen+'号');
  return (pre?pre+'・':'')+noun+' '+sfx;
}

/* ---------- 称号(褒めない) ---------- */
const TITLES=[
 {t:'人形、単独ゴール',f:r=>r.maruSolo},
 {t:'出オチ',f:r=>r.r1FastDeath},
 {t:'過去の自分に負けた',f:r=>r.lostToGhost},
 {t:'呪われた血統',f:r=>r.curses>=3},
 {t:'空を知った',f:r=>r.totalAir>8},
 {t:'五体投地',f:r=>r.totalFlips>=15},
 {t:'人形に支えられて',f:r=>r.totalEject>=5},
 {t:'部品納入業者',f:r=>r.totalLost>=8},
 {t:'九分九厘',f:r=>!r.champ.finished&&r.bestDist>r.course*0.92},
 {t:'カオスの申し子',f:r=>r.chaosPicks>=4},
 {t:'走る災害',f:r=>r.totalLost>=6&&r.totalEject>=4},
 {t:'紙一重の天才',f:r=>r.champ.finished&&r.champ.flips>=4},
 {t:'速いだけ',f:r=>r.champ.finished&&r.champ.flips>=2},
 {t:'順当(つまらん)',f:r=>r.champ.finished&&r.totalFlips<=3},
 {t:'無駄に頑丈',f:r=>r.totalLost===0&&r.totalEject<=1},
 {t:'特筆事項なし',f:()=>true},
];
function pickTitle(r){for(const t of TITLES)if(t.f(r))return t.t;return '特筆事項なし'}
