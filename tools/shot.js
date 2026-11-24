const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:1280,height:720}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js')),contentType:'application/javascript'}));
 await pg.route('**/fonts.googleapis.com/**',r=>r.abort());
 await pg.goto('file://'+path.join(__dirname,'index.html'));await pg.waitForTimeout(400);
 await pg.evaluate(()=>{const g=window.__game;g.newGame(Number(location.hash.slice(1))||0);g.showIntro();g.startHunt();g.G.lock=false;
   g.G.botFn=(G,P,B)=>{G.in.ads=false;G.in.fire=true;G.in.x=0;G.in.z=0};g.simulate(1.0);g.G.botFn=null});
 await pg.waitForTimeout(300);await pg.screenshot({path:'shot2.png'});
 // lock-on + ADS-ish closer
 await pg.evaluate(()=>{const g=window.__game;g.P.z=10;g.G.lock=true;g.G.lockIdx=1;g.G.botFn=(G,P,B)=>{G.in.fire=true};g.simulate(1.5);g.G.botFn=null});
 await pg.waitForTimeout(300);await pg.screenshot({path:'shot3.png'});
 console.log(errs);await b.close();
})();
