const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const WI=+(process.env.WI||0),mode=process.argv[2]||'rhythm',stages=(process.argv[3]||'0,1,2,3,4').split(',').map(Number),GROW=process.env.GROW!=='0',NOMOB=process.env.NOMOB==='1',NOGAD=process.env.NOGAD==='1',FILE=process.env.FILE||'index.html';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:1280,height:720}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js')),contentType:'application/javascript'}));
 await pg.route('**/fonts.googleapis.com/**',r=>r.abort());
 await pg.goto('file://'+path.join(__dirname,FILE));
 await pg.waitForTimeout(500);
 for(const st of stages){
  const res=await pg.evaluate(([st,mode,WI,GROW,NOMOB,NOGAD])=>{
   const g=window.__game,{G,P,inside}=g,AR=g.AR||34;
   g.newGame(st);if(GROW){g.S.hunts=st;g.S.cleared=st}G.hunt=st;g.showIntro();g.startHunt();if(NOMOB)G.mobT=1e9;
   G.botFn=(G,P,B,dt)=>{
    const I=G.in;if(P.w!==WI)I.swap=WI;I.block=false;I.dodge=false;I.skill=false;I.pot=false;I.g1=I.g2=false;
    G.lock=false;G.lockIdx=B.m.core.visible?1:0;const tsp=g.lockSphere();
    let mob=null,md=1e9;for(const m of (G.mobs||[])){if(m.state==='dead'||m.state==='spawn')continue;const d=Math.hypot(m.x-P.x,m.z-P.z);if(d<md){md=d;mob=m}}
    if(mob&&md>(WI?9:32))mob=null;
    G.aimAt=mob?{x:mob.x+(Math.random()-.5)*.6,y:mob.D.hy+(Math.random()-.5)*.5,z:mob.z+(Math.random()-.5)*.6}:tsp?{x:tsp.x+(Math.random()-.5)*1.2,y:tsp.y+(Math.random()-.5)*1.2,z:tsp.z+(Math.random()-.5)*1.2}:null;
    const dx=P.x-B.x,dz=P.z-B.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
    if(mode==='lazy'){I.x=0;I.z=0}else{
     const want=WI?6:13,rad=d<want-2?1:d>want+3?-1:0;I.x=ux*rad-uz*.7;I.z=uz*rad+ux*.7;
     const r=Math.hypot(P.x,P.z);if(r>AR-8){I.x-=P.x/r*1.2;I.z-=P.z/r*1.2}}
    I.ads=mode!=='lazy'&&P.aimT<1.3?true:I.ads;I.fire=P.fireCd<=0&&!I.fire;
    if(!mob){if(mode==='rhythm'&&!['rest','topple','stun','flinch','chase','link'].includes(B.state))I.fire=false;if(mode==='rhythm'&&B.state==='chase'&&B.think<.6)I.fire=false;if(mode==='rhythm'&&P.aimT<.8&&!WI)I.fire=false}
    else if(B.state==='windup'&&B.dur-B.stateT<.5)I.fire=false;
    if(P.ammo===0)I.reload=true;
    if(mode!=='lazy'){
     if(P.hp<P.maxHp*.45&&P.potions>0&&!(B.state==='windup'))I.pot=true;
     if(!NOGAD&&P.gcd){if(P.gcd[0]<=0&&(mob||['rest','topple','stun','flinch'].includes(B.state)))I.g1=true;if(P.gcd[1]<=0&&B.state==='windup'&&d<14)I.g2=true}
     if(mode!=='kite'){for(const z of G.hazards){if(inside(z.s,P.x,P.z,.8)&&z.total-z.t<.45){const hx=P.x-z.s.x,hz=P.z-z.s.z,hl=Math.hypot(hx,hz)||1;I.x=hx/hl;I.z=hz/hl;I.dodge=true}}
     if(B.state==='windup'){const left=B.dur-B.stateT,A=g.ATK[B.atk];const danger=B.shape?inside(B.shape,P.x,P.z,1.2):d<10;
      if(danger&&left<.14){if(A.noRoll||mode==='parry'||Math.random()<.5)I.block=true;else I.dodge=true}}
     if(B.state==='strike'&&B.linger&&inside(B.linger.s,P.x,P.z,1))I.block=true;
     if(B.state==='strike'&&B.atk==='charge'&&d<9){I.dodge=true}
     for(const o of G.shots){const od=Math.hypot(o.x-P.x,o.z-P.z),ov=Math.hypot(o.vx,o.vz);if(od/ov<.18){I.x=-o.vz/ov;I.z=o.vx/ov;if(Math.random()<.5)I.block=true;else I.dodge=true}}
     for(const m of (G.mobs||[])){if(m.state==='wind'&&m.t>.5&&Math.hypot(m.x-P.x,m.z-P.z)<5)I.block=true;if(m.state==='aim'&&m.t>1.0)I.block=true}}
    }
   };
   let t=0;const T=600;
   while(t<T&&G.state==='hunt'){g.simulate(5);t+=5}
   const B=g.B;
   return {st,state:G.state,huntT:Math.round(G.huntT),hpPct:Math.round(B.hp/B.maxHp*100),breaks:G.huntBreaks,parries:G.parries,myHp:Math.round(P.hp)+'/'+P.maxHp,pots:P.potions,mobKills:G.mobKills,covers:G.covers&&G.covers.length};
  },[st,mode,WI,GROW,NOMOB,NOGAD]);
  console.log(JSON.stringify(res));
 }
 console.log('errors:',errs.slice(0,5));
 await b.close();
})();
