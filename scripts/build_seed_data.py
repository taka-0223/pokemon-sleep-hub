#!/usr/bin/env python3
"""Generate read-only main-skill-seed inputs from the private CURRENT workbook.

This additive export does not change data.js, rank generic species/individual
grades, infer execution approval, or subtract future skill-level gains.
"""
from __future__ import annotations

import argparse
from datetime import date
import hashlib
import json
import re
from pathlib import Path

from build_data import boolean_flag, dict_rows, read_xlsx, verify_versioned_source_revision

SCHEMA_VERSION = "1.0"
MODEL_VERSION = "seed-v1"
GAME_DATA_VERSION = "seed-effects-2026-11-01-v1"
WRAPPER = "window.SEED_INVESTMENT_DATA="
ASSESSMENT_STATUSES = {"validated", "provisional", "unassessed", "stale"}
APPLICABILITY = {"broad", "conditional", "not_applicable", "unknown"}
TIERS = {"S", "A+", "A", "B", "C"}
SKILL_KEYS = {
    "げんきオールS": "energy_for_everyone_s",
    "エナジーチャージM": "charge_strength_m",
    "料理パワーアップS": "cooking_power_up_s",
    "料理チャンスS": "tasty_chance_s",
}


def text(value):
    return None if value is None or str(value).strip() == "" else str(value).strip()


