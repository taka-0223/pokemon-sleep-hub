"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ui=require("../seed-ui.js");
const model=require("../seed-model.js");
const rules=require("../seed-rules.js");

const revision="2026-11-01-r37",hash="a".repeat(64);
function fixture(){
  const versions={sourceRevision:revision,modelVersion:model.MODEL_VERSION,gameDataVersion:rules.DATA_VERSION};
  const assessment=(id,tier)=>({individualId:id,tier,status:"provisional",applicability:"conditional",
    rationale:"稼働条件と代替を確認して比較する候補。",versions:{...versions}});
  const people=[
    {id:"IND-0002",name:"プクリン",active:true,currentSpeciesKey:"wigglytuff",targetSpeciesKey:"wigglytuff",
      level:34,currentSkillLevel:3,remainingEvolutions:0,mainSkillKey:"energy_for_everyone_s",mainSkillName:"げんきオールS",
      accountAssessment:assessment("IND-0002","A"),sourceIssues:[],versions:{...versions}},
    {id:"IND-0010",name:"デンリュウ",active:true,currentSpeciesKey:"ampharos",targetSpeciesKey:"ampharos",
      level:23,currentSkillLevel:3,remainingEvolutions:0,mainSkillKey:"charge_strength_m",mainSkillName:"エナジーチャージM",
      accountAssessment:assessment("IND-0010","A"),sourceIssues:[],versions:{...versions}},
    {id:"IND-0009",name:"ミュウ",active:true,currentSpeciesKey:"mew",targetSpeciesKey:"mew",
      level:27,currentSkillLevel:3,remainingEvolutions:0,mainSkillKey:null,mainSkillName:"オールマイティー",
      accountAssessment:{individualId:"IND-0009",tier:null,status:"unassessed",versions:{...versions}},
      sourceIssues:[],versions:{...versions}},
    {id:"IND-0017",name:"パモ",active:true,currentSpeciesKey:"pawmi",targetSpeciesKey:"pawmot",
      level:12,currentSkillLevel:1,remainingEvolutions:2,mainSkillKey:"energy_for_everyone_s",mainSkillName:"げんきオールS",
      accountAssessment:{individualId:"IND-0017",tier:null,status:"unassessed",versions:{...versions}},
      sourceIssues:[],versions:{...versions}}
  ];
  const speciesAssessments=[
    {id:"ST-1",speciesKey:"wigglytuff",skillKey:"energy_for_everyone_s",tier:"A",status:"provisional",applicability:"conditional",
      conditions:["長期採用と回復不足を確認"],rationale:"主力回復役としての候補。",versions:{...versions}},
    {id:"ST-2",speciesKey:"ampharos",skillKey:"charge_strength_m",tier:"S",status:"provisional",applicability:"conditional",
      conditions:["編成時間と発動回数を確認"],rationale:"直接エナジー役の候補。",versions:{...versions}},
    {id:"ST-3",speciesKey:"pawmot",skillKey:"energy_for_everyone_s",tier:"A",status:"provisional",applicability:"conditional",
      conditions:["進化後に長期採用"],rationale:"将来の回復役候補。",versions:{...versions}}
  ];
  return {model,rules,
    appData:{meta:{revision,sourceSha256:hash,seedModelVersion:model.MODEL_VERSION,gameDataVersion:rules.DATA_VERSION},individuals:people.map(p=>({id:p.id,name:p.name,quality:"S",resourceGate:{mainSeedCap:"99"}})),
      speciesMaster:[{key:"wigglytuff",name:"プクリン"},{key:"ampharos",name:"デンリュウ"},{key:"mew",name:"ミュウ"},{key:"pawmot",name:"パーモット"}]},
    seedData:{meta:{schemaVersion:"1.0",modelVersion:model.MODEL_VERSION,gameDataVersion:rules.DATA_VERSION,sourceRevision:revision,sourceSha256:hash,
      individualCount:people.length},individuals:people,speciesAssessments,
      resources:{mainSkillSeed:{value:null,reportedValue:8,text:"約8個",certainty:"approx",observedAt:"2026-09-28"}},
      scenarios:[{id:"SCN-OLD",individualId:"IND-0002",name:"以前のSLv6案",status:"legacy_proposal",targetSkillLevel:6,
        seeds:999,timing:null,sourceTimingKnown:false,recommended:false,source:{reviewedAt:"2026-09-28"}}]}
  };
}

