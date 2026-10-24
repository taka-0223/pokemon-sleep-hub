/* Scoped CURRENT judgments layered after the facts-only overlay. */
(function (global) {
  'use strict';
  const CURRENT_FIELDS = Object.freeze([
    'disposition', 'refinement', 'targetLevel', 'priority', 'rationale'
  ]);
  const ROLE_FIELDS = Object.freeze([
    'roleId', 'roleKey', 'roleName', 'roleType', 'roleNeed',
    'searchStatus', 'rolePriority'
  ]);
  const SOURCE_FIELDS = Object.freeze([
    'id', 'decisionDate', 'decisionStatus', ...CURRENT_FIELDS, ...ROLE_FIELDS
  ]);
  const ROLE_ASSIGNMENT_FIELDS = Object.freeze([
    'id', 'incumbent', 'backup', 'need', 'search', 'priority', 'reviewDate', 'recentNote'
  ]);
  function applyDecisions(base, incoming) {
    if (!base || !base.meta || !Array.isArray(base.individuals) ||
        !Array.isArray(base.roles) || !incoming || !incoming.meta ||
        !Array.isArray(incoming.decisions) || !Array.isArray(incoming.roleAssignments))
      throw new Error('評価データの入力形式が不正です');
    const meta = incoming.meta;
    if (meta.mode !== 'dated-individual-decisions' ||
        meta.sourceRevision !== base.meta.currentFactsRevision ||
        meta.compatibleLegacyRevision !== base.meta.legacyDecisionRevision ||
        !/^\d{4}-\d{2}-\d{2}$/.test(meta.cutoffDate) ||
        !/^\d{4}-\d{2}-\d{2}-r\d+$/.test(meta.sourceRevision))
      throw new Error('手持ち・評価データのrevisionが一致しません');
    if (!Number.isInteger(meta.decisionCount) ||
        incoming.decisions.length !== meta.decisionCount ||
        meta.decisionCount < 1 ||
        !Number.isInteger(meta.roleCount) || meta.roleCount !== incoming.roleAssignments.length)
      throw new Error('評価レコード件数に不整合があります');
    const known = new Map(base.individuals.map(x => [x.id, x]));
    const roles = new Set(base.roles.map(x => x.id));
    const assignments = new Map();
    for (const r of incoming.roleAssignments) {
      if (!r || !roles.has(r.id) || assignments.has(r.id) ||
          ROLE_ASSIGNMENT_FIELDS.some(k => !Object.prototype.hasOwnProperty.call(r, k)) ||
          Object.keys(r).some(k => !ROLE_ASSIGNMENT_FIELDS.includes(k)) ||
          (r.incumbent && !known.has(r.incumbent)) ||
          (r.backup && !known.has(r.backup)) ||
          (r.incumbent && r.incumbent === r.backup) ||
          (r.recentNote != null && (typeof r.recentNote !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(r.reviewDate) ||
            r.reviewDate < meta.cutoffDate)) ||
          !['高','中','低'].includes(r.priority))
        throw new Error('CURRENTのRoleSlot割当が不正です');
      assignments.set(r.id,r);
    }
    if (assignments.size !== roles.size)
      throw new Error('CURRENTのRoleSlot件数・IDが不一致です');
    const seen = new Set();
    const next = base.individuals.map(x => ({...x}));
    const byId = new Map(next.map(x => [x.id, x]));
    for (const d of incoming.decisions) {
      if (!d || typeof d.id !== 'string' || seen.has(d.id) || !known.has(d.id) ||
          SOURCE_FIELDS.some(k => !Object.prototype.hasOwnProperty.call(d, k)) ||
          Object.keys(d).some(k => !SOURCE_FIELDS.includes(k)))
        throw new Error('評価IDまたは許可フィールドに不整合があります');
      seen.add(d.id);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.decisionDate) ||
          d.decisionDate < meta.cutoffDate ||
          d.decisionDate > meta.sourceRevision.slice(0, 10) ||
          !['active', 'provisional'].includes(d.decisionStatus))
        throw new Error('評価日・承認状態が不正です: ' + d.id);
      if (d.priority != null && (!Number.isInteger(d.priority) || d.priority < 1))
        throw new Error('優先順位が不正です: ' + d.id);
      if (d.roleId != null && !roles.has(d.roleId))
        throw new Error('RoleSlotの参照が不正です: ' + d.id);
      for (const field of ['disposition', 'refinement', 'rationale']) {
        if (d[field] != null && typeof d[field] !== 'string')
          throw new Error('評価テキストが不正です: ' + d.id + '.' + field);
      }
      const individual = byId.get(d.id);
      for (const key of CURRENT_FIELDS) individual[key] = d[key];
      // Do not reassign established roles based on older RoleSlot snapshots.
      // New individuals have no legacy assignment, so use the CURRENT row.
      if (!individual.roleId) for (const key of ROLE_FIELDS) individual[key] = d[key];
      individual.currentDecisionDate = d.decisionDate;
      individual.currentDecisionStatus = d.decisionStatus;
      individual.decisionSnapshot = meta.sourceRevision;
      // Formal individual quality and species Tier deliberately remain outside
      // this dated decision layer, even for active decisions.
    }
    return {
      ...base,
      meta: {...base.meta, currentDecisionRevision: meta.sourceRevision,
             currentDecisionCount: seen.size, currentDecisionCutoff: meta.cutoffDate,
             currentAssignmentsRevision: meta.sourceRevision,
             currentAssignmentsCount: assignments.size},
      individuals: next,
      roles: base.roles.map(old => {
        const a=assignments.get(old.id);
        return {...old, incumbent:a.incumbent, backup:a.backup,
                need:a.need, search:a.search, priority:a.priority,
                note:a.recentNote!=null?a.recentNote:old.note,
                assignmentSnapshot:meta.sourceRevision, assignmentReviewDate:a.reviewDate,
                recentNoteSnapshot:a.recentNote!=null?meta.sourceRevision:null};
      }),
    };
  }

  const base = global.APP_DATA;
  try {
    const merged = applyDecisions(base, global.APP_CURRENT_DECISIONS);
    global.APP_DATA = merged;
    global.APP_DECISIONS_STATUS = {applied:true, revision:merged.meta.currentDecisionRevision,
      count:merged.meta.currentDecisionCount};
  } catch (e) {
    global.APP_DECISIONS_STATUS = {applied:false, error:String(e.message || e)};
    // Keep the r35 facts and historical reference judgments usable.
  }
  if (typeof module !== 'undefined' && module.exports)
    module.exports = {applyDecisions, CURRENT_FIELDS, ROLE_FIELDS, SOURCE_FIELDS, ROLE_ASSIGNMENT_FIELDS};
})(typeof window !== 'undefined' ? window : globalThis);
