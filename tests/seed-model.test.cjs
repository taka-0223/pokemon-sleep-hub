'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../seed-model.js');
const clone = x => JSON.parse(JSON.stringify(x));
const versions = {sourceRevision: 'test-current', modelVersion: 'seed-v1'};
const rules = {skills: {healing: {maxLevel: 6, unit: 'energy_per_member', effects: [null, 5, 7, 9, 11, 15, 18]}}};
function fixture() {
  return {
    individual: {id: 'TEST-1', active: true, currentSpeciesKey: 'current', targetSpeciesKey: 'final',
      mainSkillKey: 'healing', currentSkillLevel: 3, remainingEvolutions: 2, versions: clone(versions)},
    scenario: {id: 'PLAN-1', individualId: 'TEST-1', skillKey: 'healing', targetSkillLevel: 6,
      timing: 'now', seedType: 'mainSkillSeed', versions: clone(versions)},
    speciesAssessment: {speciesKey: 'current', tier: 'A', status: 'validated', applicability: 'broad', versions: clone(versions)},
    accountAssessment: {individualId: 'TEST-1', tier: 'S', status: 'provisional', applicability: 'conditional', versions: clone(versions)},
    skillRules: clone(rules), stocks: {mainSkillSeed: {value: 8, certainty: 'confirmed'}}, currentVersions: clone(versions)
  };
}
const codes = x => x.issues.map(i => i.code);
function explicit(a, action = 'invest') {
  a.scenario.recommendation = {action, explicit: true, source: 'test:reviewed-decision'};
  return a;
}
function pending(id, type = 'evolution', gain = 1) {
  return {id, type, skillLevelGain: gain, verified: true, completed: false, beforeInvestment: true};
}

