#!/usr/bin/env python3
"""Generate Species Role Percentile (SRP) from pokesle-simulator public source.

SRP v0.1 is intentionally different from individual PR.
It compares final-evolution species at a standardized Lv30 baseline:
- Berry: same berry, berry-specialty species only.
- Food: same target ingredient available at Lv30, ingredient-specialty species only.
- Skill: same main skill, skill-specialty species only.
No nature, subskills, camp, field/event bonuses, or seed investment.

The formulas mirror the public simulator's base Lv speed, berry energy, food quantities,
food/skill rates, and skill ceiling. The trigger model uses the simulator's default
8.5h sleep / 10 checks and 2-trigger carry for skill specialists, with a neutral
standardized help-rate baseline so comparisons remain species-to-species rather than
an account simulation.
"""
from __future__ import annotations
import argparse, json, math, re, subprocess
from pathlib import Path

LV=30; SLEEP_HOURS=8.5; CHECK_FREQ=10; POKEMON_SLEEP_TIME=500

def js_round(x): return math.floor(x+0.5)

def parse_energy(path:Path):
    text=path.read_text(encoding="utf-8")
    return {n:float(e) for n,e in re.findall(r"\{\s*name:\s*'([^']+)'\s*,\s*energy:\s*([0-9.]+)",text)}

def parse_pokemon(path:Path):
    text=path.read_text(encoding="utf-8")
    out=[]
    for line in text.splitlines():
        if "{ name:" not in line or "help:" not in line or "foodRate:" not in line: continue
        def s(pattern, default=None):
            m=re.search(pattern,line); return m.group(1) if m else default
        def f(pattern, default=None):
            v=s(pattern); return float(v) if v is not None else default
        def i(pattern, default=None):
            v=s(pattern); return int(v) if v is not None else default
        name=s(r"name:\s*'([^']+)'")
        food_blob=s(r"foodList:\s*\[([^\]]*)\]","")
        foods=re.findall(r"'([^']+)'",food_blob)
        before=s(r"evolve:\s*\{\s*before:\s*(?:'([^']+)'|null)")
        field_blob=s(r"fieldList:\s*\[([^\]]*)\]",None)
        out.append({
            "name":name,"specialty":s(r"specialty:\s*'([^']+)'") ,"berry":s(r"berry:\s*'([^']+)'") ,
            "foods":foods,"skill":s(r"skill:\s*'([^']+)'") ,"help":i(r"help:\s*(\d+)"),"bag":i(r"bag:\s*(\d+)",0),
            "foodRate":f(r"foodRate:\s*([0-9.]+)",0),"skillRate":f(r"skillRate:\s*([0-9.]+)",0),
            "before":before,"kaihou":"kaihou: true" in line,"fieldEmpty":(field_blob is not None and not field_blob.strip()),
        })
    before_names={x["before"] for x in out if x.get("before")}
    for x in out: x["final"] = x["name"] not in before_names
    return out

def speed(p): return p["help"]*(1-(LV-1)*0.002)
def helps_per_day(p): return 86400/speed(p)
def berry_energy(base): return max(base+LV-1, base*(1.025**(LV-1)))

def slot_num(p, food_name, slot_idx, food_energy):
    first=food_energy[p["foods"][0]] * (2 if p["specialty"] in ("食材","オール") else 1)
    return js_round(first * [1,2.25,3.6][slot_idx] / food_energy[food_name])

def food_patterns(p):
    if not p["foods"]: return []
    if len(p["foods"])==1: return [[p["foods"][0]]]
    return [[p["foods"][0],p["foods"][0]],[p["foods"][0],p["foods"][1]]]

def food_score(p,target,food_energy):
    best=None; bestpat=None
    for pat in food_patterns(p):
        if target not in pat: continue
        total=0
        for idx,name in enumerate(pat):
            if name==target: total+=slot_num(p,name,idx,food_energy)
        expected_per_food_help=total/len(pat)
        sc=helps_per_day(p)*p["foodRate"]*expected_per_food_help
        if best is None or sc>best: best,bestpat=sc,"".join("A" if x==p["foods"][0] else "B" for x in pat)
    return best,bestpat

