'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function js(file,key){const s=fs.readFileSync(path.join(__dirname,'..',file),'utf8').trim();return JSON.parse(s.replace(new RegExp('^window\\.'+key+'='),'').replace(/;$/,''));}
const D=js('data.js','APP_DATA'),F=js('current-facts.js','APP_CURRENT_FACTS');
test('CURRENT r36 single evaluation revision and counts',()=>{
 assert.equal(D.meta.revision,'2026-10-25-r36');
 assert.equal(D.meta.schemaVersion,'1.2');
 assert.equal(D.individuals.length,35);assert.equal(D.individuals.filter(p=>p.primaryPR!=null).length,30);
 assert.equal(D.inactiveIndividualIds.length,8);assert.equal(D.roles.length,33);
 assert.equal(D.coverageMatrix.length,47);assert.equal(D.speciesAssessments.length,63);
 assert.equal(D.speciesMaster.length,98);assert.equal(D.meta.sourceMeasurementCount,219);
});
test('no retired role or coverage holders',()=>{
 const ids=new Set(D.individuals.map(x=>x.id));
 for(const r of D.roles)for(const id of [r.incumbent,r.backup])if(id)assert.ok(ids.has(id),r.id+':'+id);
 for(const c of D.coverageMatrix)for(const val of [c.holder,c.backup])for(const id of String(val||'').match(/IND-\d{4}/g)||[])assert.ok(ids.has(id),c.id+':'+id);
});
test('5 missing PR values remain null and all current decisions have evidence',()=>{
 for(const id of ['IND-0030','IND-0032','IND-0041','IND-0042','IND-0043']){
   const p=D.individuals.find(x=>x.id===id);assert.ok(p);assert.equal(p.primaryPR,null);assert.equal(p.topPercent,null);
 }
 for(const p of D.individuals){assert.equal(p.currentDecisionDate,'2026-10-25');assert.ok(p.investmentWindow);assert.ok(p.roleFit);assert.ok(p.cookingContribution)}
});
test('provisional tiers are never silently formal',()=>{
 const find=(sk,rk)=>D.speciesAssessments.find(x=>x.speciesKey===sk&&x.roleKey===rk);
 for(const [sk,rk] of [['blastoise','milk_specialist'],['raichu','berry_electric']]){
  const a=find(sk,rk);assert.equal(a.grade,'S');assert.equal(a.status,'provisional');
 }
 for(const r of D.roles)for(const a of r.targetCandidates){assert.ok('status' in a);assert.ok('confidence' in a)}
});
test('Phase6 classes are explicitly provisional, physical upgrade not invented',()=>{
 const foods=D.coverageMatrix.filter(c=>c.domain==='食材');
 assert.equal(foods.length,19);
 assert.equal(foods.filter(c=>c.phase6FoodClass&&c.cookingEvidence==='P6_R23_PROVISIONAL').length,19);
 assert.equal(D.meta.cookingPhase6,'qualitative-adopted-quantitative-model-gap');
});
test('r35 measured numbers and levels survive r36 conversion',()=>{
 const old=new Map(F.individuals.map(x=>[x.id,x]));
 for(const p of D.individuals){const q=old.get(p.id);assert.ok(q);assert.equal(p.primaryPR,q.primaryPR);
 const key=m=>m.lv+'|'+m.metric+'|'+m.pr;
 assert.deepEqual(p.measurements.map(key).sort(),q.measurements.map(key).sort());}
});
test('live app has no legacy evaluation sidecars',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.ok(!html.includes('<script src="./current-facts.js'));
 assert.ok(!html.includes('<script src="./current-decisions.js'));
 assert.ok(html.includes('id="coverageList"'));
});

test('acceptance UI distinguishes individual unrated, PR unmeasured, provisional Tier and MODEL_GAP',()=>{
 const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.match(app,/q\|\|"未評価"/);
 assert.match(app,/PR未測定≠0/);
 assert.match(app,/function renderSpeciesAssessments\(/);
 assert.match(app,/model-gap-chip/);
 assert.ok(html.includes('id="speciesTierList"'));
 assert.ok(html.includes('id="speciesTierCount"'));
 assert.equal(D.speciesAssessments.filter(x=>x.status==='provisional').length,11);
 const oil=D.roles.find(x=>x.id==='ROLE-018');
 assert.match(oil.investmentGate,/MODEL_GAP/);
 const unmeasured=D.individuals.filter(x=>x.primaryPR==null);
 assert.equal(unmeasured.length,5);
 assert.equal(unmeasured.filter(x=>x.quality==null).length,3);
});
