'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { applyFacts, FIELDS, DECISIONS } = require('../current-facts-merge.js');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../current-facts.js'),'utf8'),sandbox);
const facts=JSON.parse(JSON.stringify(sandbox.window.APP_CURRENT_FACTS));
const publicSandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data.js'),'utf8'),publicSandbox);
const published=JSON.parse(JSON.stringify(publicSandbox.window.APP_DATA));
function legacy() {
  return {
    meta:{revision:'2026-10-15-r23',schemaVersion:'1.1',appVersion:'0.19'},
    individuals:published.individuals.map((x,i)=>({
      ...x,name:'旧表記'+i,level:1,priority: i+1,quality:'S',disposition:'育成',
      roleId:'ROLE-001',roleKey:'healer',roleName:'旧ヒーラー',roleType:'スキル',
      speciesGrade:'S',refinement:'終了',rationale:'旧公開評価',targetLevel:50,
      roleNeed:'充足',searchStatus:'停止',rolePriority:'高',
      primaryPR:null,measurements:[],
    })),
    roles:[{id:'ROLE-001',targetCandidates:[{speciesKey:'gardevoir',grade:'S'}]}],
    resources:{oldResource:{value:1}},coverageMatrix:facts.coverageMatrix.map(x=>({...x,status:'旧状態'})),
    coverage:{},events:[]
  };
}
function clone(x) {return JSON.parse(JSON.stringify(x));}

test('source payload is only immutable facts, no disputed grades, priorities or decisions',()=>{
  assert.equal(facts.meta.sourceRevision,'2026-10-23-r35');
  assert.equal(facts.meta.mode,'facts-only-provisional');
  assert.equal(facts.individuals.length,35);
  assert.equal(facts.individuals.filter(x=>x.primaryPR!==null).length,30);
  assert.equal(facts.meta.sourceIndividualCount,43);
  assert.deepEqual(facts.inactiveIndividualIds,[
    'IND-0011','IND-0014','IND-0029','IND-0033',
    'IND-0036','IND-0038','IND-0039','IND-0040'
  ]);
  assert.equal(Object.keys(facts.resources).length,18);
  assert.equal(facts.coverageMatrix.length,47);
  assert.equal(facts.individuals.find(x=>x.id==='IND-0016').shiny,true);
  assert.equal(facts.individuals.find(x=>x.id==='IND-0043').shiny,null);
  for(const f of facts.individuals){
    assert.deepEqual(Object.keys(f).sort(),[...FIELDS].sort());
    for(const key of DECISIONS)assert.equal(Object.prototype.hasOwnProperty.call(f,key),false);
  }
  assert.equal(Object.prototype.hasOwnProperty.call(facts,'roles'),false);
});

test('merge 38 published individuals into 35 active r35 facts with exact 30 PR',()=>{
  const old=legacy(); const merged=applyFacts(old,facts);
  assert.equal(merged.individuals.length,35);
  assert.equal(merged.individuals.filter(x=>x.primaryPR!==null).length,30);
  assert.equal(merged.meta.revision,'2026-10-15-r23');
  assert.equal(merged.meta.currentFactsRevision,'2026-10-23-r35');
  assert.equal(merged.meta.inactiveFactsCount,8);
  assert.equal(merged.individuals[0].name,facts.individuals[0].name);
  assert.equal(merged.individuals[0].level,facts.individuals[0].level);
  assert.equal(merged.individuals[0].priority,1);
  assert.equal(merged.individuals[0].speciesGrade,'S');
  assert.equal(merged.individuals[0].rationale,'旧公開評価');
  assert.equal(merged.individuals[0].decisionSnapshot,'2026-10-15-r23');
  const added=merged.individuals.find(x=>x.id==='IND-0043');
  assert.equal(added.decisionSnapshot,null);
  assert.equal(added.quality,null);
  assert.equal(added.priority,null);
  assert.equal(added.speciesGrade,null);
  assert.equal(merged.individuals.find(x=>x.id==='IND-0016').shiny,true);
  assert.deepEqual(merged.roles,old.roles);
  assert.deepEqual(old.individuals[0].measurements,[]);
});

test('confirmed, unknown, approximate and inferred resource quantities retain provenance',()=>{
  const merged=applyFacts(legacy(),facts);
  assert.equal(merged.resources.main_skill_seed.value,null);
  assert.equal(merged.resources.main_skill_seed.certainty,'approx');
  assert.equal(merged.resources.larvitar_candy.value,null);
  assert.equal(merged.resources.paldean_wooper_candy.value,null);
  assert.equal(merged.resources.larvitar_candy.certainty,'unknown');
  const inferred=Object.values(merged.resources).filter(x=>['inferred','approx'].includes(x.certainty));
  assert.ok(inferred.length>=1);
  assert.ok(inferred.every(x=>x.value==null));
});

test('candidate and decision field injection never overrides legacy state',()=>{
  const old=legacy();const changed=clone(facts);
  changed.individuals[0].speciesGrade='Z';
  changed.individuals[0].priority=0;
  changed.individuals[0].quality='Z';
  changed.roles=[{id:'ROLE-001',targetCandidates:[]}];
  const result=applyFacts(old,changed);
  assert.equal(result.individuals[0].speciesGrade,'S');
  assert.equal(result.individuals[0].priority,1);
  assert.equal(result.individuals[0].quality,'S');
  assert.deepEqual(result.roles,old.roles);
});

test('rejects mismatched legacy revision',()=>{
  const wrong=legacy();wrong.meta.revision='2026-10-21-r33';
  assert.throws(()=>applyFacts(wrong,facts),/revision/);
});