def skill_triggers(p,food_energy):
    # Standardize on AA at Lv30 for inventory fill; no subskills/nature.
    pat=[p["foods"][0],p["foods"][0]] if p["foods"] else []
    foodnum=(sum(slot_num(p,n,idx,food_energy) for idx,n in enumerate(pat))/len(pat)) if pat else 0
    berry_num=2 if p["specialty"] in ("きのみ","オール") else 1
    items_per_help=berry_num*(1-p["foodRate"])+foodnum*p["foodRate"]
    bag=p["bag"] + (1 if POKEMON_SLEEP_TIME>=200 else 0) + (2 if POKEMON_SLEEP_TIME>=500 else 0) + (3 if POKEMON_SLEEP_TIME>=1000 else 0)
    bag_full=(bag/items_per_help+4) if items_per_help else 999
    ceil_n=40*3600/p["help"] if p["specialty"] in ("スキル","オール") else 78
    rate=p["skillRate"]
    prob=rate/(1-(1-rate)**ceil_n) if rate>0 else 0
    day_hours=24-SLEEP_HOURS; day_total=day_hours*3600/speed(p); night_total=SLEEP_HOURS*3600/speed(p)
    day_n=min(day_total/(CHECK_FREQ-1),bag_full); night_n=min(night_total,bag_full)
    def expected_two(n):
        if n<=0: return 0
        p0=(1-prob)**n
        p1=((1-prob)**(n-1))*prob*n if n>=1 else 0
        p2=max(0,1-p0-p1) if n>=2 else 0
        return p1+2*p2
    return expected_two(day_n)*(CHECK_FREQ-1)+expected_two(night_n)

def add_percentiles(entries):
    # entries: list of dict with score. Highest score => percentile 100.
    entries.sort(key=lambda x:x["score"], reverse=True); n=len(entries)
    i=0
    while i<n:
        j=i+1
        while j<n and abs(entries[j]["score"]-entries[i]["score"])<1e-12: j+=1
        avg_rank=(i+1+j)/2
        pct=100.0 if n==1 else 100*(n-avg_rank)/(n-1)
        top=0.0 if n==1 else 100-pct
        for k in range(i,j):
            entries[k].update({"rank":round(avg_rank,1),"cohortSize":n,"percentile":round(pct,1),"topPercent":round(top,1)})
        i=j
    return entries

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("upstream",type=Path); ap.add_argument("output",type=Path); a=ap.parse_args()
    pokemon=parse_pokemon(a.upstream/"src/data/pokemon.ts")
    berry_energy_map=parse_energy(a.upstream/"src/data/berry.ts")
    food_energy_map=parse_energy(a.upstream/"src/data/food_and_cooking.ts")
    finals=[p for p in pokemon if p["final"] and not p["kaihou"] and not p["fieldEmpty"] and p["help"] and p["foods"]]
    roles={"berry":{},"food":{},"skill":{}}
    # Berry cohorts: same berry among berry specialists.
    for berry in sorted({p["berry"] for p in finals if p["specialty"]=="きのみ" and p["berry"] in berry_energy_map}):
        es=[]
        for p in finals:
            if p["specialty"]!="きのみ" or p["berry"]!=berry: continue
            score=helps_per_day(p)*(1-p["foodRate"])*2*berry_energy(berry_energy_map[berry])
            es.append({"species":p["name"],"score":round(score,4)})
        roles["berry"][berry]=add_percentiles(es)
    # Food cohorts: same target ingredient available at Lv30 among ingredient specialists.
    all_foods=sorted(food_energy_map)
    for food in all_foods:
        es=[]
        for p in finals:
            if p["specialty"]!="食材": continue
            sc,pat=food_score(p,food,food_energy_map)
            if sc is not None: es.append({"species":p["name"],"score":round(sc,4),"pattern":pat})
        if es: roles["food"][food]=add_percentiles(es)
    # Skill cohorts: exact main skill among skill specialists.
    for skill in sorted({p["skill"] for p in finals if p["specialty"]=="スキル" and p["skill"]}):
        es=[]
        for p in finals:
            if p["specialty"]!="スキル" or p["skill"]!=skill: continue
            es.append({"species":p["name"],"score":round(skill_triggers(p,food_energy_map),4)})
        roles["skill"][skill]=add_percentiles(es)
    by_species={}
    for typ,groups in roles.items():
        for key,entries in groups.items():
            for e in entries:
                by_species.setdefault(e["species"],{}).setdefault(typ,[]).append({"role":key,**{k:v for k,v in e.items() if k!="species"}})
    try: commit=subprocess.check_output(["git","-C",str(a.upstream),"rev-parse","HEAD"],text=True).strip()
    except Exception: commit="unknown"
    data={"meta":{"version":"SRP-v0.1","evaluationLevel":LV,"baseline":"neutral/no subskills/no event","sleepHours":SLEEP_HOURS,"checkFreq":CHECK_FREQ,"source":"reimer0204/pokesle-simulator","upstreamCommit":commit,"definition":"同じ役割の最終進化種族間で標準化Lv30性能をpercentile化。個体PRとは別指標。"},"roles":roles,"bySpecies":by_species}
    a.output.write_text("window.SRP_DATA = "+json.dumps(data,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    print(f"SRP generated: {len(finals)} finals; berry {len(roles['berry'])}, food {len(roles['food'])}, skill {len(roles['skill'])}; commit {commit[:12]}")
if __name__=="__main__": main()
