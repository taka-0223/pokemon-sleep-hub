/*
 * Main-skill seed investment model. Pure, read-only calculations, not a game client.
 * A tier, a calculable cost and an explicit recommendation are independent facts.
 * Legacy mainSeedCap/seeds/PR fields are deliberately never consulted.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SeedModel = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const MODEL_VERSION = 'seed-v1';
  const STATUSES = ['validated', 'provisional', 'unassessed', 'stale'];
  const APPLICABILITIES = ['broad', 'conditional', 'not_applicable', 'unknown'];
  const ACTIONS = ['invest', 'hold', 'skip', 'needs_data'];
  const TIERS = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C', 'D'];
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
  const record = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const text = x => typeof x === 'string' && x.trim().length > 0;
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const positive = x => integer(x) && x > 0;
  const copy = x => Array.isArray(x) ? x.map(copy) : x && typeof x === 'object'
    ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, copy(v)])) : x;
  function issue(issues, code, field, severity) {
    issues.push({code, field: field || null, severity: severity || 'missing'});
  }
  function versionIssues(value, expected, keys, issues, field) {
    const row = record(value), versions = record(row.versions), current = record(expected);
    for (const key of keys) {
      if (!text(current[key])) continue;
      const actual = own(versions, key) ? versions[key] : row[key];
      if (!text(actual)) issue(issues, 'VERSION_UNVERIFIED', field + '.' + key);
      else if (actual !== current[key]) issue(issues, 'STALE_VERSION', field + '.' + key, 'stale');
    }
  }
  function hasSource(value) {
    if (text(value)) return true;
    const source = record(value);
    return ['ref', 'id', 'url', 'file', 'sheet', 'rowId', 'row_id'].some(k => text(source[k]));
  }
  function statusFor(issues, conditional) {
    if (issues.some(x => x.severity === 'error')) return 'invalid';
    if (issues.some(x => x.severity === 'stale')) return 'stale';
    if (issues.some(x => x.severity === 'missing')) return 'needs_data';
    return conditional ? 'conditional' : 'ready';
  }

  /** Normalize supplied evidence only; this function does not invent a tier. */
  function normalizeAssessment(input, context) {
    const row = record(input), ctx = record(context), individual = record(ctx.individual);
    const issues = [];
    let status = STATUSES.includes(row.status) ? row.status : 'unassessed';
    let tier = TIERS.includes(row.tier) ? row.tier : null;
    const reportedTier = tier;
    const applicability = APPLICABILITIES.includes(row.applicability) ? row.applicability : 'unknown';
    let scope = ctx.kind === 'account' ? 'individual' : 'unknown';
    let appliesNow = null;
    if (row.tier != null && !TIERS.includes(row.tier)) issue(issues, 'INVALID_TIER', 'tier', 'error');
    if (ctx.kind === 'species' && text(row.speciesKey)) {
      if (row.speciesKey === individual.currentSpeciesKey) { scope = 'current_species'; appliesNow = true; }
      else if (row.speciesKey === individual.targetSpeciesKey) { scope = 'target_species'; appliesNow = false; }
      else { scope = 'mismatch'; issue(issues, 'SPECIES_ASSESSMENT_MISMATCH', 'speciesKey', 'error'); }
    }
    if (ctx.kind === 'account' && text(row.individualId) && row.individualId !== individual.id)
      issue(issues, 'INDIVIDUAL_ASSESSMENT_MISMATCH', 'individualId', 'error');
    if (tier !== null && (status === 'validated' || status === 'provisional')) {
      if (ctx.kind === 'species' && !text(row.speciesKey)) issue(issues, 'ASSESSMENT_SCOPE_UNKNOWN', 'speciesKey');
      if (ctx.kind === 'account' && !text(row.individualId)) issue(issues, 'ASSESSMENT_SCOPE_UNKNOWN', 'individualId');
      versionIssues(row, ctx.currentVersions,
        ctx.kind === 'account' ? ['sourceRevision', 'modelVersion', 'gameDataVersion'] : ['modelVersion', 'gameDataVersion'],
        issues, 'assessment');
    }
    if (status === 'stale' || issues.some(x => x.severity === 'stale')) status = 'stale';
    else if (issues.some(x => x.severity === 'error' || x.severity === 'missing')) status = 'unassessed';
    if (status === 'unassessed' || status === 'stale') tier = null;
    return {
      tier, reportedTier, status, applicability, scope, appliesNow,
      speciesKey: text(row.speciesKey) ? row.speciesKey : null,
      individualId: text(row.individualId) ? row.individualId : null,
      profileId: row.profileId || row.benchmarkId || null,
      conditions: Array.isArray(row.conditions) ? copy(row.conditions) : [],
      rationale: typeof row.rationale === 'string' ? row.rationale : null,
      source: copy(row.source || null), versions: copy(row.versions || {}), issues
    };
  }

  function resolveRule(skillKey, skillRules) {
    const rules = record(skillRules), skills = record(rules.skills || rules);
    if (text(skillKey) && own(skills, skillKey)) return {key: skillKey, rule: record(skills[skillKey])};
    if (typeof rules.resolveSkillKey === 'function' && text(skillKey)) {
      const key = rules.resolveSkillKey(skillKey);
      if (text(key) && own(skills, key)) return {key, rule: record(skills[key])};
    }
    return {key: text(skillKey) ? skillKey : null, rule: {}};
  }

  /**
   * Scenario contract:
   * {id, individualId, skillKey, targetSkillLevel, timing:'now'|'after_prerequisites',
   *  seedType:'mainSkillSeed'|explicitResourceKey, versions,
   *  prerequisites:[{id,type:'evolution'|'subskill',skillLevelGain,verified:true,
   *    completed:false,beforeInvestment:true,speciesKeyAfter?}]}
   * Completed gains are already represented by currentSkillLevel and never re-added.
   */
  function calculateScenario(input) {
    const args = record(input), p = record(args.individual), plan = record(args.scenario);
    const issues = [], unmetPrerequisiteIds = [];
    const result = {
      id: text(plan.id) ? plan.id : null,
      individualId: text(p.id) ? p.id : null,
      status: 'needs_data', timing: plan.timing || null,
      seedType: text(plan.seedType) ? plan.seedType : null,
      skillKey: null, currentSkillLevel: positive(p.currentSkillLevel) ? p.currentSkillLevel : null,
      baselineSkillLevel: null, targetSkillLevel: positive(plan.targetSkillLevel) ? plan.targetSkillLevel : null,
      effectiveTargetSkillLevel: null, skillCap: null, requiredSeeds: null,
      scopeSpeciesKey: p.currentSpeciesKey || null,
      unmetPrerequisiteIds, prerequisites: [], perTriggerDelta: null,
      referenceOnly: true, versions: copy(plan.versions || {}), issues
    };
    if (p.active === false) {
      issue(issues, 'INDIVIDUAL_INACTIVE', 'individual.active', 'error');
      result.status = 'ineligible';
      return result;
    }
    if (p.active !== true) issue(issues, 'ACTIVE_STATUS_UNKNOWN', 'individual.active');
    if (!text(p.id)) issue(issues, 'MISSING_INDIVIDUAL_ID', 'individual.id');
    if (args.registeredIndividualIds != null) {
      if (!Array.isArray(args.registeredIndividualIds)) issue(issues, 'INVALID_INDIVIDUAL_REGISTRY', 'registeredIndividualIds', 'error');
      else if (!args.registeredIndividualIds.includes(p.id)) issue(issues, 'INDIVIDUAL_NOT_REGISTERED', 'individual.id', 'error');
    }
    if (text(plan.individualId) && plan.individualId !== p.id)
      issue(issues, 'SCENARIO_INDIVIDUAL_MISMATCH', 'scenario.individualId', 'error');
    if (!text(plan.individualId)) issue(issues, 'MISSING_SCENARIO_INDIVIDUAL', 'scenario.individualId');
    if (p.currentSkillLevel == null) issue(issues, 'MISSING_CURRENT_SKILL_LEVEL', 'individual.currentSkillLevel');
    else if (!positive(p.currentSkillLevel)) issue(issues, 'INVALID_CURRENT_SKILL_LEVEL', 'individual.currentSkillLevel', 'error');
    if (p.skillLevelBasis === 'temporary' || p.includesTemporarySkillBonus === true)
      issue(issues, 'TEMPORARY_LEVEL_NOT_BASELINE', 'individual.currentSkillLevel', 'error');
    if (plan.targetSkillLevel == null) issue(issues, 'MISSING_TARGET_SKILL_LEVEL', 'scenario.targetSkillLevel');
    else if (!positive(plan.targetSkillLevel)) issue(issues, 'INVALID_TARGET_SKILL_LEVEL', 'scenario.targetSkillLevel', 'error');
    if (plan.timing == null) issue(issues, 'MISSING_TIMING', 'scenario.timing');
    else if (!['now', 'after_prerequisites'].includes(plan.timing)) issue(issues, 'INVALID_TIMING', 'scenario.timing', 'error');
    if (!result.seedType) issue(issues, 'MISSING_SEED_TYPE', 'scenario.seedType');
    const selectedSkill = text(plan.skillKey) ? plan.skillKey : p.mainSkillKey;
    const resolved = resolveRule(selectedSkill, args.skillRules);
    result.skillKey = resolved.key;
    if (!text(p.mainSkillKey)) issue(issues, 'MISSING_CURRENT_SKILL_KEY', 'individual.mainSkillKey');
    const currentSkill = resolveRule(p.mainSkillKey, args.skillRules).key;
    if (text(plan.skillKey) && text(currentSkill) && resolved.key !== currentSkill)
      issue(issues, 'SKILL_CHANGE_UNMODELED', 'scenario.skillKey', 'error');
    const rule = resolved.rule;
    if (!text(selectedSkill)) issue(issues, 'MISSING_SKILL_KEY', 'individual.mainSkillKey');
    if (!positive(rule.maxLevel)) issue(issues, 'MISSING_SKILL_CAP', 'skillRules.maxLevel');
    else {
      result.skillCap = rule.maxLevel;
      if (positive(p.currentSkillLevel) && p.currentSkillLevel > rule.maxLevel)
        issue(issues, 'CURRENT_EXCEEDS_CAP', 'individual.currentSkillLevel', 'error');
      if (positive(plan.targetSkillLevel) && plan.targetSkillLevel > rule.maxLevel)
        issue(issues, 'TARGET_EXCEEDS_CAP', 'scenario.targetSkillLevel', 'error');
    }
    versionIssues(p, args.currentVersions, ['sourceRevision'], issues, 'individual');
    versionIssues(plan, args.currentVersions, ['sourceRevision', 'modelVersion', 'gameDataVersion'], issues, 'scenario');
    // Assessment/account data provenance and the effect-table revision are distinct.
    // Neither is assumed to be the official game's application version.
    if (text(record(args.currentVersions).rulesVersion)) {
      const actual = rule.version || record(args.skillRules).version || record(args.skillRules).DATA_VERSION;
      if (!text(actual)) issue(issues, 'VERSION_UNVERIFIED', 'skillRules.rulesVersion');
      else if (actual !== args.currentVersions.rulesVersion) issue(issues, 'STALE_VERSION', 'skillRules.rulesVersion', 'stale');
    }
    const steps = Array.isArray(plan.prerequisites) ? plan.prerequisites : [];
    if (plan.prerequisites != null && !Array.isArray(plan.prerequisites))
      issue(issues, 'INVALID_PREREQUISITES', 'scenario.prerequisites', 'error');
    if (plan.timing === 'after_prerequisites' && steps.length === 0)
      issue(issues, 'PREREQUISITES_REQUIRED', 'scenario.prerequisites');
    let baseline = result.currentSkillLevel, evolutionCount = 0;
    const seenSteps = new Set();
    for (let index = 0; index < steps.length; index++) {
      const step = record(steps[index]), field = 'scenario.prerequisites.' + index;
      const id = text(step.id) ? step.id : 'prerequisite-' + index;
      if (seenSteps.has(id)) issue(issues, 'DUPLICATE_PREREQUISITE', field, 'error');
      seenSteps.add(id);
      if (step.completed === true) {
        if (step.includedInCurrent !== true) issue(issues, 'COMPLETED_GAIN_UNRECONCILED', field);
        result.prerequisites.push({id, completed: true, appliedGain: 0, includedInCurrent: step.includedInCurrent === true});
        continue;
      }
      if (step.completed !== false) issue(issues, 'PREREQUISITE_COMPLETION_UNKNOWN', field);
      unmetPrerequisiteIds.push(id);
      if (plan.timing === 'now') issue(issues, 'FUTURE_GAIN_NOT_ALLOWED', field, 'error');
      if (step.beforeInvestment !== true) issue(issues, 'PREREQUISITE_ORDER_UNKNOWN', field);
      if (step.verified !== true) issue(issues, 'PREREQUISITE_GAIN_UNVERIFIED', field);
      if (!['evolution', 'subskill'].includes(step.type)) issue(issues, 'INVALID_PREREQUISITE_TYPE', field, 'error');
      if (!positive(step.skillLevelGain)) issue(issues, 'INVALID_PREREQUISITE_GAIN', field, 'error');
      if (step.type === 'evolution') evolutionCount++;
      if (step.skillKeyAfter != null && step.skillKeyAfter !== result.skillKey)
        issue(issues, 'SKILL_CHANGE_UNMODELED', field + '.skillKeyAfter', 'error');
      const before = baseline;
      if (plan.timing === 'after_prerequisites' && step.completed === false && step.beforeInvestment === true &&
          step.verified === true && positive(step.skillLevelGain) && baseline !== null && result.skillCap !== null) {
        baseline = Math.min(result.skillCap, baseline + step.skillLevelGain);
        if (text(step.speciesKeyAfter)) result.scopeSpeciesKey = step.speciesKeyAfter;
      }
      result.prerequisites.push({id, type: step.type || null, completed: false,
        appliedGain: baseline !== null && before !== null ? baseline - before : null});
    }
    if (evolutionCount > 0) {
      if (!integer(p.remainingEvolutions)) issue(issues, 'REMAINING_EVOLUTIONS_UNKNOWN', 'individual.remainingEvolutions');
      else if (evolutionCount > p.remainingEvolutions) issue(issues, 'EXCESS_EVOLUTION_EVENTS', 'scenario.prerequisites', 'error');
    }
    result.status = statusFor(issues, unmetPrerequisiteIds.length > 0);
    // Invalid/stale/missing premises cannot yield an authoritative numeric count.
    if (!['ready', 'conditional'].includes(result.status)) return result;
    result.baselineSkillLevel = baseline;
    result.effectiveTargetSkillLevel = Math.max(baseline, plan.targetSkillLevel);
    result.requiredSeeds = Math.max(0, plan.targetSkillLevel - baseline);
    const effects = Array.isArray(rule.effects) ? rule.effects : [];
    const before = effects[baseline], after = effects[result.effectiveTargetSkillLevel];
    if (Number.isFinite(before) && Number.isFinite(after) && text(rule.unit)) {
      result.perTriggerDelta = {
        unit: rule.unit, unitLabel: rule.unitLabel || null, before, after, delta: after - before,
        fromSkillLevel: baseline, toSkillLevel: result.effectiveTargetSkillLevel,
        metric: 'fixed_trigger_difference', includesProcFrequency: false, includesTeamEnergy: false,
        evidenceType: rule.evidenceType || null, checkedAt: rule.checkedAt || null,
        version: rule.version || null,
        limitations: copy(Array.isArray(rule.limitations) ? rule.limitations : []),
        sources: copy([...(rule.source ? [rule.source] : []), ...(Array.isArray(rule.corroboratingSources) ? rule.corroboratingSources : [])])
      };
    } else issue(issues, 'EFFECT_UNMEASURED', 'skillRules.effects', 'info');
    return result;
  }

  function stockAvailability(stock) {
    const reasonCodes = [];
    const numeric = stock.certainty === 'confirmed' && integer(stock.value);
    if (!numeric) reasonCodes.push(stock.certainty === 'confirmed' ? 'STOCK_INVALID' : 'STOCK_UNCONFIRMED');
    // A ledger observation, even a confirmed one, is not a live inventory check.
    // There is no arbitrary TTL: the caller must explicitly reconfirm it for use.
    const current = !own(stock, 'observedAt') || stock.currentConfirmed === true;
    if (!current) reasonCodes.push('STOCK_NOT_CURRENT');
    return {known: numeric && current, reasonCodes};
  }

  function inspectStock(seedType, amount, speciesKey, stocks) {
    const stock = record(record(stocks)[seedType]);
    const availability = stockAvailability(stock);
    const known = availability.known, reasonCodes = availability.reasonCodes.slice();
    if (seedType !== 'mainSkillSeed') {
      if (!Array.isArray(stock.allowedSpeciesKeys) || stock.allowedSpeciesKeys.length === 0)
        reasonCodes.push('SEED_APPLICABILITY_UNKNOWN');
      else if (!text(speciesKey) || !stock.allowedSpeciesKeys.includes(speciesKey)) reasonCodes.push('SEED_SPECIES_MISMATCH');
    }
    if (known && amount > stock.value) reasonCodes.push('INSUFFICIENT_STOCK');
    return {seedType, required: amount, available: known ? stock.value : null,
      reportedValue: own(stock, 'reportedValue') ? stock.reportedValue : own(stock, 'value') ? stock.value : null,
      certainty: stock.certainty || 'unknown', feasible: reasonCodes.length === 0, reasonCodes};
  }

  /** Assess a supplied proposal. No ranking, spending, approval or reservation occurs. */
  function evaluateCandidate(input) {
    const args = record(input), p = record(args.individual), plan = record(args.scenario);
    const speciesAssessment = normalizeAssessment(args.speciesAssessment || p.speciesAssessment,
      {kind: 'species', individual: p, currentVersions: args.currentVersions});
    const accountAssessment = normalizeAssessment(args.accountAssessment || p.accountAssessment,
      {kind: 'account', individual: p, currentVersions: args.currentVersions});
    const scenario = calculateScenario(args);
    const accountRow = record(args.accountAssessment || p.accountAssessment);
    const candidateRecommendation = own(plan, 'recommendation') ? record(plan.recommendation)
      : accountRow.scenarioId === plan.id && text(plan.id) ? record(accountRow.recommendation) : {};
    const sourceExplicit = candidateRecommendation.explicit === true && hasSource(candidateRecommendation.source) &&
      ACTIONS.includes(candidateRecommendation.action);
    const recommendation = {
      action: sourceExplicit ? candidateRecommendation.action : 'needs_data',
      requestedAction: sourceExplicit ? candidateRecommendation.action : null,
      sourceExplicit, source: sourceExplicit ? copy(candidateRecommendation.source) : null,
      approved: false, reasonCodes: sourceExplicit ? [] : ['NO_EXPLICIT_RECOMMENDATION']
    };
    const staleAssessment = [speciesAssessment, accountAssessment].some(x => x.status === 'stale');
    if (sourceExplicit && (scenario.status === 'stale' || staleAssessment)) {
      recommendation.action = 'needs_data'; recommendation.reasonCodes.push('STALE_EVIDENCE');
    }
    if (sourceExplicit && ['invalid', 'needs_data', 'ineligible'].includes(scenario.status)) {
      recommendation.action = 'needs_data'; recommendation.reasonCodes.push('SCENARIO_NOT_READY');
    }
    if (sourceExplicit && recommendation.action === 'invest' && scenario.requiredSeeds === 0) {
      recommendation.action = 'needs_data'; recommendation.reasonCodes.push('RECOMMENDATION_TARGET_ALREADY_MET');
    }
    if (sourceExplicit && [speciesAssessment, accountAssessment].some(x => x.issues.some(i => i.severity === 'error'))) {
      recommendation.action = 'needs_data'; recommendation.reasonCodes.push('ASSESSMENT_SCOPE_INVALID');
    }
    const reasonCodes = [];
    let stock = null;
    if (p.active !== true) reasonCodes.push(p.active === false ? 'INDIVIDUAL_INACTIVE' : 'ACTIVE_STATUS_UNKNOWN');
    if (scenario.status !== 'ready') reasonCodes.push(scenario.status === 'conditional' ? 'PREREQUISITES_NOT_COMPLETED' : 'SCENARIO_NOT_READY');
    if (scenario.requiredSeeds === null) reasonCodes.push('SEED_COST_UNKNOWN');
    else if (scenario.requiredSeeds > 0) {
      stock = inspectStock(scenario.seedType, scenario.requiredSeeds, scenario.scopeSpeciesKey, args.stocks);
      reasonCodes.push(...stock.reasonCodes);
    }
    return {
      id: scenario.id, individualId: p.id || null, eligible: p.active === true,
      speciesAssessment, accountAssessment, scenario, recommendation,
      execution: {feasible: reasonCodes.length === 0, reasonCodes: [...new Set(reasonCodes)],
        stock, approved: false, canExecute: false},
      modelVersion: MODEL_VERSION
    };
  }

  /** Preview only explicitly selected proposals; different seed resources never substitute. */
  function evaluateBudget(input) {
    const args = record(input), proposals = Array.isArray(args.proposals) ? args.proposals : [];
    const selectedIds = Array.isArray(args.selectedIds) ? [...new Set(args.selectedIds)] : [];
    const issues = [], pools = new Map(), byId = new Map(), individuals = new Set();
    for (const proposal of proposals) {
      const p = record(proposal), id = p.id || record(p.scenario).id;
      if (!text(id)) continue;
      if (byId.has(id)) byId.set(id, null); else byId.set(id, p);
    }
    for (const id of selectedIds) {
      if (!text(id) || !byId.has(id)) { issue(issues, 'UNKNOWN_SELECTED_PROPOSAL', 'selectedIds', 'error'); continue; }
      const p = byId.get(id);
      if (!p) { issue(issues, 'DUPLICATE_PROPOSAL_ID', id, 'error'); continue; }
      const s = record(p.scenario);
      if (p.eligible !== true) issue(issues, 'INDIVIDUAL_INACTIVE_OR_UNKNOWN', id, 'error');
      if (!text(p.individualId) || p.individualId !== s.individualId)
        issue(issues, 'BUDGET_INDIVIDUAL_MISMATCH', id, 'error');
      if (!['ready', 'conditional'].includes(s.status) || !integer(s.requiredSeeds) || !text(s.seedType)) {
        issue(issues, 'SELECTED_COST_UNKNOWN', id); continue;
      }
      if (s.status === 'conditional') issue(issues, 'PREREQUISITES_NOT_COMPLETED', id);
      if (s.requiredSeeds === 0) continue;
      if (individuals.has(p.individualId)) issue(issues, 'ALTERNATIVE_PLANS_SELECTED', id, 'error');
      individuals.add(p.individualId);
      const single = inspectStock(s.seedType, s.requiredSeeds, s.scopeSpeciesKey, args.stocks);
      for (const code of single.reasonCodes.filter(c => c !== 'INSUFFICIENT_STOCK')) issue(issues, code, id);
      if (!pools.has(s.seedType)) pools.set(s.seedType, {seedType: s.seedType, required: 0, proposalIds: []});
      const pool = pools.get(s.seedType);
      if (!Number.isSafeInteger(pool.required + s.requiredSeeds)) issue(issues, 'BUDGET_OVERFLOW', id, 'error');
      else pool.required += s.requiredSeeds;
      pool.proposalIds.push(id);
    }
    const resources = [...pools.values()].map(pool => {
      const stock = record(record(args.stocks)[pool.seedType]);
      const known = stockAvailability(stock).known;
      const feasible = known && stock.value >= pool.required;
      if (known && !feasible) issue(issues, 'INSUFFICIENT_STOCK', pool.seedType);
      return {...pool, available: known ? stock.value : null, certainty: stock.certainty || 'unknown',
        remaining: known ? stock.value - pool.required : null, feasible};
    });
    return {selectedIds, resources, feasible: issues.length === 0, issues, reserved: false, approved: false, canExecute: false};
  }

  return Object.freeze({MODEL_VERSION, STATUSES: Object.freeze(STATUSES),
    APPLICABILITIES: Object.freeze(APPLICABILITIES), ACTIONS: Object.freeze(ACTIONS),
    normalizeAssessment, calculateScenario, evaluateCandidate, evaluateBudget});
});
