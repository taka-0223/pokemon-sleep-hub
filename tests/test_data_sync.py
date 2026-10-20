"""Offline tests: synthetic workbook snapshots, no private CURRENT in repo."""
import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import build_data
import check_data_sync as gate


def fixture():
    return {
        "P_Individuals": [
            ["individual_id", "display_name", "level", "active", "ingredient_1", "main_skill_lv"],
            ["IND-0001", "ピカチュウ", 25, True, "とくせんリンゴ", 1],
            ["IND-0002", "除外個体", 1, False, "ワカクサ大豆", 1],
            ["IND-0003", "新規", 13, True, "ワカクサコーン", 1],
        ],
        "P_Account": [
            ["snapshot_id", "snapshot_date", "category", "key", "value_num", "value_text", "certainty", "source", "note"],
            ["ACC-1", "2026-09-28", "resource", "dream_shard", 200, "前回", "confirmed", "user", "private note"],
            ["ACC-2", "2026-10-20", "resource", "dream_shard", 0, "使い切り", "confirmed", "user", "private note"],
            ["ACC-3", "2026-10-20", "resource", "universal_candy_s", None, "未確認", "unknown", "user", "private note"],
            ["ACC-4", "2026-10-20", "friendship", "secret_fl", 45, "personal", "confirmed", "user", "private note"],
            ["ACC-5", "2026-10-20", "event", "boost", 10, "達成", "confirmed", "user", "private note"],
            ["ACC-6", "2026-10-20", "progress", "mewtwo_level", 29, "別情報", "confirmed", "user", "private note"],
        ],
        "M_Rules": [["rule_id", "value"], ["DATA_REVISION", "2026-10-20-r26"]],
        "P_RoleSlots": [["role_slot_id","role_type"], ["ROLE-001","きのみ"]],
        "P_RoleCoverage": [["coverage_id","domain"], ["ING-1","food"]],
        "D_Decisions": [["individual_id", "role_slot_id"], ["IND-0001","ROLE-001"]],
        "L_Measurements": [["individual_id", "metric", "evaluation_level", "value", "unit", "settings", "tool"],
            ["IND-0001", "きのみPR", 30, 91.2, "percentile", "Investment projection; silver seed OFF", "sim"],
            ["IND-0001", "きのみPR", 30, 99.1, "percentile", "Investment scenario; silver seed ON", "sim"]],
        "M_Species": [],"M_SpeciesAssessment": [],
    }


def snapshot(rows=None):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td)/"out.js"
        with mock.patch.object(build_data, "read_xlsx", return_value=rows or fixture()):
            with mock.patch.object(sys, "argv", ["build_data.py", "/private/SSOT.xlsx", str(out)]):
                build_data.main()
        return gate.load_snapshot(out), out.read_bytes()


def baseline():
    d,_=snapshot()
    # Simulate only an old existing individual, no newly-added one.
    d["individuals"]=[x for x in d["individuals"] if x["id"]=="IND-0001"]
    return d


class TestPAccountMigration(unittest.TestCase):
    def test_resource_values_zero_is_not_null_and_latest_wins(self):
        d,_=snapshot()
        self.assertEqual(d["meta"]["revision"],"2026-10-20-r26")
        self.assertEqual(d["resources"]["dream_shard"],{"value":0,"text":"使い切り"})
        self.assertEqual(d["resources"]["universal_candy_s"],{"value":None,"text":"未確認"})
        self.assertEqual(d["resources"]["boost"],{"value":10,"text":"達成"})
        self.assertNotIn("secret_fl",d["resources"])
        self.assertNotIn("mewtwo_level",d["resources"])
        self.assertNotIn("private note",repr(d))
        self.assertEqual(len(d["individuals"]),2)
    def test_off_scenario_is_not_mixed_with_formal_pr(self):
        d,_=snapshot()
        i=d["individuals"][0]
        self.assertEqual(i["primaryPR"],91.2)
        self.assertEqual(len(i["measurements"]),1)
        self.assertEqual(i["measurements"][0]["pr"],91.2)
        self.assertIsNone(d["individuals"][1]["primaryPR"])
    def test_byte_identical_for_repeated_build(self):
        self.assertEqual(snapshot()[1],snapshot()[1])


class TestFailClosed(unittest.TestCase):
    def test_pr_and_measurements_dropped_are_blocked(self):
        old=baseline(); new=copy.deepcopy(old)
        new["individuals"][0]["primaryPR"]=None
        new["individuals"][0]["measurements"]=[]
        r=gate.validate(old,new)
        self.assertEqual(r["status"],"BLOCKED")
        self.assertIn("pr_loss",r["problems_by_type"])
        self.assertIn("measurement_loss",r["problems_by_type"])
    def test_resource_key_removed_and_grade_changed_are_blocked(self):
        old=baseline(); new=copy.deepcopy(old)
        del new["resources"]["universal_candy_s"]
        new["individuals"][0]["speciesGrade"]="S"
        r=gate.validate(old,new)
        self.assertIn("resource_loss",r["problems_by_type"])
        self.assertIn("unapproved_change",r["problems_by_type"])
    def test_roleslot_and_coverage_loss_are_blocked(self):
        old=baseline(); new=copy.deepcopy(old)
        new["roles"]=[]; new["coverageMatrix"]=[]
        r=gate.validate(old,new)
        self.assertIn("roleslot_loss",r["problems_by_type"])
        self.assertIn("coverage_loss",r["problems_by_type"])
    def test_new_candidate_cannot_be_assessed_without_approval(self):
        old=baseline(); new,_=snapshot()
        new["meta"]["revision"]="2026-10-21-r27"
        r=gate.validate(old,new)
        self.assertIn("new_individuals",r["problems_by_type"])
        self.assertIn("unapproved_revision",r["problems_by_type"])
    def test_exact_authorized_new_unscored_candidate_passes(self):
        old=baseline(); new,_=snapshot()
        manifest={"baseline_sha256":"testsha", "current_sha256":"testsha", "expected_revision":"2026-10-20-r26",
                  "allowed_changes":[],"allowed_new_ids":["IND-0003"]}
        r=gate.validate(old,new,manifest)
        self.assertEqual(r["status"],"PASS",r["problems"][:6])
    def test_false_zero_and_null_changes_never_conflate(self):
        old=baseline(); new=copy.deepcopy(old)
        new["resources"]["universal_candy_s"]["value"]=0
        r=gate.validate(old,new)
        self.assertIn("unapproved_change",r["problems_by_type"])
    def test_no_changes_pass_without_manifest(self):
        old=baseline()
        self.assertEqual(gate.validate(old,copy.deepcopy(old))["status"],"PASS")

if __name__=="__main__": unittest.main()