test('rejects missing former ID, duplicate current ID, and wrong counters',()=>{
  const lost=clone(facts);lost.individuals=lost.individuals.slice(1);
  lost.meta.individualCount=34;lost.meta.sourceIndividualCount=42;
  assert.throws(()=>applyFacts(legacy(),lost),/処遇記録のない/);
  const dupe=clone(facts);dupe.individuals[34].id=dupe.individuals[0].id;
  assert.throws(()=>applyFacts(legacy(),dupe),/不整合/);
  const count=clone(facts);count.meta.prMeasuredCount=0;
  assert.throws(()=>applyFacts(legacy(),count),/PR測定済み/);
});

test('retirement requires an explicit unique tombstone and never overlaps active IDs',()=>{
  const missing=clone(facts);
  missing.inactiveIndividualIds=missing.inactiveIndividualIds.filter(id=>id!=='IND-0011');
  missing.meta.sourceIndividualCount=42;
  assert.throws(()=>applyFacts(legacy(),missing),/処遇記録のない/);
  const overlap=clone(facts);
  overlap.inactiveIndividualIds.push('IND-0016');
  overlap.meta.sourceIndividualCount=44;
  assert.throws(()=>applyFacts(legacy(),overlap),/非アクティブ/);
  const dupe=clone(facts);
  dupe.inactiveIndividualIds.push('IND-0011');
  dupe.meta.sourceIndividualCount=44;
  assert.throws(()=>applyFacts(legacy(),dupe),/非アクティブ/);
});

test('reject invalid PR and invalid Coverage',()=>{
  const over=clone(facts);over.individuals[0].primaryPR=150;
  assert.throws(()=>applyFacts(legacy(),over),/PR/);
  const loss=clone(facts);loss.coverageMatrix=loss.coverageMatrix.slice(1);
  assert.throws(()=>applyFacts(legacy(),loss),/Coverage/);
});

test('browser without new sidecar safely falls back to its old snapshot',()=>{
  const base=legacy();const ctx={window:{APP_DATA:base}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../current-facts-merge.js'),'utf8'),ctx);
  assert.equal(ctx.window.APP_FACTS_STATUS.applied,false);
  assert.strictEqual(ctx.window.APP_DATA,base);
});

test('sidecar generation is deterministic and excludes original workbook',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../current-facts.js'),'utf8');
  assert.ok(js.startsWith('window.APP_CURRENT_FACTS='));
  assert.equal(js.includes('M_SpeciesAssessment'),false);
  assert.equal(js.includes('pokemon_sleep_decision_system_CURRENT_r35.xlsx'),false);
});

test('real published r23 snapshot preserves the 32 survivors and retires six historical IDs',()=>{
  const original=clone(published);
  const updated=applyFacts(original,facts);
  assert.equal(original.meta.revision,'2026-10-15-r23');
  assert.equal(original.individuals.length,38);
  assert.equal(updated.individuals.length,35);
  assert.equal(updated.individuals.filter(x=>x.primaryPR!=null).length,30);
  assert.equal(updated.coverageMatrix.length,47);
  assert.equal(Object.keys(updated.resources).length,18);
  assert.deepEqual(updated.roles,original.roles);
  const indexed=new Map(updated.individuals.map(x=>[x.id,x]));
  const retired=new Set(facts.inactiveIndividualIds);
  for(const before of original.individuals){
    const after=indexed.get(before.id);
    if(retired.has(before.id)){
      assert.equal(after,undefined,'Retired individual still present: '+before.id);
      continue;
    }
    assert.ok(after,'Active individual disappeared: '+before.id);
    assert.equal(after.primaryPR,before.primaryPR,'Public measured PR changed for '+before.id);
    assert.equal(after.primaryEvalLv,before.primaryEvalLv,'Measurement level changed');
    for(const field of DECISIONS)assert.deepEqual(after[field],before[field],'Legacy decision mutated: '+before.id+'.'+field);
  }
  const added=updated.individuals.filter(x=>!original.individuals.some(y=>y.id===x.id));
  assert.deepEqual(added.map(x=>x.id),['IND-0041','IND-0042','IND-0043']);
  for(const x of added){
    assert.equal(x.primaryPR,null);
    for(const field of DECISIONS)assert.equal(x[field],null,'New individual had unapproved '+field);
  }
});

test('shiny protection supersedes obsolete candy advice in detail rendering only',()=>{
  const merged=applyFacts(published,facts);
  const p=merged.individuals.find(x=>x.id==='IND-0016');
  assert.equal(p.disposition,'アメ化候補','Historical record remains intact');
  const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
  const start=app.indexOf('function detail(p){');
  const end=app.indexOf('\nfunction openIndividual(',start);
  assert.ok(start>=0&&end>start);
  const ctx={
    srpFor:()=>null,foodTarget:{},SRP:{meta:{status:'pending'}},
    displayName:x=>x.name,qualityBadge:()=>'',tierText:()=>'',statusClass:()=>'',
    foodGrid:()=>'',natureCard:()=>'',subSkillGrid:()=>'',
    esc:x=>String(x==null?'—':x),
  };
  vm.runInNewContext(app.slice(start,end),ctx);
  const html=ctx.detail(p);
  assert.match(html,/キープ（色違い保護）/);
  assert.match(html,/旧公開版のアメ化候補判断は撤回/);
  assert.match(html,/★ 色違い/);
  assert.doesNotMatch(html,/<strong>アメ化候補<\/strong>/);
});
