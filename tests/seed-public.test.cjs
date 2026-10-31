"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const jsonp=(file,key)=>{const raw=read(file).trim();assert.ok(raw.startsWith(key+'=')&&raw.endsWith(';'));return JSON.parse(raw.slice(key.length+1,-1));};
const manifest=JSON.parse(read('config/r37-public-manifest.json'));
const appData=jsonp('data.js','window.APP_DATA');
const seedData=jsonp('seed-data.js','window.SEED_INVESTMENT_DATA');
const model=require('../seed-model.js'),rules=require('../seed-rules.js'),ui=require('../seed-ui.js');
const ctx={appData,seedData,model,rules};
const blobSha=file=>{const b=Buffer.from(read(file));return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');};

test('seed sidecar is exactly pinned to the same r37 source, model and effect-data revision',()=>{
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
test('all 35 active individuals are visible, archived ones excluded, known current facts preserved',()=>{
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
test('eight qualitative species candidates and only two provisional account candidates, with explicit provenance',()=>{
 assert.equal(seedData.speciesAssessments.length,manifest.seed_species_assessments);
 for(const a of seedData.speciesAssessments){
  assert.equal(a.status,'provisional');assert.equal(a.applicability,'conditional');
  assert.equal(a.benchmarkId,'seed-qualitative-v1');assert.ok(a.rationale&&a.conditions.length);
 }
 const ranked=seedData.individuals.filter(p=>p.accountAssessment.tier!==null);
 assert.equal(ranked.length,manifest.seed_account_provisional);
 assert.deepEqual(ranked.map(p=>p.id),['IND-0002','IND-0010']);
 for(const p of ranked){assert.equal(p.accountAssessment.status,'provisional');assert.equal(p.accountAssessment.tier,'A');}
 for(const p of seedData.individuals.filter(p=>!ranked.includes(p))) assert.equal(p.accountAssessment.status,'unassessed');
});
test('real r37 examples calculate only per-trigger cost and never become an investment recommendation',()=>{
 for(const [id,target,count,delta] of [['IND-0002',6,3,9],['IND-0010',7,4,5132]]){
  const view=ui.buildView(ctx,{individualId:id,targetSkillLevel:target});
  assert.equal(view.result.scenario.requiredSeeds,count);
  assert.equal(view.result.scenario.perTriggerDelta.delta,delta);
  assert.equal(view.result.recommendation.action,'needs_data');
  assert.equal(view.result.recommendation.approved,false);
  assert.equal(view.result.execution.canExecute,false);
  assert.equal(view.result.execution.stock.available,null);
  assert.match(ui.planHtml(view),/使用承認なし/);
 }
 for(const id of ['IND-0005','IND-0009','IND-0032','IND-0042']){
  const v=ui.buildView(ctx,{individualId:id,targetSkillLevel:6});
  assert.equal(v.result.scenario.requiredSeeds,null,id);
 }
});
test('stock remains a dated approximation and all 22 old proposals retain unknown timing',()=>{
 const stock=seedData.resources.mainSkillSeed;
 assert.equal(stock.value,null);assert.equal(stock.reportedValue,8);
 assert.equal(stock.certainty,'approx');assert.equal(stock.observedAt,'2026-09-28');
 assert.equal(seedData.scenarios.length,manifest.seed_legacy_scenarios);
 for(const s of seedData.scenarios){assert.equal(s.recommended,false);assert.equal(s.timing,null);assert.equal(s.status,'legacy_proposal');}
 assert.equal(ui.buildView(ctx,{}).targetSkillLevel,null);
});
test('production loads new modules before app and includes all in the new offline cache',()=>{
 const html=read('index.html'),sw=read('service-worker.js');
 for(const file of ['seed-rules.js','seed-model.js','seed-data.js','seed-ui.js']){
  assert.ok(html.includes('./'+file+'?v=0.21-r37'));
  assert.ok(html.indexOf('./'+file)<html.indexOf('./app.js'));
  assert.ok(sw.includes('"./'+file+'"'));
 }
 assert.match(sw,/pokemon-sleep-hub-v0\.21-r37/);
 assert.ok(html.includes('id="seedInvestmentPanel"'));
 assert.ok(html.includes('seed-ui.css?v=0.21-r37')&&sw.includes('./seed-ui.css'));
 assert.doesNotMatch(html,/<script src="\.\/current-(facts|decisions)/);
 const app=read('app.js');assert.match(app,/金種の検討上限/);assert.match(app,/使用推奨・必要個数・投入承認ではありません/);
});
test('stale sidecar never displays even otherwise valid copied tiers or counts',()=>{
 const copy=structuredClone(seedData);copy.meta.sourceRevision='2026-10-25-r36';
 const html=ui.planHtml(ui.buildView({...ctx,seedData:copy},{targetSkillLevel:6}));
 assert.match(html,/未評価/);assert.doesNotMatch(html,/Tier [SABC]|参考必要個数/);
});
