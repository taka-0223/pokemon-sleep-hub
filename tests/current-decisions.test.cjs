'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {applyFacts} = require('../current-facts-merge.js');
const {applyDecisions, SOURCE_FIELDS} = require('../current-decisions-merge.js');

function readWindow(file, key) {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return JSON.parse(JSON.stringify(context.window[key]));
}
const base=readWindow('data.js','APP_DATA');
const facts=readWindow('current-facts.js','APP_CURRENT_FACTS');
const decisions=readWindow('current-decisions.js','APP_CURRENT_DECISIONS');
const withFacts=()=>applyFacts(base,facts);
const clone=x=>JSON.parse(JSON.stringify(x));

test('exactly six dated CURRENT decisions, no qualities or species grades',()=>{
  assert.equal(decisions.meta.sourceRevision,'2026-10-23-r35');
  assert.equal(decisions.meta.cutoffDate,'2026-10-20');
  assert.equal(decisions.meta.decisionCount,6);
  assert.equal(decisions.meta.roleCount,33);
  assert.deepEqual(decisions.decisions.map(d=>d.id),[
    'IND-0005','IND-0016','IND-0018','IND-0034','IND-0042','IND-0043'
  ]);
  for(const d of decisions.decisions){
    assert.deepEqual(Object.keys(d).sort(),[...SOURCE_FIELDS].sort());
    assert.ok(d.decisionDate>='2026-10-20');
    for(const key of ['quality','speciesGrade','targetCandidates'])
      assert.equal(Object.hasOwn(d,key),false);
  }
});

test('merge restores corrected shiny keep decision and dated training updates',()=>{
  const merged=applyDecisions(withFacts(),decisions);
  assert.equal(merged.meta.currentDecisionCount,6);
  assert.equal(merged.individuals.length,35);
  assert.equal(merged.individuals.filter(x=>x.primaryPR!=null).length,30);
  const byId=id=>merged.individuals.find(x=>x.id===id);
  assert.equal(byId('IND-0016').disposition,'キープ（色違い）');
  assert.equal(byId('IND-0016').shiny,true);
  assert.equal(byId('IND-0016').currentDecisionStatus,'active');
  assert.equal(byId('IND-0005').priority,14);
  assert.equal(byId('IND-0018').priority,10);
  assert.match(byId('IND-0034').rationale,/Lv25/);
  assert.equal(byId('IND-0018').speciesGrade,
    withFacts().individuals.find(x=>x.id==='IND-0018').speciesGrade);
  assert.equal(byId('IND-0042').roleId,'ROLE-013');
  assert.equal(byId('IND-0042').currentDecisionStatus,'provisional');
  assert.equal(byId('IND-0042').quality,null);
  assert.equal(byId('IND-0043').roleId,'ROLE-025');
  assert.equal(byId('IND-0043').disposition,'キープ');
  assert.equal(byId('IND-0043').quality,null);
});

test('other individuals retain their old decisions; role holders sync but Tier arrays survive',()=>{
  const older=withFacts(), newer=applyDecisions(older,decisions);
  const updated=new Set(decisions.decisions.map(x=>x.id));
  for(const p of older.individuals){
    const next=newer.individuals.find(x=>x.id===p.id);
    assert.deepEqual(next.primaryPR,p.primaryPR);
    assert.deepEqual(next.measurements,p.measurements);
    assert.equal(next.quality,p.quality);
    assert.equal(next.speciesGrade,p.speciesGrade);
    if(!updated.has(p.id))assert.deepEqual(next,p);
  }
  assert.equal(newer.roles.length,33);
  for(const r of older.roles){
    const current=newer.roles.find(x=>x.id===r.id);
    assert.deepEqual(current.targetCandidates,r.targetCandidates);
    assert.equal(current.speciesGrade,r.speciesGrade);
  }
  const tomato=newer.roles.find(r=>r.id==='ROLE-025');
  assert.equal(tomato.incumbent,'IND-0043');
  assert.equal(tomato.backup,null);
  assert.equal(tomato.assignmentSnapshot,'2026-10-23-r35');
  assert.match(tomato.note,/IND-0043/);
  const zone=newer.roles.find(r=>r.id==='ROLE-013');
  assert.equal(zone.backup,'IND-0042');
  const fig=newer.roles.find(r=>r.id==='ROLE-032');
  assert.equal(fig.backup,null);
  assert.equal(newer.roles.find(r=>r.id==='ROLE-015').priority,'高');
});

test('invalid source revision, disappeared ID and duplicate ID refuse the entire layer',()=>{
  const missing=clone(decisions);missing.decisions[0].id='IND-9999';
  assert.throws(()=>applyDecisions(withFacts(),missing),/評価ID/);
  const duplicate=clone(decisions);duplicate.decisions[1].id=duplicate.decisions[0].id;
  assert.throws(()=>applyDecisions(withFacts(),duplicate),/評価ID/);
  const wrong=clone(decisions);wrong.meta.sourceRevision='2026-10-22-r34';
  assert.throws(()=>applyDecisions(withFacts(),wrong),/revision/);
});

test('injected Tier, deprecated date and illegal role are all blocked',()=>{
  const injected=clone(decisions);injected.decisions[0].speciesGrade='S';
  assert.throws(()=>applyDecisions(withFacts(),injected),/許可フィールド/);
  const oldDate=clone(decisions);oldDate.decisions[0].decisionDate='2026-10-19';
  assert.throws(()=>applyDecisions(withFacts(),oldDate),/評価日/);
  const invalidRole=clone(decisions);invalidRole.decisions[0].roleId='ROLE-999';
  assert.throws(()=>applyDecisions(withFacts(),invalidRole),/RoleSlot/);
  const inactive=clone(decisions);inactive.roleAssignments.find(r=>r.id==='ROLE-025').backup='IND-0039';
  assert.throws(()=>applyDecisions(withFacts(),inactive),/RoleSlot/);
});

test('browser without decision sidecar keeps usable facts and r23 references',()=>{
  const sandbox={window:{APP_DATA:withFacts()}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../current-decisions-merge.js'),'utf8'),sandbox);
  assert.equal(sandbox.window.APP_DECISIONS_STATUS.applied,false);
  assert.equal(sandbox.window.APP_DATA.meta.currentFactsRevision,'2026-10-23-r35');
  assert.equal(sandbox.window.APP_DATA.meta.currentDecisionRevision,undefined);
});