test("initial view has all active individuals, three layers and no auto-selected target",()=>{
  const ctx=fixture(),v=ui.buildView(ctx,{}),html=ui.planHtml(v);
  assert.equal(v.valid,true);
  assert.equal(v.individual.id,"IND-0002");
  assert.equal(v.targetSkillLevel,null);
  assert.equal(v.result.scenario.requiredSeeds,null);
  for(const p of ctx.seedData.individuals) assert.ok(html.includes('value="'+p.id+'"'));
  assert.match(html,/1\. 種族の投資候補/);
  assert.match(html,/2\. この個体の投資候補/);
  assert.match(html,/3\. 投入シナリオの比較/);
  assert.match(html,/投入判断は未確定・使用承認なし/);
  assert.doesNotMatch(html,/<dd>3個/);
});

test("registered SLv3 to selected SLv6 displays a reference cost, never an approval",()=>{
  const v=ui.buildView(fixture(),{individualId:"IND-0002",targetSkillLevel:6});
  assert.equal(v.result.scenario.requiredSeeds,3);
  assert.equal(v.result.scenario.perTriggerDelta.delta,9);
  assert.equal(v.result.recommendation.approved,false);
  assert.equal(v.result.execution.canExecute,false);
  assert.equal(v.recommended,false);
  const html=ui.planHtml(v);
  assert.match(html,/<dd>3個/);
  assert.match(html,/9 → 18（差 9）/);
  assert.match(html,/日次ROIは未算出/);
  assert.match(html,/data-seed-approved="false"/);
  assert.doesNotMatch(html,/999個|使用を推奨|投入を承認/);
});

test("direct strength comparison uses current 6858 value and does not infer daily output",()=>{
  const v=ui.buildView(fixture(),{individualId:"IND-0010",targetSkillLevel:7});
  assert.equal(v.result.scenario.requiredSeeds,4);
  assert.equal(v.result.scenario.perTriggerDelta.delta,5132);
  const html=ui.planHtml(v);
  assert.match(html,/1726 → 6858（差 5132）/);
  assert.doesNotMatch(html,/1日\s*[0-9,]+\s*エナジー/);
});

test("historical approximate stock is explicitly dated and never treated as current confirmed stock",()=>{
  const v=ui.buildView(fixture(),{targetSkillLevel:6}),html=ui.planHtml(v);
  assert.match(html,/在庫記録：約8個/);
  assert.match(html,/2026-09-28の概数/);
  assert.match(html,/現在の確定在庫としては扱いません/);
  assert.equal(v.result.execution.stock.available,null);
});

test("missing stock does not display zero",()=>{
  const ctx=fixture();ctx.seedData.resources={};
  const html=ui.planHtml(ui.buildView(ctx,{}));
  assert.match(html,/在庫記録：記録なし/);
  assert.doesNotMatch(html,/在庫記録：0個/);
});

test("historical confirmed zero is shown as a dated record, not erased",()=>{
  const ctx=fixture();ctx.seedData.resources.mainSkillSeed={value:0,reportedValue:0,certainty:"confirmed",observedAt:"2026-09-28"};
  const html=ui.planHtml(ui.buildView(ctx,{}));
  assert.match(html,/在庫記録：0個/);
  assert.match(html,/2026-09-28のその時点の確認値/);
  assert.match(html,/現在の確定在庫としては扱いません/);
});

test("unknown compound skill stays unassessed and uncalculated, not low tier or zero",()=>{
  const v=ui.buildView(fixture(),{individualId:"IND-0009",targetSkillLevel:6}),html=ui.planHtml(v);
  assert.equal(v.rule,null);
  assert.equal(v.result.scenario.requiredSeeds,null);
  assert.equal(v.accountAssessment.tier,null);
  assert.match(html,/必要個数・効果差は未算出/);
  assert.match(html,/未評価/);
  assert.doesNotMatch(html,/Tier C|<dd>0個|data-seed-field="target"/);
});

