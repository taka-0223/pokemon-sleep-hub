#!/usr/bin/env python3
import json, math, re, sys, urllib.request
from pathlib import Path

BASE="https://raw.githubusercontent.com/reimer0204/pokesle-simulator/master/src/data/"
LEVEL=30
LV_FACTOR=1-(LEVEL-1)*0.002

def fetch(name):
    req=urllib.request.Request(BASE+name,headers={"User-Agent":"pokemon-sleep-hub-srp"})
    with urllib.request.urlopen(req,timeout=30) as r:
        return r.read().decode("utf-8")

def grab(pattern,line,default=None,flags=0):
    m=re.search(pattern,line,flags)
    return m.group(1) if m else default

def js_round(x):
    return math.floor(x+0.5)

pokemon_src=fetch("pokemon.ts")
food_src=fetch("food_and_cooking.ts")

foods={}
for line in food_src.splitlines():
    m=re.search(r"\{ name: '([^']+)',\s+energy:\s*([0-9]+)",line)
    if m: foods[m.group(1)]=int(m.group(2))

pokemon=[]
for line in pokemon_src.splitlines():
    if "{ name:" not in line or "specialty:" not in line: continue
    name=grab(r"name:\s*'([^']+)'",line)
    specialty=grab(r"specialty:\s*'([^']+)'",line)
    berry=grab(r"berry:\s*'([^']+)'",line)
    skill=grab(r"skill:\s*'([^']+)'",line)
    help_s=grab(r"help:\s*([0-9]+)",line)
    food_rate=grab(r"foodRate:\s*([0-9.]+)",line)
    skill_rate=grab(r"skillRate:\s*([0-9.]+)",line)
    kaihou=grab(r"kaihou:\s*(true|false)",line,"false")=="true"
    before_raw=grab(r"evolve:\s*\{before:\s*(null|'[^']+')",line,"null")
    before=None if before_raw=="null" else before_raw.strip("'")
    fm=grab(r"foodList:\s*\[([^\]]*)\]",line,"")
    food_list=re.findall(r"'([^']+)'",fm)
    if not all([name,specialty,berry,skill,help_s,food_rate,skill_rate]): continue
    pokemon.append({"name":name,"specialty":specialty,"berry":berry,"skill":skill,"help":int(help_s),
                    "foodRate":float(food_rate),"skillRate":float(skill_rate),"kaihou":kaihou,
                    "before":before,"foods":food_list})

has_child={p["before"] for p in pokemon if p["before"]}
finals=[p for p in pokemon if p["name"] not in has_child and not p["kaihou"]]

by_species={}
def slot(name):
    return by_species.setdefault(name,{"food":{}})

def assign_group(cands,kind,label_fn):
    cands=sorted(cands,key=lambda x:x["score"],reverse=True)
    n=len(cands)
    for i,c in enumerate(cands):
        rank=i+1
        entry={"rank":rank,"comparatorCount":n,"topPercent":round(rank/n*100,1) if n>1 else 100.0,
               "percentile":round((n-rank+1)/n*100,1),"score":round(c["score"],6),
               "level":LEVEL,"label":label_fn(c),"method":kind}
        yield c["name"],entry

# Berry specialists: same berry, neutral/no subskills, Lv30.
berry_groups={}
for p in finals:
    if p["specialty"]!="きのみ": continue
    speed=p["help"]*LV_FACTOR
    score=86400/speed*(1-p["foodRate"])*2
    berry_groups.setdefault(p["berry"],[]).append({"name":p["name"],"score":score,"berry":p["berry"]})
for berry,cands in berry_groups.items():
    for name,e in assign_group(cands,"berry_baseline_v1",lambda c:c["berry"]+"のみ・きのみ役"):
        slot(name)["berry"]=e

# Skill specialists: same main skill, pity-adjusted base trigger intensity.
skill_groups={}
for p in finals:
    if p["specialty"]!="スキル": continue
    speed=p["help"]*LV_FACTOR
    ceil_n=40*3600/p["help"]
    denom=1-(1-p["skillRate"])**ceil_n
    ceil_rate=p["skillRate"]/denom if denom else 0
    score=86400/speed*ceil_rate
    skill_groups.setdefault(p["skill"],[]).append({"name":p["name"],"score":score,"skill":p["skill"]})
for skill,cands in skill_groups.items():
    for name,e in assign_group(cands,"skill_trigger_baseline_v1",lambda c:c["skill"]+"役"):
        slot(name)["skill"]=e

# Ingredient specialists: target ingredient output at Lv30 using best available AA/AB pattern.
food_groups={k:[] for k in foods}
for p in finals:
    if p["specialty"]!="食材" or not p["foods"]: continue
    a=p["foods"][0]
    if a not in foods: continue
    first_energy=foods[a]*2
    speed=p["help"]*LV_FACTOR
    helps=86400/speed
    targets=[]
    targets.append((a,(js_round(first_energy/foods[a])+js_round(first_energy*2.25/foods[a]))/2))
    if len(p["foods"])>1 and p["foods"][1] in foods:
        b=p["foods"][1]
        targets.append((b,js_round(first_energy*2.25/foods[b])/2))
    for target,avg_num in targets:
        score=helps*p["foodRate"]*avg_num
        food_groups.setdefault(target,[]).append({"name":p["name"],"score":score,"food":target})
for food,cands in food_groups.items():
    if not cands: continue
    for name,e in assign_group(cands,"ingredient_output_baseline_v1",lambda c:c["food"]+"供給"):
        slot(name)["food"][food]=e

out={"meta":{"status":"ready","label":"Species Role Percentile β","level":LEVEL,
             "source":"reimer0204/pokesle-simulator","methodVersion":"srp-v1",
             "note":"Neutral nature, no subskills, no event bonuses. Role-specific species baseline; not individual PR."},
     "bySpecies":by_species}
target=Path(sys.argv[1] if len(sys.argv)>1 else "srp.js")
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text("window.SRP_DATA="+json.dumps(out,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
print("SRP species",len(by_species),"->",target)
