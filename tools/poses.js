const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const ST=+(process.env.ST||0),OUT=process.env.OUT||'poses.png',MODE=process.env.MODE||'peak',FILE=process.env.FILE||'index.html',COLS=+(process.env.COLS||5);
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:640,height:440}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.requestAnimationFrame=cb=>{window.__raf=cb;return 1}});
 await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js')),contentType:'application/javascript'}));
 await pg.route('**/fonts.googleapis.com/**',r=>r.abort());
 await pg.goto('file://'+path.join(__dirname,FILE));await pg.waitForTimeout(500);
 const atks=await pg.evaluate(()=>Object.keys(window.__game.ATK));
 const shots=[];
 const cases=MODE==='mods'?(process.env.CASES||'clawL:hold,clawL:peak,clawL~:hold,clawL~:relax,clawL~:peak,clawL!:mid,clawL!:peak').split(',').map(c=>c.split(':')):atks.map(a=>[a,MODE]);
 for(const [raw,when] of cases){
  const info=await pg.evaluate(([st,raw,when])=>{const g=window.__game,{G,P}=g;g.newGame(st);g.S.trained=true;g.S.weps=['rifle'];g.S.rq=[];g.S.prac=[1,1,1,1,1];G.hunt=st;g.startHunt();G.botFn=()=>{};G.mobT=1e9;
    G.covers.forEach(c=>c.g.visible=false);G.covers.length=0;
    const B=g.B;B.x=0;B.z=0;B.hd=0;P.x=3.5;P.z=11;g.simulate(.3);B.x=0;B.z=0;B.hd=Math.atan2(P.x,P.z);B.combo=[raw];B.ci=0;B.state='link';B.stateT=0;B.dur=0;g.simulate(1/60);
    const tgt=when==='peak'?B.dur-.02:when==='relax'?B.dur*.61:when==='mid'?B.dur*.5:B.dur*.45;let n=0;while(B.state==='windup'&&B.stateT<tgt&&n++<600)g.simulate(1/60);
    const c=g.camera,ux=Math.sin(B.hd),uz=Math.cos(B.hd);const s=B.h.size,D=10.5*s;
    // 사냥꾼 눈높이, 거수 정면에서 살짝 옆
    c.position.set(B.x+ux*D-uz*2.5,2.4,B.z+uz*D+ux*2.5);c.fov=52;c.aspect=640/440;c.updateProjectionMatrix();c.lookAt(B.x,2.6*s+B.y*.5,B.z);
    g.scene.traverse(o=>{});g.renderer.setSize(640,440,false);g.renderer.render(g.scene,c);
    return {st:B.state,t:+B.stateT.toFixed(2),dur:+B.dur.toFixed(2),name:g.AT(B.mv||B.atk).n+(B.mod||''),img:document.querySelector('#c').toDataURL('image/jpeg',.85)}},[ST,raw,when]);
  shots.push({raw,when,info});
 }
 const lab={hold:'자세 잡은 뒤',peak:'공격 직전',relax:'힘을 푼 순간',mid:'중간'};
 const html=`<body style="margin:0;background:#111;font:15px sans-serif;color:#fff"><div style="display:grid;grid-template-columns:repeat(${COLS},400px);gap:4px;padding:4px">`+shots.map(s=>`<div style="position:relative"><img src="${s.info.img}" width=400 style="display:block"><div style="position:absolute;left:4px;top:3px;background:#000b;padding:2px 6px;border-radius:3px">${s.info.name}${MODE==='mods'?' · '+lab[s.when]+' ('+s.info.t+'초/'+s.info.dur+'초)':''}</div></div>`).join('')+'</div></body>';
 const p2=await b.newPage({viewport:{width:COLS*404+4,height:400}});await p2.setContent(html);await p2.screenshot({path:OUT,fullPage:true});
 console.log(shots.map(s=>s.raw+':'+s.info.st+' '+s.info.t+'/'+s.info.dur).join(' | '));console.log('errors',errs.slice(0,3));await b.close();
})();