test("future species assessment is labeled and future evolutions never reduce now cost",()=>{
  const v=ui.buildView(fixture(),{individualId:"IND-0017",targetSkillLevel:6});
  assert.equal(v.speciesAssessment.scope,"target_species");
  assert.equal(v.result.scenario.requiredSeeds,5);
  const html=ui.planHtml(v);
  assert.match(html,/進化先 パーモット/);
  assert.match(html,/今の個体性能や現在の投入必要数を示すものではありません/);
  assert.match(html,/<dd>5個/);
});

test("target already achieved is a true zero, unlike missing current level",()=>{
  const ctx=fixture();
  const done=ui.buildView(ctx,{targetSkillLevel:2});
  assert.equal(done.result.scenario.requiredSeeds,0);
  assert.match(ui.planHtml(done),/0個（すでに目標以上）/);
  ctx.seedData.individuals[0].currentSkillLevel=null;
  const unknown=ui.buildView(ctx,{targetSkillLevel:6});
  assert.equal(unknown.result.scenario.requiredSeeds,null);
  assert.match(ui.planHtml(unknown),/必要個数は未算出/);
  assert.doesNotMatch(ui.planHtml(unknown),/<dd>0個/);
});

test("tampered out-of-cap and fractional targets never produce cost",()=>{
  const over=ui.buildView(fixture(),{targetSkillLevel:999});
  assert.equal(over.result.scenario.requiredSeeds,null);
  assert.match(ui.planHtml(over),/必要個数は未算出/);
  const fraction=ui.buildView(fixture(),{targetSkillLevel:4.5});
  assert.equal(fraction.result.scenario.requiredSeeds,null);
  assert.equal(fraction.targetSkillLevel,null);
});

test("revision/hash/schema/model mismatch or absence fails closed before revealing tiers",()=>{
  const mutations=[
    c=>c.appData.meta.revision="2026-10-25-r36",
    c=>delete c.appData.meta.revision,
    c=>c.seedData.meta.sourceSha256="b".repeat(64),
    c=>delete c.appData.meta.sourceSha256,
    c=>c.appData.meta.sourceSha256="",
    c=>c.seedData.meta.sourceSha256="not-a-hash",
    c=>c.seedData.meta.schemaVersion="2.0",
    c=>c.seedData.meta.modelVersion="old-model",
    c=>delete c.appData.meta.seedModelVersion,
    c=>c.appData.meta.seedModelVersion="old-model",
    c=>c.model=null,
    c=>c.rules=null
  ];
  for(const mutate of mutations){
    const ctx=fixture();mutate(ctx);
    const v=ui.buildView(ctx,{targetSkillLevel:6}),html=ui.planHtml(v);
    assert.equal(v.valid,false);
    assert.match(html,/role="alert"/);
    assert.match(html,/未評価|読み込めません/);
    assert.doesNotMatch(html,/Tier [SAB]|data-seed-field|<dd>/);
  }
});

test("all three effect-table revisions are mandatory and must match before exposing tiers or costs",()=>{
  const mutations=[
    c=>delete c.appData.meta.gameDataVersion,
    c=>delete c.seedData.meta.gameDataVersion,
    c=>c.appData.meta.gameDataVersion="old-effects",
    c=>c.seedData.meta.gameDataVersion="old-effects",
    c=>c.rules={...rules,DATA_VERSION:undefined},
    c=>c.rules={...rules,DATA_VERSION:"old-effects"},
    c=>{c.appData.meta.gameDataVersion="new-effects";c.seedData.meta.gameDataVersion="new-effects";}
  ];
  for(const mutate of mutations){
    const ctx=fixture();mutate(ctx);
    const v=ui.buildView(ctx,{targetSkillLevel:6}),html=ui.planHtml(v);
    assert.equal(v.valid,false);
    assert.match(html,/role="alert"/);
    assert.doesNotMatch(html,/Tier [SAB]|data-seed-field|<dd>/);
  }
});

test("each skill row and lookup result must carry the matched effect-table revision",()=>{
  for(const key of Object.keys(rules.skills)){
    for(const version of [undefined,"old-effects"]){
      const ctx=fixture();
      ctx.rules={...rules,skills:{...rules.skills,[key]:{...rules.skills[key],version}}};
      assert.equal(ui.buildView(ctx,{targetSkillLevel:6}).valid,false);
    }
  }
  const mutations=[
    c=>c.rules={...rules,skills:undefined},
    c=>c.rules={...rules,skills:{}},
    c=>c.rules={...rules,getSkill:key=>({...rules.getSkill(key),version:"old-effects"})},
    c=>c.rules={...rules,getSkill:()=>null},
    c=>c.rules={...rules,getSkill:()=>{throw new Error("broken lookup");}}
  ];
  for(const mutate of mutations){
    const ctx=fixture();mutate(ctx);
    const v=ui.buildView(ctx,{targetSkillLevel:6}),html=ui.planHtml(v);
    assert.equal(v.valid,false);
    assert.match(html,/role="alert"/);
    assert.doesNotMatch(html,/Tier [SAB]|data-seed-field|<dd>/);
  }
});