test('CommonJS and browser expose the same pure API', () => {
  const sandbox = {window: {}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../seed-model.js'), 'utf8'), sandbox);
  assert.equal(sandbox.window.SeedModel.MODEL_VERSION, 'seed-v1');
  assert.deepEqual(Object.keys(sandbox.window.SeedModel).sort(), Object.keys(model).sort());
});
test('unknown data is null, not a fabricated low tier or zero cost', () => {
  const result = model.evaluateCandidate({});
  assert.equal(result.speciesAssessment.tier, null);
  assert.equal(result.accountAssessment.tier, null);
  assert.equal(result.scenario.requiredSeeds, null);
  assert.equal(result.recommendation.action, 'needs_data');
  assert.equal(result.execution.feasible, false);
});
test('three levels need three seeds, but arithmetic cannot approve investment', () => {
  const result = model.evaluateCandidate(fixture());
  assert.equal(result.scenario.requiredSeeds, 3);
  assert.equal(result.scenario.status, 'ready');
  assert.equal(result.recommendation.action, 'needs_data');
  assert.equal(result.recommendation.sourceExplicit, false);
  assert.equal(result.execution.feasible, true);
  assert.equal(result.execution.canExecute, false);
  assert.equal(result.recommendation.approved, false);
});
test('legacy caps, proposal seeds, generic Tier and PR never supply recommendation or value', () => {
  const a = fixture();
  delete a.speciesAssessment; delete a.accountAssessment;
  Object.assign(a.individual, {mainSeedCap: 9, main_seed_cap: 9, primaryPR: 99.9, speciesGrade: 'S', quality: 'S'});
  Object.assign(a.scenario, {seeds: 88, recommended: true, status: 'legacy_proposal'});
  const r = model.evaluateCandidate(a);
  assert.equal(r.speciesAssessment.tier, null); assert.equal(r.accountAssessment.tier, null);
  assert.equal(r.scenario.requiredSeeds, 3); assert.equal(r.recommendation.action, 'needs_data');
});
test('assessment status and applicability remain separate from supplied tier', () => {
  const r = model.evaluateCandidate(fixture());
  assert.equal(r.speciesAssessment.tier, 'A'); assert.equal(r.accountAssessment.tier, 'S');
  assert.equal(r.accountAssessment.status, 'provisional');
  assert.equal(r.accountAssessment.applicability, 'conditional');
});
test('a target-species tier is identified as future scope, not current-species tier', () => {
  const a = fixture(); a.speciesAssessment.speciesKey = 'final';
  const r = model.evaluateCandidate(a);
  assert.equal(r.speciesAssessment.tier, 'A');
  assert.equal(r.speciesAssessment.scope, 'target_species');
  assert.equal(r.speciesAssessment.appliesNow, false);
});
test('mismatched assessment identity cannot be used as evidence for investment', () => {
  const a = explicit(fixture()); a.accountAssessment.individualId = 'OTHER';
  const r = model.evaluateCandidate(a);
  assert.equal(r.accountAssessment.tier, null);
  assert.equal(r.recommendation.action, 'needs_data');
});
test('approximate inventory preserves investment tiers but blocks resource feasibility', () => {
  const a = fixture(); a.stocks.mainSkillSeed.certainty = 'approx';
  const r = model.evaluateCandidate(a);
  assert.equal(r.accountAssessment.tier, 'S'); assert.equal(r.speciesAssessment.tier, 'A');
  assert.equal(r.scenario.requiredSeeds, 3); assert.equal(r.execution.feasible, false);
  assert.ok(r.execution.reasonCodes.includes('STOCK_UNCONFIRMED'));
  a.stocks.mainSkillSeed.value = null; a.stocks.mainSkillSeed.reportedValue = 8;
  assert.equal(model.evaluateCandidate(a).execution.stock.reportedValue, 8);
});
test('explicit sourced recommendation is preserved, never approved or executed', () => {
  const r = model.evaluateCandidate(explicit(fixture()));
  assert.equal(r.recommendation.action, 'invest'); assert.equal(r.recommendation.sourceExplicit, true);
  assert.equal(r.recommendation.approved, false); assert.equal(r.execution.canExecute, false);
});
test('an unsourced or nonexplicit action is not a recommendation', () => {
  for (const rec of [{action: 'invest'}, {action: 'invest', explicit: true}, {action: 'invest', source: 'x'}]) {
    const a = fixture(); a.scenario.recommendation = rec;
    assert.equal(model.evaluateCandidate(a).recommendation.action, 'needs_data');
  }
});
test('target already achieved is numeric zero, while unknown current level stays null', () => {
  const a = fixture(); a.individual.currentSkillLevel = 6;
  assert.equal(model.calculateScenario(a).requiredSeeds, 0);
  a.individual.currentSkillLevel = null;
  assert.equal(model.calculateScenario(a).requiredSeeds, null);
  assert.ok(codes(model.calculateScenario(a)).includes('MISSING_CURRENT_SKILL_LEVEL'));
});
test('legacy timing missing is not silently converted into immediate investment', () => {
  const a = fixture(); a.scenario.timing = null;
  const r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, null); assert.ok(codes(r).includes('MISSING_TIMING'));
});
test('two verified future evolutions reduce a future plan to one, not an immediate plan', () => {
  const a = fixture(); a.scenario.timing = 'after_prerequisites';
  a.scenario.prerequisites = [pending('E1'), pending('E2')];
  let r = model.evaluateCandidate(a);
  assert.equal(r.scenario.requiredSeeds, 1); assert.equal(r.scenario.status, 'conditional');
  assert.equal(r.execution.feasible, false);
  assert.ok(r.execution.reasonCodes.includes('PREREQUISITES_NOT_COMPLETED'));
  a.scenario.timing = 'now'; r = model.evaluateCandidate(a);
  assert.equal(r.scenario.requiredSeeds, null);
  assert.ok(codes(r.scenario).includes('FUTURE_GAIN_NOT_ALLOWED'));
});
test('completed gains already included in current level are not double-counted', () => {
  const a = fixture(); a.individual.currentSkillLevel = 5;
  a.scenario.prerequisites = [{id: 'E1', type: 'evolution', skillLevelGain: 2, completed: true, includedInCurrent: true}];
  assert.equal(model.calculateScenario(a).requiredSeeds, 1);
  a.scenario.prerequisites[0].includedInCurrent = false;
  assert.equal(model.calculateScenario(a).requiredSeeds, null);
});
test('future subskill credit needs verified order and completion state', () => {
  for (const key of ['verified', 'beforeInvestment', 'completed']) {
    const a = fixture(); a.scenario.timing = 'after_prerequisites';
    a.scenario.prerequisites = [pending('S1', 'subskill', 2)]; delete a.scenario.prerequisites[0][key];
    assert.equal(model.calculateScenario(a).requiredSeeds, null, key);
  }
});
test('gain events apply in order with saturation at the verified cap', () => {
  const a = fixture(); a.individual.currentSkillLevel = 5; a.scenario.timing = 'after_prerequisites';
  a.scenario.prerequisites = [pending('S1', 'subskill', 2), pending('E1')];
  const r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, 0); assert.equal(r.baselineSkillLevel, 6);
  assert.deepEqual(r.prerequisites.map(x => x.appliedGain), [1, 0]);
});
test('impossible evolution counts and changing skills are rejected', () => {
  const a = fixture(); a.individual.remainingEvolutions = 0; a.scenario.timing = 'after_prerequisites';
  a.scenario.prerequisites = [pending('E1')];
  assert.ok(codes(model.calculateScenario(a)).includes('EXCESS_EVOLUTION_EVENTS'));
  a.individual.remainingEvolutions = 2; a.scenario.prerequisites[0].skillKeyAfter = 'different';
  assert.ok(codes(model.calculateScenario(a)).includes('SKILL_CHANGE_UNMODELED'));
});
test('unknown caps, excessive targets and invalid numeric types are not clamped or guessed', () => {
  const a = fixture(); delete a.skillRules.skills.healing.maxLevel;
  assert.equal(model.calculateScenario(a).requiredSeeds, null);
  assert.ok(codes(model.calculateScenario(a)).includes('MISSING_SKILL_CAP'));
  for (const target of [7, -1, 0, 2.5, '6', NaN]) {
    const b = fixture(); b.scenario.targetSkillLevel = target;
    assert.equal(model.calculateScenario(b).requiredSeeds, null, String(target));
  }
});
test('source/model/rules version mismatches invalidate current recommendation', () => {
  const a = explicit(fixture()); a.scenario.versions.sourceRevision = 'old';
  let r = model.evaluateCandidate(a);
  assert.equal(r.scenario.status, 'stale'); assert.equal(r.scenario.requiredSeeds, null);
  assert.equal(r.recommendation.action, 'needs_data');
  const b = explicit(fixture()); b.accountAssessment.versions.modelVersion = 'seed-old';
  r = model.evaluateCandidate(b);
  assert.equal(r.accountAssessment.status, 'stale'); assert.equal(r.accountAssessment.tier, null);
  assert.equal(r.accountAssessment.reportedTier, 'S'); assert.equal(r.recommendation.action, 'needs_data');
  const c = fixture(); c.currentVersions.rulesVersion = 'new-effects'; c.skillRules.skills.healing.version = 'old-effects';
  assert.equal(model.calculateScenario(c).status, 'stale');
});
test('inactive individuals cannot become current candidates', () => {
  const a = explicit(fixture()); a.individual.active = false;
  const r = model.evaluateCandidate(a);
  assert.equal(r.eligible, false); assert.equal(r.scenario.status, 'ineligible');
  assert.equal(r.scenario.requiredSeeds, null); assert.equal(r.execution.feasible, false);
  assert.equal(r.recommendation.action, 'needs_data');
});
test('per-trigger effects keep their units and do not use PR or estimate daily energy', () => {
  const a = fixture(); a.individual.primaryPR = 99.99;
  const e = model.calculateScenario(a).perTriggerDelta;
  assert.equal(e.before, 9); assert.equal(e.after, 18); assert.equal(e.delta, 9);
  assert.equal(e.unit, 'energy_per_member'); assert.equal(e.includesProcFrequency, false);
  assert.equal(e.includesTeamEnergy, false); assert.equal(own(e, 'dailyEnergy'), false);
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
});
test('unknown effects do not become zero or obstruct an otherwise valid cost calculation', () => {
  const a = fixture(); delete a.skillRules.skills.healing.effects;
  const r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, 3); assert.equal(r.perTriggerDelta, null);
  assert.ok(codes(r).includes('EFFECT_UNMEASURED'));
});
test('dedicated seeds must explicitly allow the species at investment time', () => {
  const a = fixture(); a.scenario.seedType = 'dedicated';
  a.stocks.dedicated = {value: 5, certainty: 'confirmed', allowedSpeciesKeys: ['other']};
  let r = model.evaluateCandidate(a);
  assert.equal(r.execution.feasible, false); assert.ok(r.execution.reasonCodes.includes('SEED_SPECIES_MISMATCH'));
  a.stocks.dedicated.allowedSpeciesKeys = ['current']; r = model.evaluateCandidate(a);
  assert.equal(r.execution.feasible, true);
});
test('budget sums only selected proposals and cannot substitute resource pools', () => {
  const a = fixture(), b = fixture(); b.individual.id = 'TEST-2'; b.scenario.id = 'PLAN-2'; b.scenario.individualId = 'TEST-2';
  b.accountAssessment.individualId = 'TEST-2';
  const proposals = [model.evaluateCandidate(a), model.evaluateCandidate(b)];
  const stocks = {mainSkillSeed: {value: 4, certainty: 'confirmed'}};
  let r = model.evaluateBudget({proposals, selectedIds: ['PLAN-1'], stocks});
  assert.equal(r.resources[0].required, 3); assert.equal(r.feasible, true); assert.equal(r.reserved, false);
  r = model.evaluateBudget({proposals, selectedIds: ['PLAN-1', 'PLAN-2'], stocks});
  assert.equal(r.resources[0].required, 6); assert.equal(r.feasible, false);
  b.scenario.seedType = 'dedicated'; b.stocks.dedicated = {value: 3, certainty: 'confirmed', allowedSpeciesKeys: ['current']};
  const separate = [proposals[0], model.evaluateCandidate(b)];
  const separateStocks = {...stocks, dedicated: {value: 1, certainty: 'confirmed', allowedSpeciesKeys: ['current']}};
  r = model.evaluateBudget({proposals: separate, selectedIds: ['PLAN-1', 'PLAN-2'], stocks: separateStocks});
  assert.equal(r.resources.length, 2); assert.equal(r.feasible, false);
});
test('budget rejects duplicate proposal IDs, unknown selections and alternative plans for one individual', () => {
  const a = model.evaluateCandidate(fixture());
  assert.equal(model.evaluateBudget({proposals: [a, a], selectedIds: ['PLAN-1'], stocks: fixture().stocks}).feasible, false);
  assert.equal(model.evaluateBudget({proposals: [a], selectedIds: ['missing'], stocks: fixture().stocks}).feasible, false);
  const b = clone(a); b.id = 'PLAN-2'; b.scenario.id = 'PLAN-2';
  const r = model.evaluateBudget({proposals: [a, b], selectedIds: ['PLAN-1', 'PLAN-2'], stocks: fixture().stocks});
  assert.ok(codes(r).includes('ALTERNATIVE_PLANS_SELECTED'));
});
test('empty selection makes no reservation; duplicate selection IDs are deduplicated', () => {
  const a = model.evaluateCandidate(fixture());
  const empty = model.evaluateBudget({proposals: [a], stocks: {}});
  assert.deepEqual(empty.resources, []); assert.equal(empty.reserved, false);
  const r = model.evaluateBudget({proposals: [a], selectedIds: ['PLAN-1', 'PLAN-1'], stocks: fixture().stocks});
  assert.equal(r.resources[0].required, 3);
});
test('all calculations leave supplied facts, proposals, assessments and stock unchanged', () => {
  const a = fixture(), before = clone(a);
  const r = model.evaluateCandidate(a);
  model.evaluateBudget({proposals: [r], selectedIds: ['PLAN-1'], stocks: a.stocks});
  assert.deepEqual(a, before);
});
test('a scenario cannot invent the skill of an individual whose current skill is unknown', () => {
  const a = fixture(); a.individual.mainSkillKey = null;
  const r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, null); assert.ok(codes(r).includes('MISSING_CURRENT_SKILL_KEY'));
});
test('temporary event level is not accepted as the permanent investment baseline', () => {
  const a = fixture(); a.individual.skillLevelBasis = 'temporary';
  const r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, null); assert.ok(codes(r).includes('TEMPORARY_LEVEL_NOT_BASELINE'));
});
test('stock shortage, unknown stock and zero stock remain distinct', () => {
  const a = fixture(); a.stocks.mainSkillSeed.value = 0;
  let r = model.evaluateCandidate(a);
  assert.equal(r.execution.stock.available, 0); assert.ok(r.execution.reasonCodes.includes('INSUFFICIENT_STOCK'));
  a.stocks.mainSkillSeed.value = null; r = model.evaluateCandidate(a);
  assert.equal(r.execution.stock.available, null); assert.ok(r.execution.reasonCodes.includes('STOCK_INVALID'));
  delete a.stocks.mainSkillSeed; r = model.evaluateCandidate(a);
  assert.equal(r.execution.stock.available, null); assert.ok(r.execution.reasonCodes.includes('STOCK_UNCONFIRMED'));
});
test('dedicated seed check follows an explicitly verified post-evolution species', () => {
  const a = fixture(); a.scenario.timing = 'after_prerequisites'; a.scenario.seedType = 'dedicated';
  a.scenario.prerequisites = [{...pending('E1'), speciesKeyAfter: 'final'}];
  a.stocks.dedicated = {value: 5, certainty: 'confirmed', allowedSpeciesKeys: ['current']};
  let r = model.evaluateCandidate(a);
  assert.ok(r.execution.reasonCodes.includes('SEED_SPECIES_MISMATCH'));
  a.stocks.dedicated.allowedSpeciesKeys = ['final']; r = model.evaluateCandidate(a);
  assert.equal(r.execution.reasonCodes.includes('SEED_SPECIES_MISMATCH'), false);
  assert.ok(r.execution.reasonCodes.includes('PREREQUISITES_NOT_COMPLETED'));
});
test('budget with approximate stock remains unavailable without changing assessed values', () => {
  const a = fixture(); a.stocks.mainSkillSeed.certainty = 'approx';
  const p = model.evaluateCandidate(a);
  const r = model.evaluateBudget({proposals: [p], selectedIds: ['PLAN-1'], stocks: a.stocks});
  assert.equal(r.feasible, false); assert.equal(r.resources[0].available, null);
  assert.equal(p.accountAssessment.tier, 'S'); assert.equal(r.canExecute, false);
});
test('missing scenario versions are visible rather than silently declared current', () => {
  const a = fixture(); delete a.scenario.versions;
  const r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, null); assert.ok(codes(r).includes('VERSION_UNVERIFIED'));
});
test('real effects module interoperates without claiming an invented game version', () => {
  const actualRules = require('../seed-rules.js');
  const scenarios = [
    ['energy_for_everyone_s', 3, 6, 9],
    ['charge_strength_m', 3, 7, 5132],
    ['cooking_power_up_s', 3, 7, 19],
    ['tasty_chance_s', 3, 6, 4]
  ];
  for (const [key, current, target, delta] of scenarios) {
    const a = fixture(); a.individual.mainSkillKey = key; a.individual.currentSkillLevel = current;
    a.scenario.skillKey = key; a.scenario.targetSkillLevel = target; a.skillRules = actualRules;
    a.currentVersions.rulesVersion = actualRules.DATA_VERSION;
    const r = model.calculateScenario(a);
    assert.equal(r.status, 'ready', key); assert.equal(r.requiredSeeds, target - current, key);
    assert.equal(r.perTriggerDelta.delta, delta, key);
    assert.ok(r.perTriggerDelta.sources.length > 0);
    assert.equal(r.perTriggerDelta.includesTeamEnergy, false);
  }
});
test('assessment data revision and effect-table revision are validated independently', () => {
  const a = explicit(fixture());
  a.currentVersions.gameDataVersion = 'assessment-data-revision';
  a.currentVersions.rulesVersion = 'effect-table-revision';
  a.scenario.versions.gameDataVersion = 'assessment-data-revision';
  a.speciesAssessment.versions.gameDataVersion = 'assessment-data-revision';
  a.accountAssessment.versions.gameDataVersion = 'assessment-data-revision';
  a.skillRules.skills.healing.version = 'effect-table-revision';
  let r = model.evaluateCandidate(a);
  assert.equal(r.scenario.status, 'ready'); assert.equal(r.speciesAssessment.tier, 'A');
  assert.equal(r.recommendation.action, 'invest');
  a.accountAssessment.versions.gameDataVersion = 'old-assessment-data';
  r = model.evaluateCandidate(a);
  assert.equal(r.scenario.status, 'ready'); assert.equal(r.accountAssessment.status, 'stale');
  assert.equal(r.recommendation.action, 'needs_data');
  a.accountAssessment.versions.gameDataVersion = 'assessment-data-revision';
  a.skillRules.skills.healing.version = 'old-effect-table';
  r = model.evaluateCandidate(a);
  assert.equal(r.accountAssessment.status, 'provisional'); assert.equal(r.scenario.status, 'stale');
});
test('registered-individual whitelist rejects unknown IDs without manufacturing a new individual', () => {
  const a = fixture(); a.registeredIndividualIds = ['REGISTERED-OTHER'];
  let r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, null); assert.ok(codes(r).includes('INDIVIDUAL_NOT_REGISTERED'));
  a.registeredIndividualIds = ['TEST-1']; r = model.calculateScenario(a);
  assert.equal(r.requiredSeeds, 3);
  a.registeredIndividualIds = []; assert.equal(model.calculateScenario(a).requiredSeeds, null);
  a.registeredIndividualIds = 'TEST-1';
  assert.ok(codes(model.calculateScenario(a)).includes('INVALID_INDIVIDUAL_REGISTRY'));
});
test('stored current-level strings, false and numeric zero are not coerced into valid levels', () => {
  for (const current of ['3', '', ' ', false, true, 0, -1, 1.5, Infinity, NaN]) {
    const a = fixture(); a.individual.currentSkillLevel = current;
    const r = model.calculateScenario(a);
    assert.equal(r.requiredSeeds, null, String(current));
    assert.ok(codes(r).includes('INVALID_CURRENT_SKILL_LEVEL'), String(current));
  }
});
test('unknown rule key and unsupported numeric rule caps stay unavailable', () => {
  const a = fixture(); a.individual.mainSkillKey = 'unknown'; a.scenario.skillKey = 'unknown';
  assert.ok(codes(model.calculateScenario(a)).includes('MISSING_SKILL_CAP'));
  for (const cap of [null, '6', 0, false, 2.5, Infinity]) {
    const b = fixture(); b.skillRules.skills.healing.maxLevel = cap;
    assert.equal(model.calculateScenario(b).requiredSeeds, null, String(cap));
  }
});
test('a real zero effect is preserved; missing, null and string effects are not zero', () => {
  const a = fixture(); a.skillRules.skills.healing.effects[3] = 0;
  a.skillRules.skills.healing.effects[6] = 0;
  let r = model.calculateScenario(a);
  assert.equal(r.perTriggerDelta.before, 0); assert.equal(r.perTriggerDelta.delta, 0);
  for (const effect of [null, undefined, '0', false, NaN]) {
    a.skillRules.skills.healing.effects[3] = effect; r = model.calculateScenario(a);
    assert.equal(r.perTriggerDelta, null); assert.equal(r.requiredSeeds, 3);
  }
});
test('whitespace provenance does not qualify as an explicit recommendation source', () => {
  const a = explicit(fixture()); a.scenario.recommendation.source = '  ';
  assert.equal(model.evaluateCandidate(a).recommendation.sourceExplicit, false);
});
test('dated confirmed observations require live reconfirmation, without blocking reference cost or tier', () => {
  const a = fixture(); a.stocks.mainSkillSeed.observedAt = '2026-09-28';
  let r = model.evaluateCandidate(a);
  assert.equal(r.scenario.requiredSeeds, 3); assert.equal(r.accountAssessment.tier, 'S');
  assert.equal(r.execution.feasible, false); assert.equal(r.execution.stock.available, null);
  assert.equal(r.execution.stock.reportedValue, 8);
  assert.ok(r.execution.reasonCodes.includes('STOCK_NOT_CURRENT'));
  let budget = model.evaluateBudget({proposals: [r], selectedIds: ['PLAN-1'], stocks: a.stocks});
  assert.equal(budget.feasible, false); assert.equal(budget.resources[0].available, null);
  a.stocks.mainSkillSeed.currentConfirmed = true;
  r = model.evaluateCandidate(a);
  assert.equal(r.execution.feasible, true); assert.equal(r.execution.stock.available, 8);
  budget = model.evaluateBudget({proposals: [r], selectedIds: ['PLAN-1'], stocks: a.stocks});
  assert.equal(budget.feasible, true);
});
test('dated confirmed zero remains a recorded zero and becomes insufficient only on current confirmation', () => {
  const a = fixture(); Object.assign(a.stocks.mainSkillSeed, {value: 0, observedAt: '2026-11-01'});
  let r = model.evaluateCandidate(a);
  assert.equal(r.execution.stock.reportedValue, 0); assert.equal(r.execution.stock.available, null);
  assert.ok(r.execution.reasonCodes.includes('STOCK_NOT_CURRENT'));
  a.stocks.mainSkillSeed.currentConfirmed = true; r = model.evaluateCandidate(a);
  assert.equal(r.execution.stock.available, 0);
  assert.ok(r.execution.reasonCodes.includes('INSUFFICIENT_STOCK'));
  assert.equal(r.execution.reasonCodes.includes('STOCK_NOT_CURRENT'), false);
});
test('all published active individuals remain read-only and never receive an automatic recommendation', () => {
  const sandbox = {window: {}};
  for (const file of ['data.js', 'seed-data.js'])
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  const app = sandbox.window.APP_DATA, data = sandbox.window.SEED_INVESTMENT_DATA;
  const actualRules = require('../seed-rules.js');
  assert.equal(app.meta.revision, data.meta.sourceRevision);
  assert.equal(app.meta.sourceSha256, data.meta.sourceSha256);
  assert.equal(data.meta.individualCount, data.individuals.length);
  const current = {sourceRevision: data.meta.sourceRevision, modelVersion: data.meta.modelVersion,
    gameDataVersion: data.meta.gameDataVersion, rulesVersion: actualRules.DATA_VERSION};
  const snapshot = JSON.stringify(data), ids = data.individuals.map(p => p.id);
  for (const p of data.individuals) {
    const rule = actualRules.getSkill(p.mainSkillKey);
    const r = model.evaluateCandidate({individual: p, accountAssessment: p.accountAssessment,
      scenario: {id: 'integration:' + p.id, individualId: p.id, skillKey: p.mainSkillKey,
        targetSkillLevel: rule ? rule.maxLevel : null, timing: 'now', seedType: 'mainSkillSeed',
        versions: {sourceRevision: current.sourceRevision, modelVersion: current.modelVersion,
          gameDataVersion: current.gameDataVersion}},
      skillRules: actualRules, currentVersions: current, stocks: data.resources, registeredIndividualIds: ids});
    assert.equal(r.eligible, true, p.id);
    assert.equal(r.recommendation.action, 'needs_data', p.id);
    assert.equal(r.recommendation.approved, false, p.id);
    assert.equal(r.execution.canExecute, false, p.id);
    if (rule && Number.isSafeInteger(p.currentSkillLevel) && p.currentSkillLevel > 0)
      assert.equal(r.scenario.requiredSeeds, Math.max(0, rule.maxLevel - p.currentSkillLevel), p.id);
    else assert.equal(r.scenario.requiredSeeds, null, p.id);
  }
  assert.equal(JSON.stringify(data), snapshot);
});
