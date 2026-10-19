"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const gate=require("../data-gate.js");
const base={as_of:"2026-10-20"};

test("DP-T01: サブレ在庫を毎回要求しない",()=>{
  const r=gate.evaluate({...base,decision_type:"biscuit",missing_fields:["biscuit_count"]});
  assert.equal(r.status,"PROVISIONAL");
  assert.deepEqual(r.ask_only,[]);
  const exact=gate.evaluate({...base,decision_type:"biscuit",material_missing_fields:["biscuit_count"]});
  assert.equal(exact.status,"VERIFY");
  assert.deepEqual(exact.ask_only,["biscuit_count"]);
});
test("DP-T02: 厳選判定で無関係なレシピレベルを尋ねない",()=>{
  const r=gate.evaluate({...base,decision_type:"keep",missing_fields:["recipe_level"]});
  assert.equal(r.status,"PROVISIONAL");
  assert.deepEqual(r.ask_only,[]);
});
test("DP-T03: 希少資源の現数不明なら投入確定を保留",()=>{
  const r=gate.evaluate({...base,decision_type:"rare_investment",
    rare_resources_at_risk:true,missing_fields:["universal_candy"],
    material_missing_fields:["universal_candy"]});
  assert.equal(r.status,"HOLD");
  assert.deepEqual(r.ask_only,["universal_candy"]);
});
test("DP-T04: 色違い・モデル欠測による自動博士送り禁止",()=>{
  const r=gate.evaluate({...base,decision_type:"release_review",
    irreversible:true,model_gaps:["ingredient_supply_coefficients"],
    material_missing_fields:["protected_status"]});
  assert.equal(r.status,"HOLD");
  assert.equal(r.release_allowed,false);
  assert.equal(r.requires_manual_review,true);
  assert.ok(r.model_gaps.length);
  const complete=gate.evaluate({...base,decision_type:"release_review"});
  assert.equal(complete.status,"HOLD");
  assert.equal(complete.release_allowed,false);
});
test("DP-T05: 料理の未確認を0にせず条件付きで扱う",()=>{
  const r=gate.evaluate({...base,decision_type:"cooking",
    missing_fields:["pot_size","recipe_level"],assumptions:["暫定の鍋容量"]});
  assert.equal(r.status,"PROVISIONAL");
  assert.deepEqual(r.ask_only,[]);
  const exact=gate.evaluate({...base,decision_type:"cooking",
    material_missing_fields:["pot_size","recipe_level"]});
  assert.equal(exact.status,"VERIFY");
});
test("DP-T06: 旧日付スナップショットは日付付き・現値ではない",()=>{
  const old={key:"dream_shards",value:1000,certainty:"confirmed",
    observed_at:"2026-09-28",source:"CURRENT P_Account"};
  const r=gate.evaluate({...base,decision_type:"invest",
    available_evidence:[old],material_missing_fields:["dream_shards"]});
  assert.equal(r.status,"VERIFY");
  assert.equal(r.stale_evidence[0].observed_at,"2026-09-28");
  assert.deepEqual(r.ask_only,["dream_shards"]);
  const safe=gate.evaluate({...base,decision_type:"keep",available_evidence:[old]});
  assert.equal(safe.status,"READY"); // Old snapshots have no universal expiry.
});
test("DP-T07: モデル未算出は不足情報でも供給0でもない",()=>{
  const r=gate.evaluate({...base,decision_type:"cooking",
    model_gaps:["ingredient_supply_coefficient"]});
  assert.equal(r.status,"MODEL_GAP");
  assert.deepEqual(r.ask_only,[]);
  assert.ok(!r.reason_for_check.includes("0として"));
});
test("DP-T08: コード導入で公開個体・RoleSlot・PRを変更しない",()=>{
  const content=fs.readFileSync(path.join(__dirname,"../data.js"),"utf8");
  const sandbox={window:{}};
  vm.runInNewContext(content,sandbox);
  const d=sandbox.window.APP_DATA;
  const original=JSON.stringify(d);
  gate.evaluate({...base,decision_type:"invest"});
  assert.equal(JSON.stringify(d),original);
  assert.equal(d.meta.revision,"2026-10-15-r23");
  assert.equal(d.individuals.length,38);
  assert.equal(d.roles.length,33);
});
test("0は未確認値ではない",()=>{
  const r=gate.evaluate({...base,decision_type:"rare_investment",
    material_missing_fields:["seed_count"],rare_resources_at_risk:true,
    available_evidence:[{key:"seed_count",value:0,certainty:"confirmed",
      observed_at:"2026-10-20"}]});
  assert.equal(r.status,"READY");
  assert.deepEqual(r.ask_only,[]);
  assert.equal(r.release_allowed,false);
});
test("確認日の古さに一律TTLを適用しない",()=>{
  const r=gate.evaluate({...base,decision_type:"field",
    available_evidence:[{key:"field_bonus",value:50,certainty:"confirmed",
      observed_at:"2026-09-01"}]});
  assert.equal(r.status,"READY");
});
