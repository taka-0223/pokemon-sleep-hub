#!/usr/bin/env python3
"""Publish explicitly dated individual decisions from the private CURRENT SSOT.

Only decisions recorded since an explicit cutoff are eligible. Older formal
tiers, candidate rankings and unpublished measurement calculations are excluded.
The CURRENT workbook must never be committed to the public repository.

Usage:
    python3 scripts/build_current_decisions.py CURRENT_r35.xlsx current-decisions.js 2026-10-20
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from build_data import boolean_flag, dict_rows, first, read_xlsx, verify_versioned_source_revision


def payload_from_workbook(wb: dict, workbook: Path, cutoff: str):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", cutoff):
        raise ValueError("Decision cutoff must be an ISO date")
    revision = verify_versioned_source_revision(wb, workbook)
    if not revision:
        raise ValueError("A versioned CURRENT_rNN workbook is required")
    if cutoff > revision[:10]:
        raise ValueError("Decision cutoff is later than source revision")

    inds = dict_rows(wb.get("P_Individuals", []), "individual_id")
    active_ids = {
        row["individual_id"] for row in inds
        if row.get("individual_id") and boolean_flag(
            first(row, "active", "status"), row["individual_id"] + ".active")
    }
    roles = {r["role_slot_id"]: r for r in dict_rows(wb.get("P_RoleSlots", []), "role_slot_id")
             if r.get("role_slot_id")}
    role_assignments = []
    for rid, role in sorted(roles.items()):
        incumbent = first(role, "incumbent_id")
        backup = first(role, "backup_id")
        if (incumbent and incumbent not in active_ids) or (backup and backup not in active_ids):
            raise ValueError("RoleSlot refers to inactive individual: " + rid)
        if incumbent and incumbent == backup:
            raise ValueError("RoleSlot primary and backup overlap: " + rid)
        role_assignments.append({
            "id": rid,
            "incumbent": incumbent,
            "backup": backup,
            "need": first(role, "need_status"),
            "search": first(role, "search_status"),
            "priority": first(role, "priority"),
            "reviewDate": first(role, "review_date"),
            "recentNote": first(role, "note") if str(role.get("review_date") or "") >= cutoff else None,
        })
    decisions = []
    seen = set()
    for d in dict_rows(wb.get("D_Decisions", []), "individual_id"):
        iid = d.get("individual_id")
        if iid not in active_ids or d.get("decision_status") not in ("active", "provisional"):
            continue
        date = str(d.get("decision_date") or "")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            raise ValueError("Active decision has invalid date: " + str(iid))
        if date < cutoff:
            continue
        if date > revision[:10]:
            raise ValueError("Decision date exceeds CURRENT revision: " + str(iid))
        if iid in seen:
            raise ValueError("Multiple recent decisions for " + str(iid))
        seen.add(iid)
        role_id = d.get("role_slot_id")
        if role_id and role_id not in roles:
            raise ValueError("Unresolved role for " + str(iid))
        role = roles.get(role_id, {})
        priority = d.get("priority_rank")
        if priority is not None and (not isinstance(priority, int) or priority < 1):
            raise ValueError("Invalid decision priority for " + str(iid))
        decisions.append({
            "id": iid,
            "decisionDate": date,
            "decisionStatus": d["decision_status"],
            "disposition": first(d, "disposition"),
            "refinement": first(d, "refinement_status"),
            "targetLevel": d.get("target_level"),
            "priority": priority,
            "rationale": first(d, "rationale"),
            "roleId": role_id,
            "roleKey": role.get("role_key"),
            "roleName": role.get("role_name"),
            "roleType": role.get("role_type"),
            "roleNeed": role.get("need_status"),
            "searchStatus": role.get("search_status"),
            "rolePriority": role.get("priority"),
        })
    decisions.sort(key=lambda x: x["id"])
    if not decisions:
        raise ValueError("No eligible recent decisions")
    return {
        "meta": {
            "sourceRevision": revision,
            "compatibleLegacyRevision": "2026-10-15-r23",
            "mode": "dated-individual-decisions",
            "cutoffDate": cutoff,
            "decisionCount": len(decisions),
            "roleCount": len(role_assignments),
        },
        "decisions": decisions,
        "roleAssignments": role_assignments,
    }


def generate(workbook: Path, output: Path, cutoff: str):
    if not workbook.is_file():
        raise FileNotFoundError(workbook)
    payload = payload_from_workbook(read_xlsx(workbook), workbook, cutoff)
    output.write_text("window.APP_CURRENT_DECISIONS=" + json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    return payload


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("usage: build_current_decisions.py CURRENT_rNN.xlsx current-decisions.js YYYY-MM-DD")
    p = generate(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3])
    print("recent CURRENT decisions:", p["meta"]["sourceRevision"],
          p["meta"]["decisionCount"], "individuals")
