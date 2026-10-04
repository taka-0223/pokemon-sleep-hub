#!/usr/bin/env python3
import json
from pathlib import Path

p=Path("data.js")
s=p.read_text(encoding="utf-8").strip()
prefix="window.APP_DATA="
assert s.startswith(prefix) and s.endswith(";")
d=json.loads(s[len(prefix):-1])

d["meta"].update({
  "revision":"2026-10-04-r13",
  "generatedAt":"2026-10-04",
  "source":"pokemon_sleep_decision_system_CURRENT_r13.xlsx",
  "appVersion":"0.8",
})

pr={
"IND-0020":("食材PR",[91.4,80.7,80.4],[96,91,91]),
"IND-0021":("食材PR",[80.6,61.1,58.0],[90,82,81]),
"IND-0022":("食材PR",[97.5,92.2,94.2],[98,96,97.7]),
"IND-0023":("食材PR",[64.3,58.4,56.7],[70,75,73]),
"IND-0024":("食材PR",[10.1,7.2,6.5],[12,9,9]),
"IND-0025":("食材PR",[15.1,33.3,32.3],[35,51,50]),
"IND-0026":("きのみPR",[82.4,91.1,92.7],[74.5,82.3,82.3]),
"IND-0027":("きのみPR",[96.7,85.6,87.5],[41.5,25.8,29.4]),
"IND-0028":("きのみPR",[89.3,80.4,80.0],[92,87,87]),
}
species_grade={
"IND-0001":"A","IND-0003":"S","IND-0006":"S","IND-0008":"S","IND-0010":"S",
"IND-0013":"S","IND-0015":"S","IND-0018":"S","IND-0020":"A+","IND-0021":"A+",
"IND-0022":"A+","IND-0023":"A",
}
for x in d["individuals"]:
    iid=x["id"]
    if iid in species_grade: x["speciesGrade"]=species_grade[iid]
    if iid not in pr: continue
    metric,total,role=pr[iid]
    x["primaryMetric"]=metric
    x["primaryPR"]=role[0]
    x["primaryEvalLv"]=30
    x["topPercent"]=round(100-role[0],1)
    x["measurements"]=[m for m in x.get("measurements",[]) if not (m.get("tool")=="ポケスリシミュ" and m.get("lv") in (30,50,60))]
    for i,lv in enumerate((30,50,60)):
        x["measurements"].append({"lv":lv,"metric":"総合PR","pr":total[i],"tool":"ポケスリシミュ"})
        x["measurements"].append({"lv":lv,"metric":metric,"pr":role[i],"tool":"ポケスリシミュ"})
    if "実測" not in (x.get("rationale") or ""):
        x["rationale"]=(x.get("rationale") or "").rstrip("。")+"。 実測%sはLv30/50/60=%s。"%(metric,"/".join(str(v).rstrip("0").rstrip(".") if isinstance(v,float) else str(v) for v in role))

candidate_map={
"ROLE-002":[("blastoise","カメックス","S")],
"ROLE-003":[("salamence","ボーマンダ","S"),("altaria","チルタリス","A")],
"ROLE-004":[("skeledirge","ラウドボーン","S")],
"ROLE-005":[("cetitan","ハルクジラ","S"),("meowscarada","マスカーニャ","S")],
"ROLE-006":[("ampharos","デンリュウ","S"),("espeon","エーフィ","S"),("sudowoodo","ウソッキー","A+"),("noivern","オンバーン","A+")],
"ROLE-008":[("absol","アブソル","S"),("clodsire","ドオー","S"),("blastoise","カメックス","A")],
"ROLE-010":[("magnezone","ジバコイル","S"),("glaceon","グレイシア","A+"),("flareon","ブースター","A+")],
"ROLE-011":[("aggron","ボスゴドラ","S"),("charizard","リザードン","S"),("bewear","キテルグマ","A+")],
"ROLE-014":[("tyranitar","バンギラス","S"),("kangaskhan","ガルーラ","A+"),("charizard","リザードン","A")],
"ROLE-015":[("blastoise","カメックス","S"),("meowscarada","マスカーニャ","A")],
"ROLE-016":[("venusaur","フシギバナ","S"),("pinsir","カイロス","A+"),("ribombee","アブリボン","A+")],
"ROLE-017":[("gourgeist_small","パンプジン(こだましゅ)","S"),("gourgeist_medium","パンプジン(ちゅうだましゅ)","A+"),("gourgeist_large","パンプジン(おおだましゅ)","A+"),("gourgeist_giga","パンプジン（ギガだましゅ）","A+")],
"ROLE-018":[("toxicroak","ドクロッグ","S"),("mawile","クチート","A+"),("cramorant","ウッウ","A+"),("ditto","メタモン","A")],
}
for r in d["roles"]:
    if r["id"] not in candidate_map: continue
    pref=r.get("upgradeTarget")
    r["targetCandidates"]=[{"speciesKey":k,"name":n,"grade":g,"preferred":k==pref} for k,n,g in candidate_map[r["id"]]]

# coverage aliases point to the same semantic roles but are serialized separately.
by_id={r["id"]:r for r in d["roles"]}
for group in d.get("coverage",{}).values():
    for i,r in enumerate(group):
        if r.get("id") in by_id: group[i]=by_id[r["id"]]

p.write_text(prefix+json.dumps(d,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
print("patched",d["meta"]["revision"],"PR",sum(x.get("primaryPR") is not None for x in d["individuals"]))
