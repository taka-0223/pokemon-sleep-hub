#!/usr/bin/env python3
"""Build a supported public single-revision snapshot from private CURRENT.

Supports the audited r36 and seed-model r37 contracts only. Never commit XLSX.
Usage: python3 scripts/build_r36_snapshot.py /private/CURRENT_r37.xlsx data.js
"""
from __future__ import annotations
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from build_data import read_xlsx, dict_rows, verify_versioned_source_revision, boolean_flag

UNRATED = {"", "未測定", "未評価", "C（暫定）"}

REVISION_PROFILES = {
    "2026-10-25-r36": {"schemaVersion": "1.2", "appVersion": "0.20", "modelVersion": "r36"},
    "2026-11-01-r37": {"schemaVersion": "1.3", "appVersion": "0.21",
                       "modelVersion": "r36+seed-v1", "seedModelVersion": "seed-v1",
                       "gameDataVersion": "seed-effects-2026-11-01-v1"},
}

def revision_profile(revision: str | None) -> dict:
    """Do not label an unknown future workbook with an older model contract."""
    if revision not in REVISION_PROFILES:
        raise ValueError("Unsupported CURRENT revision: " + str(revision))
    return dict(REVISION_PROFILES[revision])

def build(workbook: Path, output: Path) -> dict:
    workbook = Path(workbook)
    wb = read_xlsx(workbook)
    revision = verify_versioned_source_revision(wb, workbook)
    profile = revision_profile(revision)
    with tempfile.TemporaryDirectory() as td:
        baseline = Path(td) / "generated-private.js"
        subprocess.run([sys.executable, str(Path(__file__).with_name("build_data.py")), str(workbook), str(baseline)], check=True, capture_output=True)
        raw = baseline.read_text(encoding="utf-8").strip()
        data = json.loads(raw.removeprefix("window.APP_DATA=").removesuffix(";"))
    inds = dict_rows(wb["P_Individuals"], "individual_id")
    assessments = dict_rows(wb["M_SpeciesAssessment"], "assessment_id")
    species = dict_rows(wb["M_Species"], "species_key")
    roles = dict_rows(wb["P_RoleSlots"], "role_slot_id")
    decisions = dict_rows(wb["D_Decisions"], "decision_id")
    coverage = dict_rows(wb["P_RoleCoverage"], "coverage_id")
    by_role = {r["role_slot_id"]: r for r in roles}
    by_individual = {r["individual_id"]: r for r in inds}
    by_decision = {d["individual_id"]: d for d in decisions}
    by_assessment = {(a["species_key"], a["role_key"]): a for a in assessments}
    by_species = {s["species_key"]: s for s in species}
    active_ids = {r["individual_id"] for r in inds if boolean_flag(r.get("active"), r["individual_id"] + ".active")}
    inactive_ids = {r["individual_id"] for r in inds} - active_ids
    if len(active_ids) != 35 or len(inactive_ids) != 8:
        raise ValueError("Supported CURRENT active/retired count mismatch")
    for p in data["individuals"]:
        iid = p["id"]
        if iid not in active_ids or iid not in by_decision:
            raise ValueError("Current decisions are missing " + iid)
        d = by_decision[iid]
        role = by_role.get(d.get("role_slot_id"), {})
        source_individual = by_individual[iid]
        a = by_assessment.get((source_individual.get("target_species_key"), role.get("role_key")), {})
        for out_key, column in (
            ("evaluationEvidence", "evaluation_evidence"), ("roleFit", "role_fit"),
            ("cookingContribution", "cooking_contribution"), ("investmentWindow", "investment_window"),
            ("resourceNextStep", "resource_next_step"), ("modelReviewReason", "model_review_reason"),
            ("modelReviewDate", "model_review_date"), ("currentDecisionDate", "decision_date"),
            ("currentDecisionStatus", "decision_status")):
            p[out_key] = d.get(column)
        p["quality"] = d.get("individual_quality") if d.get("individual_quality") not in UNRATED else None
        p["qualityStatus"] = "assessed" if p["quality"] else "unmeasured"
        p["roleId"] = role.get("role_slot_id")
        p["roleKey"] = role.get("role_key")
        p["roleName"] = role.get("role_name") or "未割当"
        p["roleType"] = role.get("role_type")
        p["roleNeed"] = role.get("need_status") or "未設定"
        p["searchStatus"] = role.get("search_status")
        p["rolePriority"] = role.get("priority")
        p["speciesGrade"] = a.get("grade")
        p["speciesStatus"] = a.get("status") or "unrated"
        p["speciesConfidence"] = a.get("confidence")
        p["speciesReviewStatus"] = a.get("assessment_review_status")
        p["resourceGate"] = {
            "dedicatedCandy": d.get("dedicated_candy"), "universalCandy": d.get("universal_candy"),
            "mainSeedCap": None if d.get("main_seed_cap") is None else str(d["main_seed_cap"]),
            "silverSeedPolicy": d.get("silver_seed_policy")}
        p["rationale"] = d.get("rationale")
        p["priority"] = d.get("priority_rank")
        p["disposition"] = d.get("disposition")
        p["refinement"] = d.get("refinement_status")
        p["targetLevel"] = d.get("target_level")
        p["stopLevel"] = d.get("stop_level")
        p["currentSpeciesKey"] = source_individual.get("current_species_key")
        p["targetSpeciesKey"] = source_individual.get("target_species_key")
    grade_order = {"S": 0, "A+": 1, "A": 2}
    for r in data["roles"]:
        row = by_role[r["id"]]
        for holder in (row.get("incumbent_id"), row.get("backup_id")):
            if holder and holder not in active_ids:
                raise ValueError("Inactive role holder " + holder)
        r.update(incumbent=row.get("incumbent_id"), backup=row.get("backup_id"),
                 need=row.get("need_status"), search=row.get("search_status"),
                 priority=row.get("priority"), note=row.get("note"),
                 reviewDate=row.get("review_date"), modelReviewDate=row.get("model_review_date"),
                 cookingDemand=row.get("cooking_demand_r36"), investmentGate=row.get("investment_gate_r36"))
        preferred = row.get("upgrade_target_species")
        candidates = [a for a in assessments if a.get("role_key") == row.get("role_key")
                      and a.get("grade") in grade_order and a.get("status") in ("active", "provisional")]
        candidates.sort(key=lambda a: (a.get("species_key") != preferred,
                     grade_order[a["grade"]], by_species.get(a["species_key"], {}).get("display_name", "")))
        old_candidates = {c.get("speciesKey"): c for c in r.get("targetCandidates", [])}
        r["targetCandidates"] = [
            {"speciesKey": a["species_key"],
             "name": by_species.get(a["species_key"], {}).get("display_name", a["species_key"]),
             "displayLabel": old_candidates.get(a["species_key"], {}).get("displayLabel") or by_species.get(a["species_key"], {}).get("display_name", a["species_key"]),
             "grade": a.get("grade"), "confidence": a.get("confidence"),
             "status": a.get("status"), "assessmentStatus": a.get("assessment_review_status"),
             "preferred": a["species_key"] == preferred} for a in candidates]
        if preferred and not any(c["speciesKey"] == preferred for c in r["targetCandidates"]):
            a = by_assessment.get((preferred, row.get("role_key")), {})
            r["targetCandidates"].insert(0, {
                "speciesKey": preferred, "name": by_species.get(preferred, {}).get("display_name", preferred),
                "displayLabel": r.get("upgradeTargetLabel") or by_species.get(preferred, {}).get("display_name", preferred),
                "grade": a.get("grade"), "confidence": a.get("confidence"),
                "status": a.get("status") or "unrated",
                "assessmentStatus": a.get("assessment_review_status") or "unrated", "preferred": True})
    # The generic builder is read through JSON, so coverage contains detached
    # copies of roles. Rebuild it after enrichment to keep both UI views equal.
    data["coverage"] = {key: [r for r in data["roles"] if r["type"] == role_type]
                        for key, role_type in (("food", "食材"), ("berry", "きのみ"), ("skill", "スキル"))}
    c_by = {x["coverage_id"]: x for x in coverage}
    for c in data["coverageMatrix"]:
        row = c_by[c["id"]]
        c.update(domain=row.get("domain"), key=row.get("role_key"), name=row.get("role_name"),
                 status=row.get("coverage_status"), priority=row.get("priority"), holder=row.get("holder"),
                 backup=row.get("backup"), linkedRoleId=row.get("linked_role_slot"),
                 phase6FoodClass=row.get("phase6_food_class"), cookingEvidence=row.get("cooking_evidence"),
                 modelReviewDate=row.get("model_review_date"))
        for value in (row.get("holder"), row.get("backup")):
            import re
            for iid in re.findall(r"IND-\d{4}", str(value or "")):
                if iid not in active_ids:
                    raise ValueError("Inactive coverage holder " + iid)
    data["speciesAssessments"] = [{
        "id": a["assessment_id"], "speciesKey": a["species_key"], "roleKey": a["role_key"],
        "roleName": a.get("role_name"), "grade": a.get("grade"), "confidence": a.get("confidence"),
        "status": a.get("status"), "reviewStatus": a.get("assessment_review_status"),
        "rationale": a.get("rationale"), "reviewDate": a.get("review_date"),
        "modelReviewDate": a.get("model_review_date")} for a in assessments]
    data["speciesMaster"] = [{"key": s["species_key"], "name": s.get("display_name"),
        "roleTierCoverage": s.get("role_tier_coverage"),
        "modelReviewDate": s.get("model_review_date")} for s in species]
    meta = data["meta"]
    meta.update(profile)
    meta.update(revision=revision, generatedAt=revision[:10], source=workbook.name,
                sourceSha256=hashlib.sha256(workbook.read_bytes()).hexdigest(),
                sourceIndividualCount=len(inds), sourceMeasurementCount=len(dict_rows(wb["L_Measurements"], "measurement_id")),
                currentFactsRevision=revision, currentDecisionRevision=revision,
                currentAssignmentsRevision=revision, currentDecisionCount=len(data["individuals"]),
                cookingPhase6="qualitative-adopted-quantitative-model-gap")
    data["inactiveIndividualIds"] = sorted(inactive_ids)
    assert len(data["individuals"]) == 35 and len(data["roles"]) == 33
    assert len(data["speciesAssessments"]) == 63 and len(data["coverageMatrix"]) == 47
    assert sum(p["primaryPR"] is not None for p in data["individuals"]) == 30
    assert sum(c["domain"] == "食材" and c.get("cookingEvidence") == "P6_R23_PROVISIONAL"
               for c in data["coverageMatrix"]) == 19
    output.write_text("window.APP_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    return data

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: build_r36_snapshot.py CURRENT_r36_or_r37.xlsx data.js")
    result = build(Path(sys.argv[1]), Path(sys.argv[2]))
    print(result["meta"]["revision"], len(result["individuals"]), "individuals", len(result["roles"]), "roles")
