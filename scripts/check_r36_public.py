#!/usr/bin/env python3
"""Fail-closed validation of an approved r36/r37 public snapshot.

The private workbook is never checked into Git. Its verified SHA256 is pinned
in a versioned public manifest. The historic r35 facts log is read only as
a measurement-preservation baseline, never as a public fallback.
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from collections import Counter
from pathlib import Path

def data(path: Path, prefix: str) -> dict:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError("Invalid JSONP payload " + path.name)
    return json.loads(raw[len(prefix):-1])

def require(ok, label):
    if not ok:
        raise ValueError(label)

def manifest_profile(pinned: dict) -> dict:
    revision = pinned.get("revision")
    require(revision in ("2026-10-25-r36", "2026-11-01-r37"), "unsupported manifest revision")
    # Only the already-published r36 manifest may omit these historical fields.
    legacy = {"schema_version": "1.2", "app_version": "0.20", "model_version": "r36",
              "decision_date": "2026-10-25"} if revision == "2026-10-25-r36" else {}
    profile = {}
    for key in ("schema_version", "app_version", "model_version", "decision_date"):
        value = pinned.get(key, legacy.get(key))
        require(isinstance(value, str) and bool(value.strip()), "manifest missing " + key)
        profile[key] = value
    if revision == "2026-11-01-r37":
        for key in ("seed_model_version", "game_data_version"):
            value = pinned.get(key)
            require(isinstance(value, str) and bool(value.strip()), "manifest missing " + key)
            profile[key] = value
    return profile

def verify(candidate: Path, manifest: Path, facts: Path):
    pinned=json.loads(manifest.read_text(encoding="utf-8"))
    profile=manifest_profile(pinned)
    raw=candidate.read_bytes()
    sha=hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\x00"+raw).hexdigest()
    require(sha==pinned["data_blob_sha"],"Data blob differs from audited snapshot")
    d=data(candidate,"window.APP_DATA=")
    m=d["meta"]
    require(m["revision"]==pinned["revision"],"revision mismatch")
    require(m["sourceSha256"]==pinned["source_sha256"],"source provenance mismatch")
    require(m["schemaVersion"]==profile["schema_version"] and m["modelVersion"]==profile["model_version"],"schema/model mismatch")
    require(m["appVersion"]==profile["app_version"],"app version mismatch")
    if "seed_model_version" in profile:
        require(m.get("seedModelVersion")==profile["seed_model_version"],"seed model mismatch")
        require(m.get("gameDataVersion")==profile["game_data_version"],"game data version mismatch")
    require(all(m.get(key)==m["revision"] for key in
                ("currentFactsRevision","currentDecisionRevision","currentAssignmentsRevision")),
            "mixed current revisions")
    i=d["individuals"]; r=d["roles"]; c=d["coverageMatrix"]; a=d["speciesAssessments"]
    inactive=set(d["inactiveIndividualIds"]); ids=[x["id"] for x in i]
    require(len(i)==pinned["individuals"]==35 and len(set(ids))==35,"individual count/duplicates")
    require(len(inactive)==pinned["inactive"]==8 and not (inactive&set(ids)),"retired present")
    require(sum(x["primaryPR"] is not None for x in i)==pinned["active_pr"]==30,"PR count")
    require(len(r)==pinned["roles"]==33 and len({x["id"] for x in r})==33,"RoleSlot count")
    require(len(c)==pinned["coverage"]==47 and len({x["id"] for x in c})==47,"Coverage count")
    require(len(a)==pinned["assessments"]==63 and len({x["id"] for x in a})==63,"Tier count")
    require(len(d.get("speciesMaster",[]))==98,"species count")
    require(m["sourceMeasurementCount"]==pinned["source_measurements"]==219,"source measurements")
    require(all(x.get("currentDecisionDate")==profile["decision_date"] for x in i),"stale individual judgment")
    require(all(x.get("currentDecisionStatus") in ("active","provisional") for x in i),"decision status")
    require(all(x.get("investmentWindow") for x in i),"investment evaluation missing")
    require(all(x.get("roleFit") and x.get("cookingContribution") for x in i),"evaluation axes missing")
    require(all("status" in x and "confidence" in x for x in a),"tier provenance missing")
    require(sum(x["domain"]=="食材" and x.get("phase6FoodClass") and
                x.get("cookingEvidence")=="P6_R23_PROVISIONAL" for x in c)==19,
            "Phase6 19 food classification missing/provisional status")
    for x in r:
        for k in ("incumbent","backup"):
            require(not x.get(k) or x[k] in ids,"retired RoleSlot reference "+x["id"])
        require(x.get("cookingDemand") and x.get("investmentGate"),"role gates missing")
        for cand in x.get("targetCandidates",[]):
            require("status" in cand and "confidence" in cand,"candidate confidence/status missing")
    for x in c:
        for val in (x.get("holder"),x.get("backup")):
            require(all(v in ids for v in re.findall(r"IND-\d{4}",str(val or ""))),
                    "retired coverage reference "+x["id"])
    for x in i:
        require(bool(x.get("currentSpeciesKey")),"current species identity missing "+x["id"])
        if x["primaryPR"] is None:
            require(x.get("topPercent") is None,"unmeasured PR displayed as 0")
        if x.get("quality") is None:
            require(x.get("qualityStatus")=="unmeasured","unrated individual status")
    for iid in ("IND-0030","IND-0032","IND-0041","IND-0042","IND-0043"):
        x=next(y for y in i if y["id"]==iid)
        require(x["primaryPR"] is None,"known unmeasured PR "+iid)
    tiers={(x["speciesKey"],x["roleKey"]):x for x in a}
    for species, role in (("blastoise","milk_specialist"),("raichu","berry_electric")):
        a0=tiers[(species,role)]
        require(a0["grade"]=="S" and a0["status"]=="provisional","provisional S mislabeled")
    require(next(x for x in r if x["id"]=="ROLE-019")["backup"]=="IND-0041","corn backup")
    require(next(x for x in r if x["id"]=="ROLE-018")["priority"]=="高","oil priority")
    require(next(x for x in r if x["id"]=="ROLE-029")["priority"]=="中","avocado priority")
    prior=data(facts,"window.APP_CURRENT_FACTS=")
    by_id={x["id"]:x for x in prior["individuals"]}
    require(set(by_id)==set(ids),"historical/current active IDs differ")
    def row_signature(xs):
        return Counter((m["lv"],m["metric"],m["pr"]) for m in xs)
    for x in i:
        old=by_id[x["id"]]
        require(x["primaryPR"]==old["primaryPR"],"primary PR changed "+x["id"])
        require(row_signature(x["measurements"])==row_signature(old["measurements"]),
                "Measurement history lost "+x["id"])
    return {"status":"PASS","revision":m["revision"],"counts":{ "individuals":len(i),
      "primary_pr":sum(x["primaryPR"] is not None for x in i), "roles":len(r),
      "coverage":len(c),"species_tiers":len(a), "history_rows":sum(len(x["measurements"]) for x in i)}}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--candidate",required=True,type=Path)
    p.add_argument("--manifest",required=True,type=Path)
    p.add_argument("--facts",required=True,type=Path)
    a=p.parse_args()
    try:
        print(json.dumps(verify(a.candidate,a.manifest,a.facts),ensure_ascii=False))
    except Exception as e:
        print("BLOCKED:",str(e),file=sys.stderr)
        return 2
    return 0
if __name__=="__main__":
    sys.exit(main())
