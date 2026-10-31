"""Seed-data export tests use in-memory rows; no workbook authoring required."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build_seed_data import build_payload
from build_r36_snapshot import revision_profile
from check_r36_public import manifest_profile


def sheet(rows):
    if not rows:
        return []
    headers = list(dict.fromkeys(key for row in rows for key in row))
    return [["Fixture"], [], headers] + [[row.get(key) for key in headers] for row in rows]


def fixture():
    return {
        "M_Species": sheet([
            {"species_key": "wigglytuff", "main_skill": "げんきオールS"},
            {"species_key": "pawmi", "main_skill": "げんきオールS"},
            {"species_key": "pawmot", "main_skill": "げんきオールS"},
            {"species_key": "mew", "main_skill": "オールマイティー"},
        ]),
        "P_Individuals": sheet([
            {"individual_id": "IND-0002", "display_name": "プクリン", "active": "True",
             "current_species_key": "wigglytuff", "target_species_key": "wigglytuff",
             "level": 34, "main_skill_lv": 3, "remaining_evolutions": 0,
             "sub_10": "スキル確率アップM", "sub_50": "最大所持数L",
             "source_type": "screenshot", "source_note": "2026-09-27受領"},
            {"individual_id": "IND-0017", "display_name": "パモ", "active": True,
             "current_species_key": "pawmi", "target_species_key": "pawmot",
             "level": 12, "main_skill_lv": 1, "remaining_evolutions": 2,
             "sub_10": "おてつだいスピードM", "sub_80": "スキルレベルアップM"},
        ]),
        "D_Decisions": sheet([
            {"decision_id": "DEC-002", "individual_id": "IND-0002", "role_slot_id": "ROLE-001",
             "individual_quality": "S", "main_seed_cap": 3, "decision_status": "active"},
            {"decision_id": "DEC-017", "individual_id": "IND-0017", "role_slot_id": "ROLE-001",
             "individual_quality": "A+", "main_seed_cap": 4, "decision_status": "active"},
        ]),
        "S_Scenarios": sheet([
            {"scenario_id": "SCN-002", "individual_id": "IND-0002", "role_slot_id": "ROLE-001",
             "scenario_name": "プクリンSLv6", "target_level": 34, "target_main_skill_lv": 6,
             "main_seed_count": 3, "status": "proposal", "review_date": "2026-09-28"},
        ]),
        "P_Account": sheet([
            {"snapshot_id": "ACC-0001", "snapshot_date": "2026-09-28", "category": "resource",
             "key": "main_skill_seed", "value_num": 8, "value_text": "約8個",
             "certainty": "approx", "source": "user", "note": "約8個、現数未確認"},
        ]),
    }


def export(workbook):
    return build_payload(workbook, source_revision="2026-10-25-r36", source_sha256="a" * 64,
                         source_file="/private/path/pokemon_sleep_decision_system_CURRENT_r36.xlsx")


def row_dicts(workbook, name):
    headers = workbook[name][2]
    return [dict(zip(headers, row)) for row in workbook[name][3:]]


def ranked_species(**changes):
    row = {"seed_tier_id": "SEED-TIER-001", "species_key": "wigglytuff",
           "main_skill_key": "energy_for_everyone_s", "benchmark_id": "seed-qualitative-v1",
           "tier": "A", "assessment_status": "provisional", "applicability": "conditional",
           "rationale": "長期運用を仮定した定性候補", "evidence_type": "qualitative_review",
           "source_url": "https://example.test/source", "review_date": "2026-11-01",
           "game_data_version": "2026-11-01", "model_version": "seed-v1",
           "conditions": "毎日の採用が前提", "benchmark_description": "定性候補の優先度"}
    row.update(changes)
    return row


class SeedDataTests(unittest.TestCase):
    def setUp(self):
        self.workbook = fixture()

    def test_missing_tier_sheet_is_unassessed_not_generic_tier(self):
        result = export(self.workbook)
        self.assertEqual(result["speciesAssessments"], [])
        self.assertFalse(result["meta"]["speciesTierSheetPresent"])
        for individual in result["individuals"]:
            assessment = individual["accountAssessment"]
            self.assertIsNone(assessment["tier"])
            self.assertEqual(assessment["status"], "unassessed")
            self.assertEqual(assessment["applicability"], "unknown")
            self.assertNotIn("mainSeedCap", individual)
            self.assertNotIn("primaryPR", individual)

    def test_current_identity_skill_and_unspent_future_gains(self):
        result = export(self.workbook)
        current, future = result["individuals"]
        self.assertEqual(current["currentSpeciesKey"], "wigglytuff")
        self.assertEqual(current["currentSkillLevel"], 3)
        self.assertEqual(current["mainSkillKey"], "energy_for_everyone_s")
        self.assertEqual(future["currentSkillLevel"], 1)
        self.assertEqual(future["remainingEvolutions"], 2)
        self.assertFalse(future["subskills"][-1]["unlocked"])
        self.assertEqual(future["subskills"][-1]["name"], "スキルレベルアップM")

    def test_null_is_not_zero(self):
        rows = row_dicts(self.workbook, "P_Individuals")
        rows[0].update(level=None, main_skill_lv=None, remaining_evolutions=None)
        self.workbook["P_Individuals"] = sheet(rows)
        individual = export(self.workbook)["individuals"][0]
        for key in ("level", "currentSkillLevel", "remainingEvolutions"):
            self.assertIsNone(individual[key])
        self.assertTrue(all(s["unlocked"] is None for s in individual["subskills"]))

    def test_zero_remaining_evolutions_is_a_real_zero(self):
        self.assertEqual(export(self.workbook)["individuals"][0]["remainingEvolutions"], 0)

    def test_numeric_invalid_inputs_fail_closed(self):
        for value in (True, -1, 1.5, "unknown", "nan", "inf"):
            with self.subTest(value=value):
                workbook = deepcopy(self.workbook)
                rows = row_dicts(workbook, "P_Individuals")
                rows[0]["remaining_evolutions"] = value
                workbook["P_Individuals"] = sheet(rows)
                with self.assertRaises(ValueError):
                    export(workbook)

    def test_legacy_scenario_does_not_approve_investment(self):
        rows = row_dicts(self.workbook, "S_Scenarios")
        rows[0]["status"] = "approved"
        self.workbook["S_Scenarios"] = sheet(rows)
        scenario = export(self.workbook)["scenarios"][0]
        self.assertEqual(scenario["status"], "legacy_proposal")
        self.assertEqual(scenario["legacyStatus"], "approved")
        self.assertFalse(scenario["recommended"])
        self.assertNotIn("recommendation", scenario)
        self.assertIsNone(scenario["timing"])
        self.assertFalse(scenario["sourceTimingKnown"])
        self.assertEqual(scenario["seeds"], 3)
        self.assertEqual(scenario["targetSkillLevel"], 6)

    def test_resource_approximate_count_is_not_current_budget(self):
        resource = export(self.workbook)["resources"]["mainSkillSeed"]
        self.assertIsNone(resource["value"])
        self.assertEqual(resource["reportedValue"], 8)
        self.assertEqual(resource["certainty"], "approx")
        self.assertEqual(resource["observedAt"], "2026-09-28")
        self.assertNotIn("confirmed_current", resource)

    def test_confirmed_zero_resource_remains_zero(self):
        rows = row_dicts(self.workbook, "P_Account")
        rows[0].update(value_num=0, certainty="confirmed", value_text="0個")
        self.workbook["P_Account"] = sheet(rows)
        self.assertEqual(export(self.workbook)["resources"]["mainSkillSeed"]["value"], 0)

    def test_resource_history_uses_date_not_last_physical_row(self):
        rows = row_dicts(self.workbook, "P_Account")
        rows.append({**rows[0], "snapshot_id": "ACC-0002", "snapshot_date": "2026-09-01",
                     "value_num": 40, "certainty": "confirmed"})
        self.workbook["P_Account"] = sheet(rows)
        resource = export(self.workbook)["resources"]["mainSkillSeed"]
        self.assertEqual(resource["reportedValue"], 8)
        self.assertIsNone(resource["value"])

    def test_same_day_last_observation_wins(self):
        rows = row_dicts(self.workbook, "P_Account")
        rows.append({**rows[0], "snapshot_id": "ACC-0002", "value_num": 7, "certainty": "confirmed"})
        self.workbook["P_Account"] = sheet(rows)
        self.assertEqual(export(self.workbook)["resources"]["mainSkillSeed"]["value"], 7)

    def test_missing_resources_are_unknown(self):
        del self.workbook["P_Account"]
        resource = export(self.workbook)["resources"]["mainSkillSeed"]
        self.assertIsNone(resource["value"])
        self.assertEqual(resource["certainty"], "unknown")

    def test_only_seed_resource_is_exported(self):
        rows = row_dicts(self.workbook, "P_Account")
        rows.append({**rows[0], "snapshot_id": "ACC-PRIVATE", "category": "friendship",
                     "key": "private_friend_name", "value_text": "DO NOT EXPORT"})
        self.workbook["P_Account"] = sheet(rows)
        self.assertNotIn("DO NOT EXPORT", str(export(self.workbook)))

    def test_unrelated_resource_duplicate_does_not_block_seed_export(self):
        rows = row_dicts(self.workbook, "P_Account")
        rows.extend([{**rows[0], "snapshot_id": "ACC-OTHER", "key": "squirtle_candy"},
                     {**rows[0], "snapshot_id": "ACC-OTHER", "key": "universal_candy_s"}])
        self.workbook["P_Account"] = sheet(rows)
        self.assertEqual(export(self.workbook)["resources"]["mainSkillSeed"]["reportedValue"], 8)

    def test_duplicate_seed_resource_identity_fails(self):
        rows = row_dicts(self.workbook, "P_Account")
        rows.append({**rows[0], "value_num": 9})
        self.workbook["P_Account"] = sheet(rows)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            export(self.workbook)

    def test_retired_individual_and_scenario_are_excluded(self):
        rows = row_dicts(self.workbook, "P_Individuals")
        rows[0]["active"] = "False"
        self.workbook["P_Individuals"] = sheet(rows)
        result = export(self.workbook)
        self.assertEqual([p["id"] for p in result["individuals"]], ["IND-0017"])
        self.assertEqual(result["scenarios"], [])
        self.assertEqual(result["meta"]["excludedInactiveScenarioCount"], 1)

    def test_unknown_scenario_foreign_key_fails(self):
        rows = row_dicts(self.workbook, "S_Scenarios")
        rows[0]["individual_id"] = "IND-MISSING"
        self.workbook["S_Scenarios"] = sheet(rows)
        with self.assertRaisesRegex(ValueError, "unknown individual"):
            export(self.workbook)

    def test_duplicate_individual_fails(self):
        rows = row_dicts(self.workbook, "P_Individuals")
        rows.append(rows[0])
        self.workbook["P_Individuals"] = sheet(rows)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            export(self.workbook)

    def test_duplicate_current_decision_fails(self):
        rows = row_dicts(self.workbook, "D_Decisions")
        rows.append({**rows[0], "decision_id": "DEC-OTHER"})
        self.workbook["D_Decisions"] = sheet(rows)
        with self.assertRaisesRegex(ValueError, "multiple current"):
            export(self.workbook)

    def test_new_seed_tier_preserves_provisional_conditions_and_scope(self):
        self.workbook["M_SeedTier"] = sheet([ranked_species()])
        tier = export(self.workbook)["speciesAssessments"][0]
        self.assertEqual(tier["tier"], "A")
        self.assertEqual(tier["status"], "provisional")
        self.assertEqual(tier["applicability"], "conditional")
        self.assertEqual(tier["benchmarkId"], "seed-qualitative-v1")
        self.assertEqual(tier["conditions"], ["毎日の採用が前提"])
        self.assertEqual(tier["source"]["recordId"], "SEED-TIER-001")

    def test_generic_grade_does_not_fill_explicit_unassessed_tier(self):
        self.workbook["M_SeedTier"] = sheet([ranked_species(tier=None, assessment_status="unassessed")])
        self.assertIsNone(export(self.workbook)["speciesAssessments"][0]["tier"])

    def test_ranked_tier_requires_evidence_scope_and_model_version(self):
        for field in ("benchmark_id", "rationale", "review_date", "evidence_type", "model_version"):
            with self.subTest(field=field):
                workbook = deepcopy(self.workbook)
                workbook["M_SeedTier"] = sheet([ranked_species(**{field: None})])
                with self.assertRaisesRegex(ValueError, "needs"):
                    export(workbook)

    def test_wrong_assessment_enum_and_unassessed_tier_fail(self):
        for changes in ({"assessment_status": "active"}, {"assessment_status": "unassessed"},
                        {"applicability": "S"}, {"tier": "Z"}):
            with self.subTest(changes=changes):
                workbook = deepcopy(self.workbook)
                workbook["M_SeedTier"] = sheet([ranked_species(**changes)])
                with self.assertRaises(ValueError):
                    export(workbook)

    def test_old_model_version_is_stale_not_current(self):
        self.workbook["M_SeedTier"] = sheet([ranked_species(model_version="seed-v0")])
        self.assertEqual(export(self.workbook)["speciesAssessments"][0]["status"], "stale")

    def test_skill_identity_mismatch_and_duplicate_benchmark_fail(self):
        for rows in ([ranked_species(main_skill_key="charge_strength_m")],
                     [ranked_species(), ranked_species(seed_tier_id="SEED-TIER-002")]):
            workbook = deepcopy(self.workbook)
            workbook["M_SeedTier"] = sheet(rows)
            with self.assertRaises(ValueError):
                export(workbook)

    def test_unknown_and_compound_skills_are_not_guessed(self):
        species = row_dicts(self.workbook, "M_Species")
        species[0]["main_skill"] = "げんきオールS（複合）"
        self.workbook["M_Species"] = sheet(species)
        p = export(self.workbook)["individuals"][0]
        self.assertIsNone(p["mainSkillKey"])
        self.assertEqual(p["mainSkillName"], "げんきオールS（複合）")

    def test_missing_current_species_master_does_not_inherit_target_skill(self):
        rows = row_dicts(self.workbook, "P_Individuals")
        rows[0]["current_species_key"] = "not_in_master"
        self.workbook["P_Individuals"] = sheet(rows)
        p = export(self.workbook)["individuals"][0]
        self.assertEqual(p["currentSpeciesKey"], "not_in_master")
        self.assertIsNone(p["mainSkillKey"])
        self.assertIsNone(p["mainSkillName"])
        self.assertIn("CURRENT_SPECIES_NOT_IN_MASTER", p["sourceIssues"])

    def test_account_assessment_is_separate_from_generic_quality(self):
        rows = row_dicts(self.workbook, "D_Decisions")
        rows[0].update(seed_account_tier="B", seed_assessment_status="provisional",
                       seed_applicability="conditional", seed_rationale="短期の使用頻度未確認",
                       seed_review_date="2026-11-01", seed_benchmark_id="seed-qualitative-v1",
                       seed_evidence_type="qualitative_review", seed_model_version="seed-v1",
                       seed_game_data_version="seed-effects-2026-11-01-v1")
        self.workbook["D_Decisions"] = sheet(rows)
        p = export(self.workbook)["individuals"][0]
        self.assertEqual(p["accountAssessment"]["tier"], "B")
        self.assertEqual(p["accountAssessment"]["status"], "provisional")
        self.assertEqual(p["accountAssessment"]["individualId"], p["id"])
        self.assertEqual(p["accountAssessment"]["versions"]["gameDataVersion"], "seed-effects-2026-11-01-v1")
        self.assertNotIn("recommendation", p)

    def test_ranked_account_assessment_needs_role_scope(self):
        rows = row_dicts(self.workbook, "D_Decisions")
        rows[0].update(seed_account_tier="A", seed_assessment_status="provisional",
                       seed_applicability="conditional", seed_rationale="理由",
                       seed_review_date="2026-11-01", seed_benchmark_id="seed-qualitative-v1",
                       seed_evidence_type="qualitative_review", seed_model_version="seed-v1",
                       role_slot_id=None)
        self.workbook["D_Decisions"] = sheet(rows)
        with self.assertRaisesRegex(ValueError, "role_slot_id"):
            export(self.workbook)

    def test_provenance_and_deterministic_output(self):
        result = export(self.workbook)
        self.assertEqual(result, export(deepcopy(self.workbook)))
        self.assertEqual(result["meta"]["sourceRevision"], "2026-10-25-r36")
        self.assertEqual(result["meta"]["gameDataVersion"], "seed-effects-2026-11-01-v1")
        self.assertEqual(result["meta"]["sourceSha256"], "a" * 64)
        self.assertEqual(result["meta"]["sourceFile"], "pokemon_sleep_decision_system_CURRENT_r36.xlsx")
        self.assertEqual(result["individuals"][0]["versions"],
                         {"sourceRevision": "2026-10-25-r36", "modelVersion": "seed-v1"})
        self.assertEqual(result["scenarios"][0]["versions"], result["individuals"][0]["versions"])

    def test_missing_required_source_sheet_and_invalid_revision_fail(self):
        workbook = deepcopy(self.workbook)
        del workbook["P_Individuals"]
        with self.assertRaisesRegex(ValueError, "required sheet"):
            export(workbook)
        with self.assertRaisesRegex(ValueError, "sourceRevision"):
            build_payload(self.workbook, source_revision="CURRENT", source_sha256="a" * 64,
                          source_file="CURRENT.xlsx")


class SnapshotVersionContractTests(unittest.TestCase):
    def test_r36_keeps_original_version_contract(self):
        self.assertEqual(revision_profile("2026-10-25-r36"),
                         {"schemaVersion": "1.2", "appVersion": "0.20", "modelVersion": "r36"})

    def test_r37_has_explicit_seed_model_contract(self):
        self.assertEqual(revision_profile("2026-11-01-r37"),
                         {"schemaVersion": "1.3", "appVersion": "0.21",
                          "modelVersion": "r36+seed-v1", "seedModelVersion": "seed-v1",
                          "gameDataVersion": "seed-effects-2026-11-01-v1"})

    def test_unknown_revision_cannot_reuse_r36_metadata(self):
        for revision in (None, "2026-10-24-r35", "2026-11-01-r36", "2026-11-02-r38"):
            with self.subTest(revision=revision):
                with self.assertRaisesRegex(ValueError, "Unsupported CURRENT"):
                    revision_profile(revision)

    def test_revision_profile_is_not_mutable_shared_state(self):
        profile = revision_profile("2026-10-25-r36")
        profile["modelVersion"] = "changed"
        self.assertEqual(revision_profile("2026-10-25-r36")["modelVersion"], "r36")

    def test_old_published_manifest_keeps_legacy_defaults(self):
        self.assertEqual(manifest_profile({"revision": "2026-10-25-r36"}),
                         {"schema_version": "1.2", "app_version": "0.20", "model_version": "r36",
                          "decision_date": "2026-10-25"})

    def test_new_manifest_requires_all_explicit_version_fields(self):
        pinned = {"revision": "2026-11-01-r37", "schema_version": "1.3", "app_version": "0.21",
                  "model_version": "r36+seed-v1", "seed_model_version": "seed-v1",
                  "game_data_version": "seed-effects-2026-11-01-v1",
                  "decision_date": "2026-10-25"}
        self.assertEqual(manifest_profile(pinned), {key: value for key, value in pinned.items()
                                                  if key != "revision"})
        for key in ("schema_version", "app_version", "model_version", "seed_model_version", "game_data_version", "decision_date"):
            with self.subTest(key=key):
                incomplete = dict(pinned)
                del incomplete[key]
                with self.assertRaisesRegex(ValueError, "manifest missing " + key):
                    manifest_profile(incomplete)

    def test_unknown_manifest_revision_is_blocked(self):
        with self.assertRaisesRegex(ValueError, "unsupported manifest revision"):
            manifest_profile({"revision": "2026-11-02-r38"})


if __name__ == "__main__":
    unittest.main()
