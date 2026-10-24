'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const match=app.match(/function candidateTierHtml\(c\)\{[\s\S]*?\n\}/);
assert.ok(match,'App must provide candidateTierHtml');
const context={tierText:value=>'<legacy-tier>'+String(value)+'</legacy-tier>'};
vm.runInNewContext(match[0]+'\nthis.candidateTierHtml=candidateTierHtml;',context);
test('unrated target is explicitly labeled without inventing S/A+/A',()=>{
  const html=context.candidateTierHtml({grade:null,assessmentStatus:'unrated',speciesKey:'raichu'});
  assert.match(html,/Tier未評価/);
  assert.doesNotMatch(html,/<legacy-tier>/);
});
test('formally assessed candidate keeps its grade display',()=>{
  assert.equal(context.candidateTierHtml({grade:'S'}),'<legacy-tier>S</legacy-tier>');
});
test('legacy published candidate renders normally without new provenance flag',()=>{
  assert.equal(context.candidateTierHtml({grade:'A+'}),'<legacy-tier>A+</legacy-tier>');
});
