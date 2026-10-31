'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function js(file,key){const s=fs.readFileSync(path.join(__dirname,'..',file),'utf8').trim();return JSON.parse(s.replace(new RegExp('^window\\.'+key+'='),'').replace(/;$/,''));}
const D=js('data.js','APP_DATA'),F=js('current-facts.js','APP_CURRENT_FACTS');
const manifestFiles={'2026-10-25-r36':'r36-public-manifest.json','2026-11-01-r37':'r37-public-manifest.json'};
assert.ok(manifestFiles[D.meta.revision],'unsupported CURRENT revision');
const M=JSON.parse(fs.readFileSync(path.join(__dirname,'..','config',manifestFiles[D.meta.revision]),'utf8'));
const oldProfile=D.meta.revision==='2026-10-25-r36'?{schema_version:'1.2',app_version:'0.20',model_version:'r36',decision_date:'2026-10-25'}:{};
const profile={...oldProfile,...M};
test('CURRENT approved single evaluation revision and exact counts',()=>{
 assert.equal(D.meta.revision,M.revision);
 assert.equal(D.meta.schemaVersion,profile.schema_version);
 assert.equal(D.meta.modelVersion,profile.model_version);
 assert.equal(D.meta.appVersion,profile.app_version);
 assert.equal(D.meta.sourceSha256,M.source_sha256);
 if(D.meta.revision==='2026-11-01-r37'){
   assert.equal(profile.seed_model_version,'seed-v1');
   assert.equal(D.meta.seedModelVersion,profile.seed_model_version);
   assert.equal(profile.game_data_version,'seed-effects-2026-11-01-v1');
   assert.equal(D.meta.gameDataVersion,profile.game_data_version);
 }
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
 for(const p of D.individuals){assert.equal(p.currentDecisionDate,profile.decision_date);assert.ok(p.investmentWindow);assert.ok(p.roleFit);assert.ok(p.cookingContribution)}
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
test('historic measured numbers and levels survive supported CURRENT conversion',()=>{
 const old=new Map(F.individuals.map(x=>[x.id,x]));
 for(const p of D.individuals){const q=old.get(p.id);assert.ok(q);assert.equal(p.primaryPR,q.primaryPR);
 const key=m=>m.lv+'|'+m.metric+'|'+m.pr;
 assert.deepEqual(p.measurements.map(key).sort(),q.measurements.map(key).sort());}
});
test('coverage views use enriched roles and current species identity is exported',()=>{
 for(const [key,type] of [['food','食材'],['berry','きのみ'],['skill','スキル']]){
   assert.deepEqual(D.coverage[key],D.roles.filter(r=>r.type===type));
 }
 assert.ok(D.individuals.every(p=>typeof p.currentSpeciesKey==='string'&&p.currentSpeciesKey));
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

test('all individuals expose resource investment gates and detail renderer includes them',()=>{
 const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
 assert.equal(D.individuals.filter(x=>x.resourceGate&&Object.keys(x.resourceGate).length).length,35);
 assert.match(app,/function resourceGateHtml\(/);
 assert.match(app,/資源投資ゲート/);
 for(const p of D.individuals){
   assert.ok(p.resourceGate);
   assert.ok(Object.prototype.hasOwnProperty.call(p.resourceGate,'universalCandy'));
 }
});
