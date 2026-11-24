// 걷기, 제자리 회전, 공격과 회복 동작을 GIF용 프레임으로 저장. 사용: ST=0 OUT=frames node motion.js
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const ST=+(process.env.ST||0),OUT=process.env.OUT||'frames',FILE=process.env.FILE||'index.html',ATKS=(process.env.ATKS||'clawL,bite').split(',');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:560,height:360}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.requestAnimationFrame=cb=>{window.__raf=cb;return 1}});
 await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js')),contentType:'application/javascript'}));
 await pg.route('**/fonts.googleapis.com/**',r=>r.abort());
 await pg.goto('file://'+path.join(__dirname,FILE));await pg.waitForTimeout(500);
 fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT);
 await pg.evaluate(st=>{const g=window.__game,{G,P}=g;g.newGame(st);g.S.trained=true;g.S.weps=['rifle'];g.S.rq=[];g.S.prac=[1,1,1,1,1];G.hunt=st;g.startHunt();G.mobT=1e9;
   G.covers.forEach(c=>c.g.visible=false);G.covers.length=0;const B=g.B;B.x=-9;B.z=0;B.hd=Math.PI/2;P.x=30;P.z=0;window.__T=0;window.__q=[];
   G.botFn=(G,P,B,dt)=>{const T=window.__T+=dt;G.in.x=G.in.z=0;P.inv=9;
     if(T<3.2){P.x=B.x+30;P.z=0;B.think=9}                                   // 걷기
     else if(T<7){const a=Math.PI/2+(T-3.2)*1.5;P.x=B.x+Math.sin(a)*4;P.z=B.z+Math.cos(a)*4;B.think=9}   // 제자리 회전
     else{if(!window.__f){window.__f=1;P.x=B.x+Math.sin(B.hd)*7;P.z=B.z+Math.cos(B.hd)*7;B.combo=window.__atks;B.ci=0;B.state='link';B.stateT=0;B.dur=.3}}}},ST);
 await pg.evaluate(a=>{window.__atks=a},ATKS);
 let n=0;
 for(let i=0;i<15*13;i++){
  const r=await pg.evaluate(()=>{const g=window.__game,B=g.B,c=g.camera;g.simulate(1/30);g.simulate(1/30);
    if(window.__f&&(B.state==='chase')&&window.__T>9)window.__done=(window.__done||0)+1;
    const s=B.h.size;c.position.set(B.x+2*s,3.2*s,B.z+13*s);c.fov=45;c.aspect=560/360;c.updateProjectionMatrix();c.lookAt(B.x,1.9*s,B.z);
    g.renderer.setSize(560,360,false);g.renderer.render(g.scene,c);return [document.querySelector('#c').toDataURL('image/jpeg',.9),window.__done||0,B.state]});
  fs.writeFileSync(path.join(OUT,String(n++).padStart(4,'0')+'.jpg'),Buffer.from(r[0].split(',')[1],'base64'));
  if(r[1]>12)break;
 }
 console.log('frames',n,'errors',errs.slice(0,3));await b.close();
})();
