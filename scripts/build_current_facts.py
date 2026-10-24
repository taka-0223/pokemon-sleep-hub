#!/usr/bin/env python3
"""Produce the *facts-only* emergency PWA overlay from private CURRENT.

The legacy, potentially disputed role/grade/priority snapshot is NOT regenerated
or committed by this operation.  The CURRENT workbook stays outside public Git.

python scripts/build_current_facts.py /private/...CURRENT_rNN.xlsx current-facts.js
"""
from __future__ import annotations
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

FACT_FIELDS = (
    "id", "name", "level", "targetSpeciesName", "mainSkill", "mainSkillLv",
    "shiny", "foods", "foodPattern", "nature", "natureUp", "natureDown",
    "subskills", "primaryMetric", "primaryPR", "primaryEvalLv",
    "topPercent", "measurements",
)
FORBIDDEN_FIELDS = {
    "quality", "disposition", "refinement", "targetLevel", "priority",
    "rationale", "roleId", "roleKey", "roleName", "roleType", "roleNeed",
    "searchStatus", "rolePriority", "speciesGrade", "targetCandidates",
}


def generate(workbook: Path, output: Path, builder: Path | None = None):
    builder = builder or Path(__file__).resolve().parent / "build_data.py"
    if not re.search(r"_r\d+\.xlsx$", workbook.name):
        raise ValueError("CURRENT requires an immutable rNN revision filename")
    if not workbook.is_file():
        raise FileNotFoundError(workbook)
    if not builder.is_file():
        raise FileNotFoundError(builder)
    with tempfile.TemporaryDirectory() as td:
        derived = Path(td) / "derived-private.js"
        subprocess.run([sys.executable, str(builder), str(workbook), str(derived)],
                       check=True, stdout=subprocess.DEVNULL)
        return generate_from_derived(derived, output, workbook)


def generate_from_derived(derived: Path, output: Path, workbook: Path):
    """For local verification of an already-built, SHA-verified CURRENT snapshot."""
    raw = derived.read_text(encoding="utf-8").strip()
    if not raw.startswith("window.APP_DATA=") or not raw.endswith(";"):
        raise ValueError("Unexpected CURRENT-derived data.js format")
    data = json.loads(raw[len("window.APP_DATA="):-1])
    revision = data.get("meta", {}).get("revision")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-r\d+", str(revision)):
        raise ValueError("Invalid or missing source revision")
    if not str(revision).endswith("-" + workbook.stem.rsplit("_", 1)[-1]):
        raise ValueError("Inconsistent CURRENT revision")
    rows = data.get("individuals", [])
    ids = [x.get("id") for x in rows]
    if not rows or len(ids) != len(set(ids)) or any(not x for x in ids):
        raise ValueError("Invalid CURRENT individual ID set")
    inactive_ids = data.get("inactiveIndividualIds", [])
    if (not isinstance(inactive_ids, list) or len(inactive_ids) != len(set(inactive_ids))
            or any(not re.fullmatch(r"IND-\d{4}", str(x)) for x in inactive_ids)
            or set(ids).intersection(inactive_ids)
            or len(ids) + len(inactive_ids) != data.get("meta", {}).get("sourceIndividualCount")):
        raise ValueError("Invalid CURRENT inactive roster reconciliation")
    facts = [{k: x.get(k) for k in FACT_FIELDS} for x in rows]
    if any(FORBIDDEN_FIELDS.intersection(x) for x in facts):
        raise ValueError("Forbidden decision field escaped into facts snapshot")
    if any(x["primaryPR"] is not None and not (0 <= x["primaryPR"] <= 100) for x in facts):
        raise ValueError("Invalid PR")
    if len({r.get("id") for r in data["coverageMatrix"]}) != len(data["coverageMatrix"]):
        raise ValueError("Duplicate role coverage key")
    payload = {
        "meta": {
            "sourceRevision": revision,
            "compatibleLegacyRevision": "2026-10-15-r23",
            "generatedAt": data["meta"].get("generatedAt"),
            "mode": "facts-only-provisional",
            "individualCount": len(facts),
            "prMeasuredCount": sum(x["primaryPR"] is not None for x in facts),
            "sourceIndividualCount": len(ids) + len(inactive_ids),
        },
        "individuals": facts,
        "inactiveIndividualIds": inactive_ids,
        "resources": data["resources"],
        "coverageMatrix": data["coverageMatrix"],
    }
    target = "window.APP_CURRENT_FACTS=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(target, encoding="utf-8")
    return payload


def main(argv=None):
    args = argv or sys.argv[1:]
    if len(args) != 2:
        raise SystemExit("usage: build_current_facts.py CURRENT_rNN.xlsx current-facts.js")
    p = generate(Path(args[0]), Path(args[1]))
    print("facts overlay:", p["meta"]["sourceRevision"], p["meta"]["individualCount"],
          "individuals,", p["meta"]["prMeasuredCount"], "measured")


if __name__ == "__main__":
    main()
