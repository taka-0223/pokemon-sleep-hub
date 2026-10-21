#!/usr/bin/env python3
"""Fail closed on unapproved CURRENT-to-public data drift.

This verifier NEVER uses the public snapshot to fill gaps in CURRENT.  It does
not adjudicate whether conflicting historical measurements are correct.

Example:
    python3 scripts/check_data_sync.py --baseline data.js --candidate /tmp/r26.js \
        --current /private/CURRENT_r26.xlsx --report /tmp/sync-report.json

The optional approval manifest contains exact, reviewed before/after field
changes; it does not authorize removing a known PR or measurement, resource
key, or RoleSlot. Review and actual production publication remain separate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path


def digest(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def load_snapshot(path):
    raw = Path(path).read_text(encoding="utf-8").strip()
    match = re.fullmatch(r"window\.APP_DATA\s*=\s*(\{.*\})\s*;?", raw, re.S)
    if not match:
        raise ValueError(f"Invalid APP_DATA JavaScript wrapper: {path}")
    data = json.loads(match.group(1))
    for name in ("meta", "individuals", "roles", "resources", "coverageMatrix"):
        if name not in data:
            raise ValueError(f"Missing required top-level key {name!r}")
    return data


def by_id(xs, label):
    ids = [x.get("id") for x in xs]
    if len(ids) != len(set(ids)) or any(not x for x in ids):
        raise ValueError(f"Invalid/duplicate identifiers in {label}")
    return {x["id"]: x for x in xs}


def measurement_key(row):
    return (row.get("lv"), row.get("metric"), row.get("pr"), row.get("tool"))


def walk(old, new, path=""):
    if isinstance(old, dict) and isinstance(new, dict):
        for k in sorted(set(old) | set(new)):
            yield from walk(old.get(k), new.get(k), f"{path}.{k}" if path else str(k))
    elif isinstance(old, list) and isinstance(new, list):
        if old != new:
            yield path, old, new
    elif type(old) != type(new) or old != new:
        yield path, old, new


def validate(baseline, candidate, allow=None, current=None, base_path=None, candidate_path=None, current_path=None):
    approvals = allow or {}
    if allow:
        for required in ("baseline_sha256", "current_sha256", "expected_revision", "allowed_changes", "allowed_new_ids"):
            if required not in approvals:
                raise ValueError(f"Manifest missing {required}")
    allowed = {}
    for row in approvals.get("allowed_changes", []):
        path = row.get("path")
        if not path or not row.get("source") or path in allowed:
            raise ValueError("Each approval needs a unique path and source")
        allowed[path] = row

    problems = []
    def block(kind, msg, path=None):
        problems.append({"type":kind,"message":msg,"path":path})

    if base_path and allow and digest(base_path) != approvals["baseline_sha256"]:
        block("authority", "Baseline SHA-256 does not match manifest")
    if current_path and allow and digest(current_path) != approvals["current_sha256"]:
        block("authority", "CURRENT SHA-256 does not match manifest")
    if allow and candidate["meta"].get("revision") != approvals["expected_revision"]:
        block("authority", "Candidate revision does not match manifest")
    if not allow and baseline["meta"].get("revision") != candidate["meta"].get("revision"):
        block("unapproved_revision", "New revision needs exact reviewed-change manifest")

    b_ind=by_id(baseline["individuals"],"baseline individuals")
    c_ind=by_id(candidate["individuals"],"candidate individuals")
    b_roles=by_id(baseline["roles"],"baseline roles")
    c_roles=by_id(candidate["roles"],"candidate roles")
    b_cover=by_id(baseline["coverageMatrix"],"baseline role coverage")
    c_cover=by_id(candidate["coverageMatrix"],"candidate role coverage")

    removed_ids=set(b_ind)-set(c_ind)
    if removed_ids: block("individual_loss",f"Missing existing individuals: {sorted(removed_ids)}")
    new_ids=sorted(set(c_ind)-set(b_ind))
    if new_ids != sorted(approvals.get("allowed_new_ids", [])):
        block("new_individuals",f"New IDs require exact approval: {new_ids}")
    for iid in new_ids:
        ind=c_ind[iid]
        if ind.get("primaryPR") is not None or ind.get("speciesGrade") is not None or ind.get("quality") is not None or ind.get("roleId") is not None:
            block("unapproved_assessment",f"New {iid} has unreviewed formal score/role")

    if set(b_roles)!=set(c_roles):
        block("roleslot_loss",f"RoleSlot IDs changed: missing={sorted(set(b_roles)-set(c_roles))}, added={sorted(set(c_roles)-set(b_roles))}")
    # A published non-empty candidate roster must not silently become empty,
    # even if someone mistakenly lists that field in an approval manifest.
    # This is independent of the exact-value change gate below.
    for rid in sorted(set(b_roles)&set(c_roles)):
        older=b_roles[rid].get("targetCandidates") or []
        newer=c_roles[rid].get("targetCandidates") or []
        if older and not newer:
            block("role_candidate_loss",
                  f"{rid} loses all {len(older)} published role candidates",
                  f"roles.{rid}.targetCandidates")
    if set(b_cover)!=set(c_cover):
        block("coverage_loss",f"Coverage IDs changed: missing={sorted(set(b_cover)-set(c_cover))}, added={sorted(set(c_cover)-set(b_cover))}")

    disappeared_resources=sorted(set(baseline["resources"])-set(candidate["resources"]))
    if disappeared_resources:
        block("resource_loss",f"Previously published resource keys missing: {disappeared_resources}")
    if baseline["meta"].get("appVersion") != candidate["meta"].get("appVersion"):
        block("app_contract","App version changed during data-only sync")

    for iid in sorted(set(b_ind)&set(c_ind)):
        b,c=b_ind[iid],c_ind[iid]
        if b.get("primaryPR") is not None and c.get("primaryPR") is None:
            block("pr_loss",f"{iid} loses published main PR",f"individuals.{iid}.primaryPR")
        old=Counter(measurement_key(x) for x in b.get("measurements",[]))
        new=Counter(measurement_key(x) for x in c.get("measurements",[]))
        if old-new:
            block("measurement_loss",f"{iid} loses {sum((old-new).values())} published measurement(s)",f"individuals.{iid}.measurements")

    changes = []
    for family, old, new in (("individuals",b_ind,c_ind),("roles",b_roles,c_roles),("coverageMatrix",b_cover,c_cover)):
        for iid in sorted(set(old)&set(new)):
            for field, before, after in walk(old[iid],new[iid],f"{family}.{iid}"):
                changes.append((field,before,after))
    for field, before, after in walk(baseline["resources"],candidate["resources"],"resources"):
        changes.append((field,before,after))
    for field in ("schemaVersion", "title"):
        if baseline["meta"].get(field)!=candidate["meta"].get(field):
            block("schema_change",f"meta.{field} changed without schema migration")
    for field, before, after in changes:
        approved=allowed.get(field)
        if not approved or approved.get("before")!=before or approved.get("after")!=after:
            block("unapproved_change",f"No exact reviewed change for {field}",field)
    used = {field for field,_,_ in changes}
    for field in allowed:
        if field not in used: block("unused_approval",f"Stale or unnecessary approval: {field}")

    if current is not None:
        expected_revision = current.get("revision")
        if candidate["meta"].get("revision") != expected_revision:
            block("wrong_revision",f"Expected {expected_revision}, got {candidate['meta'].get('revision')}")
        expected_ids=set(current["active_ids"])
        if expected_ids!=set(c_ind):
            block("source_mismatch",f"Current/candidate active IDs differ: missing={sorted(expected_ids-set(c_ind))}, excess={sorted(set(c_ind)-expected_ids)}")
        if len(current["role_ids"])!=len(c_roles) or set(current["role_ids"])!=set(c_roles):
            block("source_mismatch","CURRENT RoleSlot IDs mismatch")
        if set(current["coverage_ids"])!=set(c_cover):
            block("source_mismatch","CURRENT Coverage IDs mismatch")
        filename_revision=current.get("filename_revision")
        if filename_revision and not str(expected_revision).endswith("-"+filename_revision):
            block("source_revision_conflict",f"CURRENT filename says {filename_revision}, but M_Rules.DATA_REVISION={expected_revision}")
        change_log_revision=current.get("change_log_revision")
        if change_log_revision and change_log_revision != expected_revision:
            block("source_revision_conflict",f"H_ChangeLog latest revision is {change_log_revision}, but M_Rules.DATA_REVISION={expected_revision}")

    kinds=dict(sorted(Counter(x["type"] for x in problems).items()))
    return {
        "status":"PASS" if not problems else "BLOCKED",
        "baseline_revision":baseline["meta"].get("revision"),
        "candidate_revision":candidate["meta"].get("revision"),
        "baseline_sha256":digest(base_path) if base_path else None,
        "candidate_sha256":digest(candidate_path) if candidate_path else None,
        "current_sha256":digest(current_path) if current_path else None,
        "counts":{"baseline_individuals":len(b_ind),"candidate_individuals":len(c_ind),
                  "baseline_measured":sum(x.get("primaryPR") is not None for x in b_ind.values()),
                  "candidate_measured":sum(x.get("primaryPR") is not None for x in c_ind.values()),
                  "baseline_roles":len(b_roles),"candidate_roles":len(c_roles),
                  "baseline_resources":len(baseline["resources"]),"candidate_resources":len(candidate["resources"]),
                  "baseline_coverage":len(b_cover),"candidate_coverage":len(c_cover)},
        "new_ids":new_ids,"change_count":len(changes),"problems_by_type":kinds,
        "problems":problems[:150],"truncated_problems":max(0,len(problems)-150),
    }


def load_current(path):
    from build_data import dict_rows,read_xlsx
    w=read_xlsx(Path(path))
    rows=dict_rows(w.get("M_Rules",[]),"rule_id")
    rule=next((x for x in rows if x.get("rule_id")=="DATA_REVISION"),None)
    if not rule: raise ValueError("CURRENT has no DATA_REVISION rule")
    inds=dict_rows(w.get("P_Individuals",[]),"individual_id")
    active=lambda x: x.get("active") not in (False,0,"False", "false")
    filename_match=re.search(r"_r(\d+)\.xlsx$",Path(path).name,re.I)
    change_log=dict_rows(w.get("H_ChangeLog",[]),"log_id")
    latest_log_revision=None
    for row in reversed(change_log):
        if row.get("type") != "revision": continue
        match=re.search(r"\d{4}-\d{2}-\d{2}-r\d+",str(row.get("change") or ""))
        if match:
            latest_log_revision=match.group(0)
            break
    return {"revision":rule["value"],
            "filename_revision":"r"+filename_match.group(1) if filename_match else None,
            "change_log_revision":latest_log_revision,
            "active_ids":[x["individual_id"] for x in inds if active(x)],
            "role_ids":[x["role_slot_id"] for x in dict_rows(w.get("P_RoleSlots",[]),"role_slot_id")],
            "coverage_ids":[x["coverage_id"] for x in dict_rows(w.get("P_RoleCoverage",[]),"coverage_id")]}


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--baseline",required=True)
    p.add_argument("--candidate",required=True)
    p.add_argument("--current",help="local-only path: never publish the workbook")
    p.add_argument("--manifest",help="exact reviewed-delta approval manifest")
    p.add_argument("--report",help="write machine-readable audit report")
    args=p.parse_args(argv)
    base=load_snapshot(args.baseline)
    candidate=load_snapshot(args.candidate)
    allow=json.loads(Path(args.manifest).read_text()) if args.manifest else None
    current=load_current(args.current) if args.current else None
    result=validate(base,candidate,allow,current,args.baseline,args.candidate,args.current)
    text=json.dumps(result,ensure_ascii=False,indent=2)
    if args.report: Path(args.report).write_text(text+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k!="problems"},ensure_ascii=False))
    return 0 if result["status"]=="PASS" else 2

if __name__=="__main__": sys.exit(main())