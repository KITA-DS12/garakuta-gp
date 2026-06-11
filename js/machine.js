/* garakuta-gp machine.js — マシン組み立て(車体・タイヤ・ツノ・人形) */
/* ---------- マシン組み立て(自機1台) ---------- */
const CAT_TERRAIN=1, CAT_MACHINE=2;
function buildMachine(world,genome,x0,y0,mod){
  const sp=decode(genome);
  const W=55*sp.sx, H=26*sp.sy;
  const filter={group:-1,category:CAT_MACHINE,mask:CAT_TERRAIN};
  const verts=[];
  for(let i=0;i<8;i++){const th=i/8*Math.PI*2;
    verts.push({x:Math.cos(th)*W*sp.verts[i], y:Math.sin(th)*H*sp.verts[i]});}
  const chassis=Bodies.fromVertices(x0,y0,[verts],{
    density:sp.density,friction:sp.friction,restitution:sp.rest,
    collisionFilter:filter,label:'M0'});
  Body.setCentre(chassis,{x:sp.cx*W*.6,y:sp.cy*H*.6},true);
  Composite.add(world,chassis);
  const dir = (mod.reverseChance&&rng()<mod.reverseChance)?-1:1;
  const m={genome,sp,chassis,wheels:[],apps:[],dir,
    stats:{dist:0,maxX:x0,flips:0,airT:0,lost:0,ejected:false,finished:false,dead:false,rev:false,maruSolo:false,finishT:0},
    rotAcc:0,lastAngle:chassis.angle,contacts:0,airStreak:0};
  sp.wheels.forEach(wd=>{
    if(!wd.en)return;
    const ax=Math.cos(wd.ang)*W*1.05, ay=Math.sin(wd.ang)*H*1.05;
    const wx=x0+ax, wy=y0+ay;
    const body=Bodies.circle(wx,wy,wd.rad,{density:.0022,friction:wd.grip,restitution:.1,
      collisionFilter:filter,label:'W0'});
    const local={x:wx-chassis.position.x,y:wy-chassis.position.y};
    const cons=Constraint.create({bodyA:chassis,pointA:local,bodyB:body,
      stiffness:sp.sus,damping:sp.dmp,length:0});
    Composite.add(world,[body,cons]);
    m.wheels.push({body,cons,local,rad:wd.rad,spd:wd.spd,lost:false});
  });
  sp.apps.forEach(ad=>{
    if(!ad.en)return;
    const bx=Math.cos(ad.ang)*W, by=Math.sin(ad.ang)*H;
    const cx=x0+bx+Math.cos(ad.ang)*ad.len/2, cy=y0+by+Math.sin(ad.ang)*ad.len/2;
    const body=Bodies.rectangle(cx,cy,ad.len,9,{angle:ad.ang,density:.0018,friction:.4,
      collisionFilter:filter,label:'A0'});
    const l1={x:(x0+bx)-chassis.position.x,y:(y0+by)-chassis.position.y};
    const c1=Constraint.create({bodyA:chassis,pointA:l1,bodyB:body,
      pointB:{x:-ad.len/2,y:0},stiffness:.9,length:0});
    const c2=Constraint.create({bodyA:chassis,pointA:{x:l1.x*0.55,y:l1.y*0.55},bodyB:body,
      pointB:{x:-ad.len*0.32,y:0},stiffness:.85,length:0});
    Composite.add(world,[body,c1,c2]);
    m.apps.push({body,cons:[c1,c2],local:l1,len:ad.len,lost:false});
  });
  // テストドライバー人形
  const seat={x:0,y:-H-13};
  const tx=chassis.position.x+seat.x, ty=chassis.position.y+seat.y;
  const torso=Bodies.rectangle(tx,ty,10,19,{density:.001*sp.dms,friction:.3,collisionFilter:filter,label:'T0'});
  const head=Bodies.circle(tx,ty-15,8.5,{density:.0009*sp.dms,friction:.3,collisionFilter:filter,label:'H0'});
  const belt=mod.unbreakable?Math.min(.6,sp.belt+.3):sp.belt;
  const c1=Constraint.create({bodyA:chassis,pointA:seat,bodyB:torso,pointB:{x:0,y:8},stiffness:belt,damping:.05,length:2});
  const c2=Constraint.create({bodyA:chassis,pointA:{x:seat.x+14,y:seat.y+6},bodyB:torso,pointB:{x:4,y:2},stiffness:belt*.7,damping:.05,length:4});
  const c3=Constraint.create({bodyA:torso,pointA:{x:0,y:-9},bodyB:head,pointB:{x:0,y:5},stiffness:.5,damping:.1,length:2});
  Composite.add(world,[torso,head,c1,c2,c3]);
  m.driver={torso,head,seat,cons:[c1,c2],neck:c3,ejected:false};
  return m;
}