test("active roster mismatch, duplicate IDs and inaccurate count fail closed",()=>{
  const mutations=[
    c=>c.seedData.individuals.pop(),
    c=>c.appData.individuals.pop(),
    c=>c.seedData.individuals[0].active=false,
    c=>delete c.seedData.individuals[0].active,
    c=>c.seedData.individuals[1].id=c.seedData.individuals[0].id,
    c=>c.appData.individuals[1].id=c.appData.individuals[0].id,
    c=>c.seedData.meta.individualCount=99
  ];
  for(const mutate of mutations){const ctx=fixture();mutate(ctx);assert.equal(ui.buildView(ctx,{}).valid,false);}
});

test("unknown selected individual cannot silently fall back to a different investment target",()=>{
  const v=ui.buildView(fixture(),{individualId:"REMOVED-ID",targetSkillLevel:6});
  assert.equal(v.valid,false);
  assert.match(ui.planHtml(v),/登録されていません/);
});

test("missing/stale account assessment never borrows generic quality or legacy cap",()=>{
  const ctx=fixture();delete ctx.seedData.individuals[0].accountAssessment;
  let v=ui.buildView(ctx,{});
  assert.equal(v.accountAssessment.tier,null);
  assert.match(ui.planHtml(v),/2\. この個体の投資候補<\/h4><p class="seed-tier">未評価/);
  ctx.seedData.individuals[0].accountAssessment={...fixture().seedData.individuals[0].accountAssessment,
    versions:{sourceRevision:"2026-10-25-r36",modelVersion:model.MODEL_VERSION}};
  v=ui.buildView(ctx,{});
  assert.equal(v.accountAssessment.status,"stale");
  assert.match(ui.planHtml(v),/未評価（再確認が必要）/);
});

test("ambiguous species benchmark rows are not silently selected",()=>{
  const ctx=fixture();ctx.seedData.speciesAssessments.push({...ctx.seedData.speciesAssessments[0],id:"another-benchmark"});
  const v=ui.buildView(ctx,{});
  assert.equal(v.speciesAssessment.tier,null);
  assert.equal(v.speciesAssessment.status,"unassessed");
});

test("catalog is collapsed and explicitly qualitative/provisional",()=>{
  const html=ui.planHtml(ui.buildView(fixture(),{}));
  assert.match(html,/<details class="seed-catalog"><summary>/);
  assert.doesNotMatch(html,/<details class="seed-catalog"[^>]*open/);
  assert.match(html,/Tier A（暫定）/);
  assert.match(html,/同条件で測定した金種効率ランキングではありません/);
  assert.match(html,/未掲載の種族は低Tierではなく未評価/);
});

test("applicability is displayed separately from tier in both cards and the species catalog",()=>{
  for(const [applicability,label] of Object.entries({broad:"広く適用",conditional:"条件付き",not_applicable:"対象外",unknown:"適用条件未確認"})){
    const ctx=fixture();
    ctx.seedData.speciesAssessments[0].applicability=applicability;
    ctx.seedData.individuals[0].accountAssessment.applicability=applicability;
    const v=ui.buildView(ctx,{}),html=ui.planHtml(v);
    assert.equal(v.speciesAssessment.tier,"A");
    assert.equal(v.accountAssessment.tier,"A");
    const cards=html.slice(html.indexOf('<div class="seed-layers">'),html.indexOf('<section class="seed-reference"'));
    const catalog=html.slice(html.indexOf('<details class="seed-catalog">'));
    assert.equal((cards.match(new RegExp("適用："+label,"g"))||[]).length,2);
    assert.equal((catalog.match(new RegExp("適用："+label,"g"))||[]).length,applicability==="conditional"?3:1);
    assert.match(html,/Tier A（暫定）/);
  }
});