def integer(value, field, minimum=0):
    """Blank is unknown. True, negative, fractional and malformed values fail."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise ValueError(f"{field}: a boolean is not an integer")
    try:
        number = float(value)
    except (ValueError, TypeError):
        raise ValueError(f"{field}: invalid integer {value!r}") from None
    if not number.is_integer() or number < minimum:
        raise ValueError(f"{field}: integer must be at least {minimum}")
    return int(number)


def iso_date(value, field):
    value = text(value)
    if value is None:
        return None
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"{field}: expected YYYY-MM-DD") from None
    if parsed.isoformat() != value:
        raise ValueError(f"{field}: expected YYYY-MM-DD")
    return value


def records(workbook, sheet, key, required=False, select=None):
    if sheet not in workbook:
        if required:
            raise ValueError(f"Missing required sheet: {sheet}")
        return []
    rows = dict_rows(workbook[sheet], key)
    header_present = any(key in row for row in workbook[sheet][:12])
    if not header_present:
        raise ValueError(f"{sheet}: missing {key} header")
    if select is not None:
        rows = [row for row in rows if select(row)]
    seen = set()
    for row in rows:
        ident = text(row.get(key))
        if not ident or ident in seen:
            raise ValueError(f"{sheet}: missing or duplicate {key}: {ident!r}")
        seen.add(ident)
    return rows


def source(sheet, record_id, revision, **fields):
    return {"sheet": sheet, "recordId": record_id, "revision": revision, **fields}


def assessment(row=None, *, prefix="", source_info=None):
    row = row or {}
    tier_column = "seed_account_tier" if prefix == "seed_" else "tier"
    tier = text(row.get(tier_column))
    status = text(row.get(prefix + "assessment_status")) or "unassessed"
    applicability = text(row.get(prefix + "applicability")) or "unknown"
    if status not in ASSESSMENT_STATUSES:
        raise ValueError(f"Invalid seed assessment status: {status}")
    if applicability not in APPLICABILITY:
        raise ValueError(f"Invalid seed assessment applicability: {applicability}")
    if tier is not None and tier not in TIERS:
        raise ValueError(f"Invalid seed tier: {tier}")
    if status == "unassessed" and tier is not None:
        raise ValueError("Unassessed seed tier must be blank, not a low or assumed tier")
    result = {
        "tier": tier, "status": status, "applicability": applicability,
        "benchmarkId": text(row.get(prefix + "benchmark_id")),
        "rationale": text(row.get(prefix + "rationale")),
        "reviewedAt": iso_date(row.get(prefix + "review_date"), prefix + "review_date"),
        "evidenceType": text(row.get(prefix + "evidence_type")),
        "modelVersion": text(row.get(prefix + "model_version")),
        "source": source_info,
    }
    if tier is not None:
        for key in ("benchmarkId", "rationale", "reviewedAt", "evidenceType", "modelVersion"):
            if result[key] is None:
                raise ValueError(f"Ranked seed assessment needs {key}")
        if result["modelVersion"] != MODEL_VERSION:
            result["status"] = "stale"
    return result


def seed_resource(rows, revision):
    candidates = [r for r in rows if r.get("category") == "resource"
                  and r.get("key") == "main_skill_seed"]
    if not candidates:
        return {"value": None, "reportedValue": None, "text": None,
                "certainty": "unknown", "observedAt": None, "source": None}
    # Blank-date evidence is retained but never silently ordered above a dated
    # observation. A later row wins only for equal dates, matching the ledger.
    for row in candidates:
        iso_date(row.get("snapshot_date"), "P_Account.snapshot_date")
    chosen = max(enumerate(candidates), key=lambda item: (text(item[1].get("snapshot_date")) or "", item[0]))[1]
    certainty = text(chosen.get("certainty")) or "unknown"
    reported = integer(chosen.get("value_num"), "P_Account.main_skill_seed")
    return {
        "value": reported if certainty == "confirmed" else None,
        "reportedValue": reported,
        "text": text(chosen.get("value_text")),
        "certainty": certainty,
        "observedAt": iso_date(chosen.get("snapshot_date"), "P_Account.snapshot_date"),
        "source": source("P_Account", chosen["snapshot_id"], revision,
                         type=text(chosen.get("source")), note=text(chosen.get("note"))),
    }


def build_payload(workbook, *, source_revision, source_sha256, source_file):
    """Pure rows-to-payload transformation used by the CLI and fixtures."""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-r\d+", str(source_revision)):
        raise ValueError("A dated CURRENT sourceRevision is required")
    if not re.fullmatch(r"[0-9a-f]{64}", str(source_sha256)):
        raise ValueError("A source SHA-256 is required")
    iso_date(source_revision[:10], "sourceRevision")
    inds = records(workbook, "P_Individuals", "individual_id", required=True)
    species = records(workbook, "M_Species", "species_key", required=True)
    scenarios = records(workbook, "S_Scenarios", "scenario_id")
    decisions = records(workbook, "D_Decisions", "decision_id")
    account = records(workbook, "P_Account", "snapshot_id", select=lambda row:
                      row.get("category") == "resource" and row.get("key") == "main_skill_seed")
    tier_rows = records(workbook, "M_SeedTier", "seed_tier_id")
    species_by = {row["species_key"]: row for row in species}
    known_ids = {row["individual_id"] for row in inds}
    active = [row for row in inds if boolean_flag(row.get("active"), row["individual_id"] + ".active")]
    active_ids = {row["individual_id"] for row in active}
    decision_by = {}
    for row in decisions:
        iid = text(row.get("individual_id"))
        if iid not in known_ids:
            raise ValueError(f"D_Decisions references unknown individual: {iid}")
        if iid in active_ids:
            if iid in decision_by:
                raise ValueError(f"D_Decisions has multiple current rows for {iid}")
            decision_by[iid] = row
    versions = {"sourceRevision": source_revision, "modelVersion": MODEL_VERSION}
    individuals = []
    for row in active:
        iid = row["individual_id"]
        current_key = text(row.get("current_species_key"))
        target_key = text(row.get("target_species_key"))
        source_issues = []
        if current_key and current_key not in species_by:
            source_issues.append("CURRENT_SPECIES_NOT_IN_MASTER")
        if target_key and target_key not in species_by:
            source_issues.append("TARGET_SPECIES_NOT_IN_MASTER")
        skill_name = text(species_by.get(current_key, {}).get("main_skill"))
        level = integer(row.get("level"), iid + ".level", 1)
        decision = decision_by.get(iid, {})
        subs = []
        for column, name in row.items():
            match = re.fullmatch(r"sub_(\d+)", column)
            if match:
                unlock = int(match[1])
                subs.append({"level": unlock, "name": text(name),
                             "unlocked": None if level is None else level >= unlock})
        subs.sort(key=lambda item: item["level"])
        account_assessment = assessment(decision, prefix="seed_", source_info=(
            source("D_Decisions", decision["decision_id"], source_revision,
                   roleSlotId=text(decision.get("role_slot_id"))) if decision else None))
        account_assessment.update(individualId=iid, roleSlotId=text(decision.get("role_slot_id")),
                                  versions={"sourceRevision": source_revision,
                                            "modelVersion": account_assessment["modelVersion"],
                                            "gameDataVersion": text(decision.get("seed_game_data_version"))})
        if account_assessment["tier"] is not None and account_assessment["roleSlotId"] is None:
            raise ValueError(f"Ranked account seed assessment needs role_slot_id: {iid}")
        individuals.append({
            "id": iid, "name": text(row.get("display_name")), "active": True,
            "currentSpeciesKey": current_key, "targetSpeciesKey": target_key,
            "level": level, "currentSkillLevel": integer(row.get("main_skill_lv"), iid + ".main_skill_lv", 1),
            "remainingEvolutions": integer(row.get("remaining_evolutions"), iid + ".remaining_evolutions"),
            "mainSkillKey": SKILL_KEYS.get(skill_name), "mainSkillName": skill_name,
            "subskills": subs,
            "accountAssessment": account_assessment,
            "sourceIssues": source_issues,
            "source": source("P_Individuals", iid, source_revision,
                             type=text(row.get("source_type")), note=text(row.get("source_note"))),
            "versions": dict(versions),
        })
    individual_by = {row["id"]: row for row in individuals}
    species_assessments = []
    tier_keys = set()
    for row in tier_rows:
        sk = text(row.get("species_key"))
        skill_key = text(row.get("main_skill_key"))
        if sk not in species_by:
            raise ValueError(f"M_SeedTier references unknown species: {sk}")
        if skill_key is not None and skill_key not in SKILL_KEYS.values():
            raise ValueError(f"M_SeedTier unsupported main skill key: {skill_key}")
        expected = SKILL_KEYS.get(text(species_by[sk].get("main_skill")))
        if skill_key != expected:
            raise ValueError(f"M_SeedTier skill does not match M_Species: {sk}")
        reviewed = assessment(row, source_info=source("M_SeedTier", row["seed_tier_id"], source_revision,
                                                     url=text(row.get("source_url"))))
        if reviewed["tier"] is not None and skill_key is None:
            raise ValueError("Unsupported skills must remain unranked until explicitly modeled")
        key = (sk, skill_key, reviewed["benchmarkId"])
        if key in tier_keys:
            raise ValueError(f"Duplicate species/skill/benchmark seed assessment: {key}")
        tier_keys.add(key)
        species_assessments.append({
            "id": row["seed_tier_id"], "speciesKey": sk, "skillKey": skill_key,
            **reviewed, "conditions": [text(row.get("conditions"))] if text(row.get("conditions")) else [],
            "benchmarkDescription": text(row.get("benchmark_description")),
            "gameDataVersion": text(row.get("game_data_version")),
            "versions": {"sourceRevision": source_revision, "modelVersion": reviewed["modelVersion"],
                         "gameDataVersion": text(row.get("game_data_version"))},
        })
    legacy_scenarios = []
    excluded_scenarios = 0
    for row in scenarios:
        iid = text(row.get("individual_id"))
        if iid not in known_ids:
            raise ValueError(f"S_Scenarios references unknown individual: {iid}")
        if iid not in active_ids:
            excluded_scenarios += 1
            continue
        legacy_scenarios.append({
            "id": row["scenario_id"], "individualId": iid,
            "roleSlotId": text(row.get("role_slot_id")), "name": text(row.get("scenario_name")),
            "targetLevel": integer(row.get("target_level"), row["scenario_id"] + ".target_level", 1),
            "targetSkillLevel": integer(row.get("target_main_skill_lv"), row["scenario_id"] + ".target_main_skill_lv", 1),
            "seeds": integer(row.get("main_seed_count"), row["scenario_id"] + ".main_seed_count"),
            "seedType": "mainSkillSeed", "skillKey": individual_by[iid]["mainSkillKey"],
            "status": "legacy_proposal", "legacyStatus": text(row.get("status")),
            "timing": None, "sourceTimingKnown": False, "recommended": False,
            "source": source("S_Scenarios", row["scenario_id"], source_revision,
                             reviewedAt=iso_date(row.get("review_date"), row["scenario_id"] + ".review_date"),
                             note=text(row.get("note"))),
            "versions": dict(versions),
        })
    return {
        "meta": {"schemaVersion": SCHEMA_VERSION, "modelVersion": MODEL_VERSION,
                 "gameDataVersion": GAME_DATA_VERSION,
                 "sourceRevision": source_revision, "sourceSha256": source_sha256,
                 "sourceFile": Path(source_file).name, "generatedAt": source_revision[:10],
                 "assessmentMode": "qualitative_priority",
                 "speciesTierSheetPresent": "M_SeedTier" in workbook,
                 "individualCount": len(individuals),
                 "speciesAssessmentCount": len(species_assessments),
                 "legacyScenarioCount": len(legacy_scenarios),
                 "excludedInactiveScenarioCount": excluded_scenarios},
        "individuals": individuals, "speciesAssessments": species_assessments,
        "scenarios": legacy_scenarios,
        "resources": {"mainSkillSeed": seed_resource(account, source_revision)},
    }


def build(workbook_path, output_path):
    workbook_path = Path(workbook_path)
    workbook = read_xlsx(workbook_path)
    revision = verify_versioned_source_revision(workbook, workbook_path)
    if revision is None:
        raise ValueError("Use a versioned CURRENT_rNN.xlsx source with consistent revision metadata")
    result = build_payload(workbook, source_revision=revision,
                           source_sha256=hashlib.sha256(workbook_path.read_bytes()).hexdigest(),
                           source_file=workbook_path.name)
    Path(output_path).write_text(WRAPPER + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n",
                                 encoding="utf-8")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("current", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    result = build(args.current, args.output)
    print(result["meta"]["sourceRevision"], result["meta"]["individualCount"],
          "individuals,", result["meta"]["speciesAssessmentCount"], "seed assessments")


if __name__ == "__main__":
    main()
