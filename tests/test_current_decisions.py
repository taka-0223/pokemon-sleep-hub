"""Synthetic-only checks: the private CURRENT workbook is not kept in Git."""
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import build_current_decisions as builder


def fixture():
    return {
        "P_Individuals": [
            ["individual_id", "active"],
            ["IND-0001", True], ["IND-0002", "False"], ["IND-0003", True]
        ],
        "P_RoleSlots": [
            ["role_slot_id", "role_key", "role_name", "role_type", "need_status", "search_status", "priority"],
            ["ROLE-001", "food", "食材", "食材", "充足", "停止", "中"]
        ],
        "D_Decisions": [
            ["individual_id", "role_slot_id", "decision_date", "decision_status",
             "disposition", "priority_rank", "rationale"],
            ["IND-0001", "ROLE-001", "2026-10-20", "active", "育成", 3, "Lv30へ"],
            ["IND-0002", "ROLE-001", "2026-10-23", "archived", "送却", None, "博士送り"],
            ["IND-0003", "ROLE-001", "2026-10-15", "active", "キープ", None, "旧記録"]
        ],
    }


class DatedDecisionTests(unittest.TestCase):
    def make(self, rows=None):
        with mock.patch.object(builder, "verify_versioned_source_revision", return_value="2026-10-23-r35"):
            return builder.payload_from_workbook(rows or fixture(), Path("CURRENT_r35.xlsx"), "2026-10-20")

    def test_only_recent_active_decisions(self):
        payload=self.make()
        self.assertEqual(payload["meta"]["decisionCount"], 1)
        self.assertEqual(payload["decisions"][0]["id"], "IND-0001")
        self.assertEqual(payload["decisions"][0]["roleNeed"], "充足")
        self.assertEqual(payload["meta"]["roleCount"],1)
        self.assertEqual(payload["roleAssignments"][0]["incumbent"],None)
        self.assertNotIn("speciesGrade", payload["decisions"][0])

    def test_duplicate_decision_refused(self):
        rows=fixture()
        rows["D_Decisions"].append(rows["D_Decisions"][1])
        with self.assertRaisesRegex(ValueError, "Multiple recent"):
            self.make(rows)

    def test_invalid_role_refused(self):
        rows=fixture()
        rows["D_Decisions"][1][1]="ROLE-999"
        with self.assertRaisesRegex(ValueError, "Unresolved role"):
            self.make(rows)

    def test_invalid_date_refused(self):
        rows=fixture()
        rows["D_Decisions"][1][2]="10/20"
        with self.assertRaisesRegex(ValueError, "invalid date"):
            self.make(rows)

    def test_unversioned_source_refused(self):
        with mock.patch.object(builder, "verify_versioned_source_revision", return_value=None):
            with self.assertRaisesRegex(ValueError, "versioned"):
                builder.payload_from_workbook(fixture(), Path("CURRENT.xlsx"), "2026-10-20")

    def test_retired_role_holder_refused(self):
        rows=fixture()
        rows["P_RoleSlots"][0].append("incumbent_id")
        rows["P_RoleSlots"][1].append("IND-0002")
        with self.assertRaisesRegex(ValueError, "inactive individual"):
            self.make(rows)


if __name__ == "__main__":
    unittest.main()
