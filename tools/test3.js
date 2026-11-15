// 봇 시험: 무기별(WI=0 단발 사냥총, 1 산탄총, 2 연발 석궁) 다섯 사냥터 클리어 여부
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const WI=+(process.env.WI||0),mode=process.argv[2]||'rhythm',stages=(process.argv[3]||'0,1,2,3,4').split(',').map(Number),NOMOB=process.env.NOMOB==='1',NOGAD=process.env.NOGAD==='1',NOFIN=process.env.NOFIN==='1',FILE=process.env.FILE||'index.html';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:1280,height:720}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js')),contentType:'application/javascript'}));
 await pg.route('**/fonts.googleapis.com/**',r=>r.abort());
 await pg.goto('file://'+path.join(__dirname,FILE));
 await pg.waitForTimeout(500);
 for(const st of stages){
  const res=await pg.evaluate(([st,mode,WI,NOMOB,NOGAD,NOFIN])=>{
   const g=window.__game,{G,P,inside}=g,AR=g.AR;
   g.newGame(st);g.S.hunts=st;g.S.cleared=st;g.S.weps=['rifle'];g.S.reward=null;g.S.perks=['atk','hp','fin','pot'].slice(0,st);g.S.lastW=WI;
   G.hunt=st;g.showIntro();g.startHunt();if(NOMOB)G.mobT=1e9;
   const stat={fin:0,finDmg:0,dmgIn:0,st:{}};let lastHp=P.hp,lastB=0,wasFin=false;
   G.botFn=(G,P,B,dt)=>{
    const I=G.in;I.block=false;I.dodge=false;I.pot=false;I.g1=I.g2=false;I.fin=false;I.reload=false;
    stat.st[B.state]=(stat.st[B.state]||0)+dt;if(P.hp<lastHp)stat.dmgIn+=lastHp-P.hp;lastHp=P.hp;
    if(P.finA&&!wasFin){stat.fin++;lastB=B.hp}if(!P.finA&&wasFin)stat.finDmg+=lastB-B.hp;wasFin=!!P.finA;
    const open=g.finOpen(),W=g.WEP[P.w];
    let tsp=null;for(const q of G.sph){if(q.part==='core'){tsp=q;break}if(q.part==='head')tsp=q}
    let mob=null,md=1e9;for(const m of G.mobs){if(m.state==='dead'||m.state==='spawn')continue;const d=Math.hypot(m.x-P.x,m.z-P.z);if(d<md){md=d;mob=m}}
    if(mob&&md>[32,9,26][WI])mob=null;
    const left=B.state==='windup'?B.dur-B.stateT:9,cueOn=WI===0&&B.state==='windup'&&g.cue.m.visible&&left>.35&&!mob;
    const jit=WI===0?.7:1.2;
    G.aimAt=mob?{x:mob.x+(Math.random()-.5)*.6,y:mob.D.hy+(Math.random()-.5)*.5,z:mob.z+(Math.random()-.5)*.6}
      :cueOn?{x:g.cue.m.position.x+(Math.random()-.5)*.8,y:g.cue.m.position.y+(Math.random()-.5)*.8,z:g.cue.m.position.z+(Math.random()-.5)*.8}
      :tsp?{x:tsp.x+(Math.random()-.5)*jit,y:tsp.y+(Math.random()-.5)*jit,z:tsp.z+(Math.random()-.5)*jit}:null;
    const dx=P.x-B.x,dz=P.z-B.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
    if(mode==='lazy'){I.x=0;I.z=0}else{
     const want=[13,5.5,11][WI],rad=d<want-1.5?1:d>want+2.5?-1:0,tan=WI===0?.25:.7;I.x=ux*rad-uz*tan;I.z=uz*rad+ux*tan;
     const r=Math.hypot(P.x,P.z);if(r>AR-8){I.x-=P.x/r*1.2;I.z-=P.z/r*1.2}}
    I.ads=WI===0||(WI===2&&d>16);
    const canShoot=P.fireCd<=0&&P.ammo>0;
    let fire=canShoot;
    if(!mob){
     if(WI===0){ // 단발 사냥총: 쉬는 틈과 공격 준비 중의 예고 부위
      fire=fire&&P.aimT>1.1&&(['rest','topple','stun','flinch'].includes(B.state)||cueOn||(B.state==='chase'&&B.think>.6));}
     else if(WI===1){fire=fire&&d<8&&left>.3}
     else{fire=fire&&d<22&&left>.25}
    }else if(left<.4)fire=false;
    if(mode==='lazy')fire=canShoot;
    I.fire=W.auto?fire:(fire&&!I.fire);
    if(P.ammo===0&&P.reload<=0)I.reload=true;
    if(!NOFIN&&P.fin>=100&&open&&!P.finA&&B.dur-B.stateT>.2)I.fin=true;
    if(mode!=='lazy'){
     if(P.hp<P.maxHp*.45&&P.potions>0&&B.state!=='windup')I.pot=true;
     if(!NOGAD){if(P.gcd[0]<=0&&(mob||['rest','topple','stun','flinch'].includes(B.state)))I.g1=true;if(P.gcd[1]<=0&&B.state==='windup'&&d<14)I.g2=true}
     if(mode!=='kite'){
      for(const z of G.hazards){if(inside(z.s,P.x,P.z,.8)&&z.total-z.t<.45){const hx=P.x-z.s.x,hz=P.z-z.s.z,hl=Math.hypot(hx,hz)||1;I.x=hx/hl;I.z=hz/hl;I.dodge=true}}
      if(B.state==='windup'){const A=g.ATK[B.atk];const danger=B.shape?inside(B.shape,P.x,P.z,1.2):d<10;
       if(danger&&left<.3)I.fire=false;
       if(danger&&left<.14){if(A.noRoll||(WI!==1&&Math.random()<.5))I.block=true;else I.dodge=true}}
      if(B.state==='strike'&&B.linger&&inside(B.linger.s,P.x,P.z,1))I.block=true;
      if(B.state==='strike'&&B.atk==='charge'&&d<9)I.dodge=true;
      for(const o of G.shots){const od=Math.hypot(o.x-P.x,o.z-P.z),ov=Math.hypot(o.vx,o.vz);if(od/ov<.18){I.x=-o.vz/ov;I.z=o.vx/ov;if(Math.random()<.5)I.block=true;else I.dodge=true}}
      for(const m of G.mobs){if(m.state==='wind'&&m.t>.5&&Math.hypot(m.x-P.x,m.z-P.z)<5)I.block=true;if(m.state==='aim'&&m.t>1.0)I.block=true}}
    }
   };
   let t=0;const T=600;
   while(t<T&&G.state==='hunt'){g.simulate(5);t+=5}
   const B=g.B;
   return {st,w:g.WEP[WI].id,state:G.state,huntT:Math.round(G.huntT),hpPct:Math.round(B.hp/B.maxHp*100),breaks:G.huntBreaks,parries:G.parries,myHp:Math.round(P.hp)+'/'+P.maxHp,pots:P.potions,mobKills:G.mobKills,fin:stat.fin,finAvg:stat.fin?Math.round(stat.finDmg/stat.fin):0,dmgIn:Math.round(stat.dmgIn),states:Object.fromEntries(Object.entries(stat.st).map(([k,v])=>[k,Math.round(v)]))};
  },[st,mode,WI,NOMOB,NOGAD,NOFIN]);
  console.log(JSON.stringify(res));
 }
 console.log('errors:',errs.slice(0,5));
 await b.close();
})();
