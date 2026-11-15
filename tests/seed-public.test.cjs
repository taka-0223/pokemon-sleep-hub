"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const jsonp=(file,key)=>{const raw=read(file).trim();assert.ok(raw.startsWith(key+'=')&&raw.endsWith(';'));return JSON.parse(raw.slice(key.length+1,-1));};
const manifest=JSON.parse(read('config/r41-public-manifest.json'));
const appData=jsonp('data.js','window.APP_DATA');
const seedData=jsonp('seed-data.js','window.SEED_INVESTMENT_DATA');
const model=require('../seed-model.js'),rules=require('../seed-rules.js'),ui=require('../seed-ui.js');
const ctx={appData,seedData,model,rules};
const blobSha=file=>{const b=Buffer.from(read(file));return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');};

test('seed sidecar is exactly pinned to the same r41 source, model and effect-data revision',()=>{
 assert.equal(blobSha('seed-data.js'),manifest.seed_data_blob_sha);
 assert.equal(blobSha('data.js'),manifest.data_blob_sha);
 assert.equal(seedData.meta.sourceRevision,manifest.revision);
 assert.equal(seedData.meta.sourceRevision,appData.meta.revision);
 assert.equal(seedData.meta.sourceSha256,manifest.source_sha256);
 assert.equal(seedData.meta.sourceSha256,appData.meta.sourceSha256);
 assert.equal(seedData.meta.modelVersion,manifest.seed_model_version);
 assert.equal(seedData.meta.gameDataVersion,manifest.game_data_version);
 assert.equal(seedData.meta.gameDataVersion,rules.DATA_VERSION);
 assert.equal(ui.validateData(ctx).valid,true);
});
test('all 45 active individuals are visible, archived ones excluded, known current facts preserved',()=>{
 assert.equal(seedData.individuals.length,manifest.individuals);
 assert.deepEqual(seedData.individuals.map(p=>p.id).sort(),appData.individuals.map(p=>p.id).sort());
 for(const p of seedData.individuals){
  assert.equal(p.active,true);
  const a=appData.individuals.find(x=>x.id===p.id);
  assert.equal(p.currentSpeciesKey,a.currentSpeciesKey);
  assert.equal(p.currentSkillLevel,a.mainSkillLv);
  assert.equal(ui.buildView(ctx,{individualId:p.id}).valid,true);
 }
 assert.ok(seedData.individuals.some(p=>p.id==='IND-0043'));
 for(const id of appData.inactiveIndividualIds) assert.ok(!seedData.individuals.some(p=>p.id===id));
});
test('eight qualitative species candidates and one provisional account candidate; Wigglytuff investment completed, with explicit provenance',()=>{
 assert.equal(seedData.speciesAssessments.length,manifest.seed_species_assessments);
 for(const a of seedData.speciesAssessments){
  assert.equal(a.status,'provisional');assert.equal(a.applicability,'conditional');
  assert.equal(a.benchmarkId,'seed-qualitative-v1');assert.ok(a.rationale&&a.conditions.length);
 }
 const ranked=seedData.individuals.filter(p=>p.accountAssessment.tier!==null);
 assert.equal(ranked.length,manifest.seed_account_provisional);
 assert.deepEqual(ranked.map(p=>p.id),['IND-0010']);
 const wiggly=seedData.individuals.find(p=>p.id==='IND-0002');assert.equal(wiggly.currentSkillLevel,6);
 assert.equal(wiggly.accountAssessment.tier,null);assert.equal(wiggly.accountAssessment.status,'validated');assert.equal(wiggly.accountAssessment.applicability,'not_applicable');
 for(const p of ranked){assert.equal(p.accountAssessment.status,'provisional');assert.equal(p.accountAssessment.tier,'A');}
 for(const p of seedData.individuals.filter(p=>!ranked.includes(p)&&p.id!=='IND-0002')) assert.equal(p.accountAssessment.status,'unassessed');
});
test('real r41 examples calculate only per-trigger cost and never become an investment recommendation',()=>{
 for(const [id,target,count,delta] of [['IND-0002',6,0,0],['IND-0010',7,4,5132]]){
  const view=ui.buildView(ctx,{individualId:id,targetSkillLevel:target});
  assert.equal(view.result.scenario.requiredSeeds,count);
  assert.equal(view.result.scenario.perTriggerDelta.delta,delta);
  assert.equal(view.result.recommendation.action,'needs_data');
  assert.equal(view.result.recommendation.approved,false);
  assert.equal(view.result.execution.canExecute,false);
  if(id==='IND-0002') assert.equal(view.result.execution.stock,null);
  else assert.equal(view.result.execution.stock.available,null);
  assert.match(ui.planHtml(view),/使用承認なし/);
 }
 for(const id of ['IND-0005','IND-0009','IND-0032','IND-0042']){
  const v=ui.buildView(ctx,{individualId:id,targetSkillLevel:6});
  assert.equal(v.result.scenario.requiredSeeds,null,id);
 }
});
test('stock remains a dated 2026-11-01 confirmation, not a live inventory authorization and all 22 old proposals retain unknown timing',()=>{
 const stock=seedData.resources.mainSkillSeed;
 assert.equal(stock.value,9);assert.equal(stock.reportedValue,9);
 assert.equal(stock.certainty,'confirmed');assert.equal(stock.observedAt,'2026-11-01');
 assert.equal(seedData.scenarios.length,manifest.seed_legacy_scenarios);
 for(const s of seedData.scenarios){assert.equal(s.recommended,false);assert.equal(s.timing,null);assert.equal(s.status,'legacy_proposal');}
 assert.equal(ui.buildView(ctx,{}).targetSkillLevel,null);
});
test('production loads new modules before app and includes all in the new offline cache',()=>{
 const html=read('index.html'),sw=read('service-worker.js');
 for(const file of ['seed-rules.js','seed-model.js','seed-data.js','seed-ui.js']){
  assert.ok(html.includes('./'+file+'?v=0.23-r41'));
  assert.ok(html.indexOf('./'+file)<html.indexOf('./app.js'));
  assert.ok(sw.includes('"./'+file+'"'));
 }
 assert.match(sw,/pokemon-sleep-hub-v0\.23-r41/);
 assert.ok(html.includes('id="seedInvestmentPanel"'));
 assert.ok(html.includes('seed-ui.css?v=0.23-r41')&&sw.includes('./seed-ui.css'));
 assert.doesNotMatch(html,/<script src="\.\/current-(facts|decisions)/);
 const app=read('app.js');assert.match(app,/金種の検討上限/);assert.match(app,/使用推奨・必要個数・投入承認ではありません/);
});
test('stale sidecar never displays even otherwise valid copied tiers or counts',()=>{
 const copy=structuredClone(seedData);copy.meta.sourceRevision='2026-10-25-r36';
 const html=ui.planHtml(ui.buildView({...ctx,seedData:copy},{targetSkillLevel:6}));
 assert.match(html,/未評価/);assert.doesNotMatch(html,/Tier [SABC]|参考必要個数/);
});

test('special Darkrai and new Stufful never inherit ordinary seed calculations',()=>{
 const dark=seedData.individuals.find(p=>p.id==='IND-0053'),stuff=seedData.individuals.find(p=>p.id==='IND-0054');
 assert.equal(dark.level,27);assert.equal(dark.currentSkillLevel,1);assert.equal(dark.mainSkillKey,null);
 assert.ok(dark.subskills.every(s=>s.name===null&&s.unlocked===false));
 assert.equal(stuff.mainSkillKey,null);assert.equal(stuff.accountAssessment.status,'unassessed');
 assert.equal(stuff.subskills[0].name,'おてつだいボーナス');
 assert.equal(seedData.individuals.length,45);
});