test("all external strings are escaped, including IDs, conditions and legacy notes",()=>{
  const ctx=fixture(),payload='<img src=x onerror="alert(1)">';
  ctx.seedData.individuals[0].name=payload;
  ctx.seedData.individuals[0].accountAssessment.rationale=payload;
  ctx.seedData.speciesAssessments[0].conditions=[payload];
  ctx.appData.speciesMaster[0].name=payload;
  ctx.seedData.scenarios[0].name=payload;
  ctx.seedData.resources.mainSkillSeed.observedAt=payload;
  const html=ui.planHtml(ui.buildView(ctx,{targetSkillLevel:6}));
  assert.doesNotMatch(html,/<img|onerror="|<script|onclick=/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("view building and rendering do not mutate public or seed source data",()=>{
  const ctx=fixture(),before=JSON.stringify({app:ctx.appData,seed:ctx.seedData});
  ui.planHtml(ui.buildView(ctx,{targetSkillLevel:6}));
  ui.planHtml(ui.buildView(ctx,{individualId:"IND-0017",targetSkillLevel:6}));
  assert.equal(JSON.stringify({app:ctx.appData,seed:ctx.seedData}),before);
});

function browserFixture(){
  const ctx=fixture(),listeners={change:[]},panel={innerHTML:"",
    addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn);},
    querySelector(){return {focus(){}};}};
  const window={APP_DATA:ctx.appData,SEED_INVESTMENT_DATA:ctx.seedData,SeedModel:model,SEED_SKILL_RULES:rules,
    document:{getElementById(id){return id==="seedInvestmentPanel"?panel:null;}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../seed-ui.js"),"utf8"),{window});
  const change=(field,value)=>listeners.change[0]({target:{value,getAttribute(name){return name==="data-seed-field"?field:null;}}});
  return {window,panel,listeners,change};
}

test("browser renderer binds one delegated listener and resets target on individual change",()=>{
  const env=browserFixture(),api=env.window.SeedInvestmentUI;
  assert.equal(api.renderPlan(),true);api.renderPlan();api.renderPlan();
  assert.equal(env.listeners.change.length,1);
  env.change("target","6");assert.match(env.panel.innerHTML,/<dd>3個/);
  env.change("individual","IND-0010");assert.doesNotMatch(env.panel.innerHTML,/<dd>3個|<dd>4個/);
  env.change("target","7");assert.match(env.panel.innerHTML,/<dd>4個/);
  assert.equal(env.listeners.change.length,1);
});

test("renderer rechecks identity on every render and does not keep stale numeric results",()=>{
  const env=browserFixture();env.window.SeedInvestmentUI.renderPlan();env.change("target","6");
  env.window.APP_DATA.meta.sourceSha256="b".repeat(64);
  assert.equal(env.window.SeedInvestmentUI.renderPlan(),false);
  assert.match(env.panel.innerHTML,/role="alert"/);
  assert.doesNotMatch(env.panel.innerHTML,/<dd>3個/);
});

test("renderer removes prior tiers and numbers when a cached rules version becomes stale",()=>{
  const env=browserFixture();env.window.SeedInvestmentUI.renderPlan();env.change("target","6");
  assert.match(env.panel.innerHTML,/<dd>3個/);
  env.window.SEED_SKILL_RULES={...rules,DATA_VERSION:"old-effects"};
  assert.equal(env.window.SeedInvestmentUI.renderPlan(),false);
  assert.match(env.panel.innerHTML,/role="alert"/);
  assert.doesNotMatch(env.panel.innerHTML,/Tier [SAB]|<dd>3個/);
  assert.match(env.window.SeedInvestmentUI.individualHtml("IND-0002"),/role="alert"/);
});

test("individual detail exposes separated assessments but never preselects a seed count",()=>{
  const env=browserFixture(),html=env.window.SeedInvestmentUI.individualHtml("IND-0002");
  assert.match(html,/1\. 種族の投資候補/);
  assert.match(html,/2\. この個体の投資候補/);
  assert.match(html,/3\. 投入判断/);
  assert.match(html,/未確定・使用承認なし/);
  assert.doesNotMatch(html,/<select|参考必要個数|<dd>3個/);
  assert.match(env.window.SeedInvestmentUI.individualHtml("missing"),/role="alert"/);
});
