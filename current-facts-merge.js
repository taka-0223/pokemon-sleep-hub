/* Emergency CURRENT facts layer: does not publish or mutate disputed decisions. */
(function (global) {
  'use strict';
  const FIELDS = Object.freeze([
    'id', 'name', 'level', 'targetSpeciesName', 'mainSkill', 'mainSkillLv', 'shiny',
    'foods', 'foodPattern', 'nature', 'natureUp', 'natureDown',
    'subskills', 'primaryMetric', 'primaryPR', 'primaryEvalLv',
    'topPercent', 'measurements'
  ]);
  const DECISIONS = Object.freeze([
    'quality', 'disposition', 'refinement', 'targetLevel', 'priority',
    'rationale', 'roleId', 'roleKey', 'roleName', 'roleType', 'roleNeed',
    'searchStatus', 'rolePriority', 'speciesGrade'
  ]);
  function applyFacts(base, incoming) {
    if (!base || !incoming || !base.meta || !incoming.meta ||
        !Array.isArray(base.individuals) || !Array.isArray(incoming.individuals) ||
        !Array.isArray(incoming.inactiveIndividualIds) ||
        !Array.isArray(base.roles) || !Array.isArray(incoming.coverageMatrix) ||
        !incoming.resources || typeof incoming.resources !== 'object')
      throw new Error('個体・役割・資源の入力形式が不正です');
    const factsMeta = incoming.meta;
    if (factsMeta.mode !== 'facts-only-provisional' ||
        factsMeta.compatibleLegacyRevision !== base.meta.revision ||
        !/^\d{4}-\d{2}-\d{2}-r\d+$/.test(factsMeta.sourceRevision))
      throw new Error('CURRENTと旧評価のrevisionが一致しません');
    if (incoming.individuals.length !== factsMeta.individualCount ||
        incoming.individuals.some(x => !x || typeof x.id !== 'string') ||
        new Set(incoming.individuals.map(x => x && x.id)).size !== incoming.individuals.length)
      throw new Error('手持ち個体の件数・IDに不整合があります');
    const inactive = new Set(incoming.inactiveIndividualIds);
    if (inactive.size !== incoming.inactiveIndividualIds.length ||
        incoming.individuals.length + inactive.size !== factsMeta.sourceIndividualCount ||
        incoming.inactiveIndividualIds.some(id => !/^IND-\d{4}$/.test(id)) ||
        incoming.individuals.some(x => inactive.has(x.id)))
      throw new Error('非アクティブ個体のID・件数に不整合があります');
    const known = new Map(base.individuals.map(x => [x.id, x]));
    for (const id of known.keys()) {
      if (!incoming.individuals.some(x => x && x.id === id) && !inactive.has(id))
        throw new Error('処遇記録のない過去個体が欠落しています: ' + id);
    }
    const next = incoming.individuals.map(f => {
      if (!f || !/^IND-\d{4}$/.test(f.id)) throw new Error('個体IDが不正です');
      // Validate expected fact keys and never copy unapproved decision fields
      // even if an erroneous current-facts.js contains them.
      if (!FIELDS.every(k => Object.prototype.hasOwnProperty.call(f, k)))
        throw new Error('個体の固定事実が欠けています: ' + f.id);
      if (f.primaryPR != null &&
          (typeof f.primaryPR !== 'number' || f.primaryPR < 0 || f.primaryPR > 100))
        throw new Error('PRの値が不正です: ' + f.id);
      if (f.shiny !== null && typeof f.shiny !== 'boolean')
        throw new Error('色違いの事実値が不正です: ' + f.id);
      const legacy = known.get(f.id);
      const individual = legacy ? {...legacy} : Object.fromEntries(DECISIONS.map(k => [k,null]));
      for (const k of FIELDS) individual[k] = f[k];
      if (legacy) {
        individual.decisionSnapshot = base.meta.revision;
      } else {
        individual.decisionSnapshot = null;
      }
      return individual;
    });
    if (next.filter(x => x.primaryPR != null).length !== factsMeta.prMeasuredCount)
      throw new Error('PR測定済み個体数に不整合があります');
    if (incoming.coverageMatrix.length !== base.coverageMatrix.length ||
        new Set(incoming.coverageMatrix.map(x => x.id)).size !== incoming.coverageMatrix.length ||
        base.coverageMatrix.some(x => !incoming.coverageMatrix.some(y => y.id === x.id)))
      throw new Error('CoverageのIDが不一致です');
    const result = {
      ...base,
      meta: {...base.meta, currentFactsRevision: factsMeta.sourceRevision,
             currentFactsCount: next.length, currentFactsMeasured: factsMeta.prMeasuredCount,
             legacyDecisionRevision: base.meta.revision, overlayMode: factsMeta.mode,
             inactiveFactsCount: inactive.size},
      individuals: next,
      // Keep the original published candidate Tiers, quality, roles, and
      // priorities as *historical references*, never as current decisions.
      roles: base.roles,
      resources: incoming.resources,
      coverageMatrix: incoming.coverageMatrix
    };
    return result;
  }
  const base = global.APP_DATA;
  try {
    const merged = applyFacts(base, global.APP_CURRENT_FACTS);
    global.APP_DATA = merged;
    global.APP_FACTS_STATUS = {applied: true, revision: merged.meta.currentFactsRevision,
      decisionRevision: merged.meta.legacyDecisionRevision, count: merged.individuals.length};
  } catch (e) {
    global.APP_FACTS_STATUS = {applied: false, error: String(e.message || e),
      revision: base && base.meta ? base.meta.revision : null};
    // A broken sidecar must not blank the existing published application.
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {applyFacts, FIELDS, DECISIONS};
})(typeof window !== 'undefined' ? window : globalThis);
