#!/usr/bin/env python3
"""Build public data.js from the private Pokémon Sleep CURRENT.xlsx.

Uses only Python's standard library so the converter can run anywhere.
The workbook itself is intentionally not committed to the public repository.
"""
from __future__ import annotations
import argparse, json, re, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "pr":"http://schemas.openxmlformats.org/package/2006/relationships"}

ROLE_INGREDIENTS = {
    "milk_cacao_mixed":["モーモーミルク","リラックスカカオ"],
    "milk_specialist":["モーモーミルク"], "cacao_specialist":["リラックスカカオ"],
    "apple":["とくせんリンゴ"], "potato":["ほっこりポテト"], "ginger":["あったかジンジャー"],
    "honey":["あまいミツ"], "pumpkin":["ずっしりカボチャ"],
    "oil_leek_flex":["ピュアなオイル","ふといながねぎ"], "corn":["ワカクサコーン"],
    "mushroom":["あじわいキノコ"], "meat":["マメミート"],
}

def col_index(ref:str)->int:
    m=re.match(r"([A-Z]+)",ref)
    n=0
    for ch in m.group(1): n=n*26+ord(ch)-64
    return n-1

def read_xlsx(path:Path):
    z=zipfile.ZipFile(path)
    shared=[]
    if "xl/sharedStrings.xml" in z.namelist():
        root=ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("m:si",NS):
            shared.append("".join((t.text or "") for t in si.iterfind(".//m:t",NS)))
    wb=ET.fromstring(z.read("xl/workbook.xml"))
    relroot=ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rels={x.attrib["Id"]:x.attrib["Target"] for x in relroot}
    sheets={}
    for s in wb.find("m:sheets",NS):
        name=s.attrib["name"]; rid=s.attrib["{%s}id"%NS["r"]]
        target=rels[rid].lstrip("/")
        if not target.startswith("xl/"): target="xl/"+target
        root=ET.fromstring(z.read(target))
        rows=[]
        for row in root.findall(".//m:sheetData/m:row",NS):
            d={}
            for c in row.findall("m:c",NS):
                idx=col_index(c.attrib["r"]); typ=c.attrib.get("t")
                if typ=="inlineStr":
                    val="".join((t.text or "") for t in c.iterfind(".//m:t",NS))
                else:
                    v=c.find("m:v",NS); raw=v.text if v is not None else None
                    if raw is None: val=None
                    elif typ=="s": val=shared[int(raw)]
                    elif typ=="b": val=raw=="1"
                    else:
                        try:
                            num=float(raw); val=int(num) if num.is_integer() else num
                        except: val=raw
                d[idx]=val
            if d:
                width=max(d)+1; arr=[None]*width
                for i,v in d.items(): arr[i]=v
                rows.append((int(row.attrib.get("r","0")),arr))
        sheets[name]=rows
    return sheets

def table(sheets,name,header_row=4):
    rows=dict(sheets[name]); headers=rows[header_row]
    out=[]
    for rn in sorted(k for k in rows if k>header_row):
        r=rows[rn]
        if not r or not r[0]: continue
        r=r+[None]*(len(headers)-len(r))
        out.append(dict(zip(headers,r)))
    return out

def metric_for(role_type): return {"きのみ":"きのみPR","食材":"食材PR","スキル":"スキル発動PR"}.get(role_type)

