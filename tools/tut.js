const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:1280,height:720}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js')),contentType:'application/javascript'}));
 await pg.route('**/fonts.googleapis.com/**',r=>r.abort());
 await pg.goto('file://'+path.join(__dirname,'index.html'));await pg.waitForTimeout(400);
 await pg.screenshot({path:'s_title.png'});
 await pg.click('#bNew');await pg.waitForTimeout(300);
 const run=async(label,maxT)=>pg.evaluate(([maxT])=>{
   const g=window.__game,{G,P,inside}=g;const log=[];let last=-1;
   G.botFn=(G,P,B,dt)=>{const I=G.in,T=G.tut;if(!T)return;const s=T.steps[T.i];
     if(T.i!==last){last=T.i;log.push(T.i+':'+s.t+' @'+Math.round(G.time))}
     const pf=I.fire;I.block=false;I.dodge=false;I.fire=false;I.ads=false;I.x=0;I.z=0;I.pot=false;I.g1=I.g2=false;
     const dx=B.x-P.x,dz=B.z-P.z,d=Math.hypot(dx,dz)||1;
     const aim=part=>{let sp=null;for(const q of G.sph)if(q.part===part)sp=q;if(sp)G.aimAt={x:sp.x,y:sp.y,z:sp.z};return sp};
     I.fin=false;if(s.t==='이동과 시점'){I.x=dx/d;I.z=dz/d}
     else if(s.t==='사격'){if(d>14){I.x=dx/d;I.z=dz/d}else{aim('head');I.ads=true;I.fire=!pf&&P.ammo>0&&P.fireCd<=0&&P.aimT>1}}
     else if(s.t==='약점은 열릴 때만'){const c=aim('core');if(!c)aim('body');I.ads=true;I.fire=!!c&&!pf&&P.ammo>0&&P.fireCd<=0&&P.aimT>1.2}
     else if(s.t==='산탄총: 밀어붙이기'){I.swap=1;if(d>7){I.x=dx/d;I.z=dz/d}aim('legs');I.fire=!pf&&P.ammo>0&&P.fireCd<=0&&d<8&&P.w===1}
     else if(s.t==='연발 석궁: 표식 폭발'){I.swap=2;aim('head');I.fire=P.w===2;if(d>16){I.x=dx/d;I.z=dz/d}}
     else if(s.t==='갑각'){aim('head');I.ads=true;I.fire=!pf&&P.ammo>0&&P.fireCd<=0&&P.aimT>.6}
     else if(s.t==='체간과 결정타'){aim('head');I.fin=!!B.broke}
     else if(s.t==='필살기'){const c=aim('core');if(!c)aim('head');I.fin=g.finOpen()&&P.fin>=100}
     else if(s.atk){const left=B.dur-B.stateT;
       if(s.need==='block'){I.block=B.state==='windup'&&left<.5||B.state==='strike'}
       else if(s.need==='parry'){I.block=B.state==='windup'&&left<.1}
       else if(s.need==='dodge'){if(B.state==='windup'&&left<.14)I.dodge=true}
       else if(s.need==='cue'){I.ads=true;const c=g.cue.m;if(B.state==='windup'&&g.cue.on){G.aimAt={x:c.position.x,y:c.position.y,z:c.position.z};I.fire=!pf&&P.ammo>0&&P.fireCd<=0&&left>.2}else aim('head')}
       else if(s.need==='core'){const c=aim('core');I.ads=true;I.fire=!!c&&!pf&&P.ammo>0&&P.fireCd<=0;if(B.state==='windup'&&left<.14){if(g.ATK[B.atk.replace(/[~!]$/,'')].noRoll)I.block=true;else I.dodge=true}if(B.state==='strike'&&B.linger)I.block=true}
       else if(s.need==='cover'){const c=G.covers[0];if(c){const ux=c.x-B.x,uz=c.z-B.z,ul=Math.hypot(ux,uz),tx=c.x+ux/ul*(c.r+1.2),tz=c.z+uz/ul*(c.r+1.2),mx=tx-P.x,mz=tz-P.z,ml=Math.hypot(mx,mz);if(ml>.4){I.x=mx/ml;I.z=mz/ml}}}
       else{if(B.state==='windup'&&left<.14){if(g.ATK[B.atk].noRoll)I.block=true;else I.dodge=true}if(B.state==='strike'&&B.linger)I.block=true;if(B.state==='strike'&&B.atk==='charge'&&d<9)I.dodge=true}}
     else if(s.t==='쫄몹'){const m=G.mobs.find(m=>m.state!=='dead');if(m){G.aimAt={x:m.x,y:m.D.hy,z:m.z};I.fire=!pf&&P.ammo>0&&P.fireCd<=0}}
     else if(s.t==='장비 스킬'){G.aimAt={x:B.x,y:1,z:B.z};I.g1=true;I.g2=T.t>1}
     else if(s.t==='물약'){I.pot=true}
   };
   let t=0;while(t<maxT&&G.state==='hunt'&&G.tut){g.simulate(1);t++}
   return {state:G.state,tut:!!G.tut,i:G.tut&&G.tut.i,log,t,trained:g.S.trained,prac:g.S.prac,hp:P.hp};
 },[maxT]);
 console.log('train',JSON.stringify(await run('train',200)));
 await pg.waitForTimeout(300);await pg.screenshot({path:'s_town.png'});
 for(const st of [0,1,2,3,4]){
  await pg.evaluate(st=>{const g=window.__game;g.G.hunt=st;g.showIntro()},st);
  if(st===2)await pg.screenshot({path:'s_intro.png'});
  await pg.click('#bGo');
  const r=await run('prac',120);
  const after=await pg.evaluate(()=>{const g=window.__game;return {state:g.G.state,tut:!!g.G.tut,beast:g.B.h.name,hp:g.B.hp,mobT:g.G.mobT}});
  console.log('prac',st,JSON.stringify(r),JSON.stringify(after));
  await pg.evaluate(()=>window.__game.goTown());
 }
 console.log('errors',errs.slice(0,5));await b.close();
})();
