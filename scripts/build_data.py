#!/usr/bin/env python3
"""Build public PWA data.js from the private CURRENT.xlsx SSOT.

Usage:
  python3 scripts/build_data.py /path/to/pokemon_sleep_decision_system_CURRENT.xlsx data.js

The workbook itself is intentionally not committed to the public repository.
Only the derived public snapshot (data.js) is published.
"""
from __future__ import annotations
import json, re, sys, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS={"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
PKG="http://schemas.openxmlformats.org/package/2006/relationships"

def col_index(ref:str)->int:
    m=re.match(r"([A-Z]+)",ref or "A")
    n=0
    for ch in m.group(1):
        n=n*26+ord(ch)-64
    return n-1

def read_xlsx(path:Path):
    with zipfile.ZipFile(path) as z:
        shared=[]
        if "xl/sharedStrings.xml" in z.namelist():
            root=ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si",NS):
                shared.append("".join(t.text or "" for t in si.iter("{%s}t"%NS["m"])))
        wb=ET.fromstring(z.read("xl/workbook.xml"))
        relroot=ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rels={x.attrib["Id"]:x.attrib["Target"] for x in relroot.findall("{%s}Relationship"%PKG)}
        out={}
        for s in wb.find("m:sheets",NS):
            name=s.attrib["name"]; rid=s.attrib["{%s}id"%NS["r"]]
            target=rels[rid].lstrip("/")
            if not target.startswith("xl/"): target="xl/"+target
            root=ET.fromstring(z.read(target))
            rows=[]
            for row in root.findall(".//m:sheetData/m:row",NS):
                vals={}
                for c in row.findall("m:c",NS):
                    idx=col_index(c.attrib.get("r","A1")); typ=c.attrib.get("t")
                    v=c.find("m:v",NS); value=None
                    if typ=="inlineStr":
                        ins=c.find("m:is",NS)
                        value="".join(t.text or "" for t in ins.iter("{%s}t"%NS["m"])) if ins is not None else ""
                    elif v is not None:
                        raw=v.text or ""
                        if typ=="s": value=shared[int(raw)] if raw else ""
                        elif typ=="b": value=(raw=="1")
                        else:
                            try:
                                num=float(raw); value=int(num) if num.is_integer() else num
                            except: value=raw
                    vals[idx]=value
                if vals:
                    rowv=[None]*(max(vals)+1)
                    for i,v in vals.items(): rowv[i]=v
                    rows.append(rowv)
            out[name]=rows
        return out

def dict_rows(rows, required):
    header_i=None
    for i,row in enumerate(rows[:12]):
        vals={str(x).strip() for x in row if x is not None}
        if required in vals:
            header_i=i; break
    if header_i is None: return []
    headers=[str(x).strip() if x is not None else "" for x in rows[header_i]]
    result=[]
    for row in rows[header_i+1:]:
        if not any(x is not None for x in row): continue
        d={}
        for i,h in enumerate(headers):
            if h: d[h]=row[i] if i<len(row) else None
        result.append(d)
    return result

def first(d,*keys):
    for k in keys:
        if k in d and d[k] not in (None,""): return d[k]
    return None

def main():
    if len(sys.argv)<2:
        raise SystemExit("usage: build_data.py CURRENT.xlsx [data.js]")
    xlsx=Path(sys.argv[1]); target=Path(sys.argv[2] if len(sys.argv)>2 else "data.js")
    wb=read_xlsx(xlsx)
    inds=dict_rows(wb.get("P_Individuals",[]),"individual_id")
    decisions=dict_rows(wb.get("D_Decisions",[]),"individual_id")
    roles=dict_rows(wb.get("P_RoleSlots",[]),"role_slot_id")
    assessments=dict_rows(wb.get("M_SpeciesAssessment",[]),"species_key")
    measurements=dict_rows(wb.get("L_Measurements",[]),"individual_id")
    species=dict_rows(wb.get("M_Species",[]),"species_key")
    account=dict_rows(wb.get("P_Account",[]),"account_key")
    rules=dict_rows(wb.get("M_Rules",[]),"rule_id")
    role_coverage=dict_rows(wb.get("P_RoleCoverage",[]),"coverage_id")

    dec_by={x.get("individual_id"):x for x in decisions}
    role_by={x.get("role_slot_id"):x for x in roles}
    species_name={x.get("species_key"):first(x,"display_name","species_name","name") for x in species}
    species_skill={x.get("species_key"):first(x,"main_skill","mainSkill") for x in species}
    assess={(x.get("species_key"),x.get("role_key")):x for x in assessments}
    grade_order={"S":0,"A+":1,"A":2}
    assess_by_role={}
    for a in assessments:
        if a.get("grade") not in grade_order: continue
        if a.get("status") not in (None,"","active","provisional"): continue
        assess_by_role.setdefault(a.get("role_key"),[]).append(a)
    def role_candidates(r):
        preferred=first(r,"target_species_key","upgrade_target_species","upgrade_target_species_key")
        xs=assess_by_role.get(r.get("role_key"),[])
        xs=sorted(xs,key=lambda a:(0 if a.get("species_key")==preferred else 1,grade_order.get(a.get("grade"),9),species_name.get(a.get("species_key")) or str(a.get("species_key") or "")))
        return [{"speciesKey":a.get("species_key"),"name":species_name.get(a.get("species_key")) or a.get("species_key"),"grade":a.get("grade"),"preferred":a.get("species_key")==preferred} for a in xs]
    meas={}
    for m in measurements: meas.setdefault(m.get("individual_id"),[]).append(m)

    metric_for={"きのみ":"きのみPR","食材":"食材PR","スキル":"スキル発動PR"}
    app=[]
    for ind in inds:
        if first(ind,"active","status") is False: continue
        iid=ind.get("individual_id"); d=dec_by.get(iid,{})
        r=role_by.get(d.get("role_slot_id"),{})
        rtype=r.get("role_type"); metric=metric_for.get(rtype)
        ms=[m for m in meas.get(iid,[]) if first(m,"unit") in (None,"percentile")]
        prim=[m for m in ms if m.get("metric")==metric]
        prim.sort(key=lambda m: (m.get("evaluation_level") or 999))
        chosen=next((m for m in prim if m.get("evaluation_level")==30),prim[0] if prim else None)
        pr=chosen.get("value") if chosen else None
        try: top=round(100-float(pr),1) if pr is not None else None
        except: top=None
        target_key=ind.get("target_species_key")
        sa=assess.get((target_key,r.get("role_key")),{})
        app.append({
          "id":iid,"name":first(ind,"display_name","name"),"level":ind.get("level"),
          "targetSpeciesName":species_name.get(target_key) or target_key,
          "mainSkill":species_skill.get(ind.get("current_species_key")) or species_skill.get(target_key),
          "mainSkillLv":ind.get("main_skill_lv"),
          "foods":[ind.get("ingredient_1"),ind.get("ingredient_30"),ind.get("ingredient_60")],
          "foodPattern":ind.get("food_pattern"),"nature":ind.get("nature_name"),
          "natureUp":ind.get("nature_up"),"natureDown":ind.get("nature_down"),
          "subskills":[{"lv":lv,"name":ind.get("sub_%s"%lv)} for lv in (10,25,50,70,80)],
          "quality":d.get("individual_quality"),"disposition":d.get("disposition"),
          "refinement":d.get("refinement_status"),"targetLevel":d.get("target_level"),
          "priority":first(d,"priority_rank") or first(ind,"priority_rank"),
          "rationale":d.get("rationale"),"roleId":d.get("role_slot_id"),
          "roleKey":r.get("role_key"),"roleName":r.get("role_name"),"roleType":rtype,
          "roleNeed":r.get("need_status"),"searchStatus":r.get("search_status"),"rolePriority":r.get("priority"),
          "speciesGrade":sa.get("grade"),"primaryMetric":metric,
          "primaryPR":pr,"primaryEvalLv":chosen.get("evaluation_level") if chosen else None,"topPercent":top,
          "measurements":[{"lv":m.get("evaluation_level"),"metric":m.get("metric"),"pr":m.get("value"),"tool":m.get("tool")} for m in ms if m.get("metric") and m.get("value") is not None]
        })

    app_roles=[{
      "id":r.get("role_slot_id"),"key":r.get("role_key"),"name":r.get("role_name"),"type":r.get("role_type"),
      "incumbent":r.get("incumbent_id"),"backup":r.get("backup_id"),"need":r.get("need_status"),
      "search":r.get("search_status"),"upgradeTarget":first(r,"target_species_key","upgrade_target_species","upgrade_target_species_key"),
      "upgradeTargetName":species_name.get(first(r,"target_species_key","upgrade_target_species","upgrade_target_species_key")) or first(r,"target_species_key","upgrade_target_species","upgrade_target_species_key"),
      "targetCandidates":role_candidates(r),
      "gap":r.get("replacement_gap"),"priority":r.get("priority"),"note":r.get("note")
    } for r in roles]

    def coverage(t):
        return [r for r in app_roles if r["type"]==t]
    resources={}
    for a in account:
        key=first(a,"account_key","resource_key","key")
        if not key: continue
        resources[str(key)]={"value":first(a,"value","amount","count"),"text":first(a,"note","text","memo")}

    revision="CURRENT"
    for rr in rules:
        val=first(rr,"value","setting_value")
        if rr.get("rule_id") in ("DATA_REVISION","data_revision") and val: revision=str(val)

    coverage_matrix=[{
      "id":c.get("coverage_id"),"domain":c.get("domain"),"key":c.get("role_key"),"name":c.get("role_name"),
      "status":c.get("coverage_status"),"priority":c.get("priority")
    } for c in role_coverage]
    event_path=Path(__file__).resolve().parent.parent/"config"/"events.json"
    events=json.loads(event_path.read_text(encoding="utf-8")) if event_path.exists() else []
    generated_at=revision[:10] if re.match(r"^\d{4}-\d{2}-\d{2}",revision) else None
    data={"meta":{"title":"Pokémon Sleep Decision Hub","revision":revision,"schemaVersion":"1.1","generatedAt":generated_at,"source":xlsx.name,"appVersion":"0.10"},
          "individuals":app,"roles":app_roles,
          "coverage":{"food":coverage("食材"),"berry":coverage("きのみ"),"skill":coverage("スキル")},
          "resources":resources,"events":events,"coverageMatrix":coverage_matrix}
    target.write_text("window.APP_DATA="+json.dumps(data,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    print("data snapshot:",len(app),"individuals,",len(app_roles),"roles,",sum(x["primaryPR"] is not None for x in app),"PR-measured ->",target)

if __name__=="__main__": main()