def build(xlsx:Path, events_path:Path):
    sh=read_xlsx(xlsx)
    individuals=table(sh,"P_Individuals"); decisions=table(sh,"D_Decisions"); roles=table(sh,"P_RoleSlots")
    assessments=table(sh,"M_SpeciesAssessment"); species=table(sh,"M_Species"); measurements=table(sh,"L_Measurements")
    species_map={x["species_key"]:x for x in species}; role_by_id={x["role_slot_id"]:x for x in roles}
    dec_by_ind={x["individual_id"]:x for x in decisions if x.get("decision_status")=="active"}
    assess_by_pair={(x["species_key"],x["role_key"]):x for x in assessments if x.get("status")=="active"}
    meas_by_ind={}
    for m in measurements:
        if m.get("unit")!="percentile" or "Investment scenario" in str(m.get("settings") or ""): continue
        meas_by_ind.setdefault(m["individual_id"],[]).append(m)
    out=[]
    for ind in individuals:
        d=dec_by_ind.get(ind["individual_id"],{}); role=role_by_id.get(d.get("role_slot_id"),{})
        target=species_map.get(ind.get("target_species_key"),{}); metric=metric_for(role.get("role_type")); ms=meas_by_ind.get(ind["individual_id"],[])
        metric_ms=[m for m in ms if m.get("metric")==metric]
        chosen=next((m for m in metric_ms if m.get("evaluation_level")==30),None) or (sorted(metric_ms,key=lambda x:x.get("evaluation_level") or 999)[0] if metric_ms else None)
        pr=chosen.get("value") if chosen else None; sa=assess_by_pair.get((ind.get("target_species_key"),role.get("role_key")))
        out.append({
            "id":ind["individual_id"],"name":ind["display_name"],"level":ind["level"],"speciesKey":ind["current_species_key"],"targetSpeciesKey":ind["target_species_key"],
            "targetSpeciesName":target.get("display_name"),"targetMainSkill":target.get("main_skill"),"targetBerry":target.get("berry"),"skillLv":ind["main_skill_lv"],
            "foods":[ind["ingredient_1"],ind["ingredient_30"],ind["ingredient_60"]],"foodPattern":ind["food_pattern"],"nature":ind["nature_name"],"natureUp":ind["nature_up"],"natureDown":ind["nature_down"],
            "subskills":[{"lv":10,"name":ind["sub_10"]},{"lv":25,"name":ind["sub_25"]},{"lv":50,"name":ind["sub_50"]},{"lv":70,"name":ind["sub_70"]},{"lv":80,"name":ind["sub_80"]}],
            "quality":d.get("individual_quality"),"disposition":d.get("disposition"),"refinement":d.get("refinement_status"),"targetLevel":d.get("target_level"),"stopLevel":d.get("stop_level"),"priority":d.get("priority_rank"),"rationale":d.get("rationale"),
            "dedicatedCandy":d.get("dedicated_candy"),"universalCandy":d.get("universal_candy"),"dreamShard":d.get("dream_shard"),"mainSeedCap":d.get("main_seed_cap"),"silverSeedPolicy":d.get("silver_seed_policy"),
            "roleId":d.get("role_slot_id"),"roleKey":role.get("role_key"),"roleName":role.get("role_name"),"roleType":role.get("role_type"),"roleNeed":role.get("need_status"),"searchStatus":role.get("search_status"),
            "speciesGrade":sa.get("grade") if sa else None,
            "primaryMetric":metric,"primaryPR":pr,"primaryPREvaluationLv":chosen.get("evaluation_level") if chosen else None,"primaryPRTool":chosen.get("tool") if chosen else None,
            "topPercent":round(100-pr,1) if isinstance(pr,(int,float)) else None,
            "measurements":[{"lv":m.get("evaluation_level"),"metric":m.get("metric"),"pr":m.get("value"),"tool":m.get("tool"),"settings":m.get("settings")} for m in ms]
        })
    role_out=[{"id":r["role_slot_id"],"key":r["role_key"],"name":r["role_name"],"type":r["role_type"],"need":r["need_status"],"search":r["search_status"],"priority":r["priority"],"incumbent":r["incumbent_id"],"backup":r["backup_id"],"upgradeTargetSpecies":r["upgrade_target_species"],"gap":r["replacement_gap"],"note":r["note"],"ingredientTargets":ROLE_INGREDIENTS.get(r["role_key"],[])} for r in roles]
    plans=[]
    for p in out:
        if p["disposition"]!="育成" or p["targetLevel"] is None or p["level"]>=p["targetLevel"]: continue
        channels=[]
        if p.get("dedicatedCandy") not in (None,"不可","不要","原則不可"): channels.append("専用アメ: "+str(p["dedicatedCandy"]))
        if p.get("universalCandy") not in (None,"不可","不要","原則不可"): channels.append("ばんのうアメ: "+str(p["universalCandy"]))
        plans.append({"individualId":p["id"],"name":p["name"],"level":p["level"],"targetLevel":p["targetLevel"],"quality":p["quality"],"roleName":p["roleName"],"priority":p["priority"],"channels":channels,"reason":p["rationale"]})
    plans.sort(key=lambda x:((x["priority"] if isinstance(x["priority"],(int,float)) else 99),x["targetLevel"] or 999))
    events=json.loads(events_path.read_text(encoding="utf-8")) if events_path.exists() else []
    # revision comes from M_Rules J3; locate it by fixed sheet coordinate if present
    revision="unknown"
    mr=dict(sh.get("M_Rules",[])); r3=mr.get(3,[])
    if len(r3)>=10 and r3[9]: revision=str(r3[9])
    return {"meta":{"title":"Pokémon Sleep Decision Hub","revision":revision,"schemaVersion":"1.1","generatedAt":"2026-10-02","source":"pokemon_sleep_decision_system_CURRENT.xlsx","individualPRDefinition":"同種族・同食材構成・同評価LvにおけるポケスリシミュのPR","srpDefinition":"同役割種族間の標準化Lv30比較（PWA生成時にポケスリシミュ公開データから算出）"},"individuals":out,"roles":role_out,"events":events,"resourcePlan":plans}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("xlsx",type=Path); ap.add_argument("output",type=Path); ap.add_argument("--events",type=Path,default=Path("config/events.json")); a=ap.parse_args()
    data=build(a.xlsx,a.events); a.output.write_text("window.APP_DATA = "+json.dumps(data,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
    print(f"wrote {a.output}: {len(data['individuals'])} individuals, {sum(x['primaryPR'] is not None for x in data['individuals'])} PR headlines")
if __name__=="__main__": main()
