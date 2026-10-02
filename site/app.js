const D=window.APP_DATA, SRP=window.SRP_DATA||{roles:{},bySpecies:{},meta:{}};
const $=s=>document.querySelector(s), esc=s=>String(s??"—").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
$("#revision").textContent=`rev ${D.meta.revision}`;
const qo={"S":0,"A+":1,"A":2,"B":3,"C":4,"特殊":5};
function nc(x){return `need-${String(x||"").replace(/\s/g,"")}`}
function roleOf(p){return D.roles.find(r=>r.id===p.roleId)||{}}
function speciesSrp(p){
  const s=SRP.bySpecies?.[p.targetSpeciesName]; if(!s) return [];
  if(p.roleType==="berry"||p.roleType==="きのみ") return (s.berry||[]).filter(x=>!p.targetBerry||x.role===p.targetBerry);
  if(p.roleType==="skill"||p.roleType==="スキル") return (s.skill||[]).filter(x=>!p.targetMainSkill||x.role===p.targetMainSkill);
  if(p.roleType==="food"||p.roleType==="食材"){
    const targets=roleOf(p).ingredientTargets||[]; const all=s.food||[];
    return targets.length?all.filter(x=>targets.includes(x.role)):all;
  }
  return [];
}
function srpText(p,compact=false){
  const list=speciesSrp(p); if(!list.length) return "SRP 未測定";
  const x=list[0]; if(x.cohortSize<2) return `${esc(x.role)} 比較1種`;
  return `${compact?"":"SRP "+x.percentile+" / "}${esc(x.role)} 上位 ${x.topPercent}%${list.length>1?` +${list.length-1}`:""}`;
}
function pokeCard(p){
  const pr=p.primaryPR!=null?`${esc(p.primaryMetric)} ${p.primaryPR}`:"PR 未測定";
  const top=p.topPercent!=null?`上位 ${p.topPercent}%`:"—";
  return `<article class="poke-card" data-id="${p.id}"><div class="card-top"><div><div class="name">${esc(p.name)} <span class="muted">Lv${p.level}</span></div><div class="meta">${esc(p.roleName)} / ${esc(p.foodPattern)}</div></div><span class="badge quality">${esc(p.quality)}</span></div><div class="badges"><span class="badge">${esc(p.roleType)}</span><span class="badge ${p.refinement==="継続"?"warn":""}">厳選 ${esc(p.refinement)}</span><span class="badge">${esc(p.disposition)}</span></div><div class="metric-row"><div class="metric"><small>種族 / 同役割</small><strong>${esc(p.speciesGrade??"未設定")}</strong><em>${srpText(p,true)}</em></div><div class="metric"><small>個体PR ${p.primaryPREvaluationLv?`/ Lv${p.primaryPREvaluationLv}`:""}</small><strong>${pr}</strong></div><div class="metric"><small>同種個体で</small><strong class="top-pct">${top}</strong></div></div></article>`;
}
function roleCard(r){let n=id=>D.individuals.find(x=>x.id===id)?.name||"—";return `<div class="role-card"><div class="role-title"><span>${esc(r.name)}</span><span class="${nc(r.need)}">${esc(r.need)}</span></div><div class="badges"><span class="badge">${esc(r.type)}</span><span class="badge">探索 ${esc(r.search)}</span><span class="badge">優先 ${esc(r.priority)}</span></div><div class="role-note">担当: ${esc(n(r.incumbent))}${r.backup?` / 控え: ${esc(n(r.backup))}`:""}<br>${esc(r.note)}</div></div>`}
function renderKPIs(){let a=D.individuals;$("#kpis").innerHTML=[["登録個体",a.length],["A以上",a.filter(x=>["S","A+","A"].includes(x.quality)).length],["PR測定済",a.filter(x=>x.primaryPR!=null).length],["不足ロール",D.roles.filter(r=>r.need==="不足").length]].map(([l,v])=>`<div class="kpi"><span>${l}</span><b>${v}</b></div>`).join("")}
function focusScore(p){const need={"不足":4,"育成待ち":3,"充足予定":2,"暫定充足":2,"充足":0}[p.roleNeed]??1;return need*100-Number(p.priority??99)}
function renderHome(){let f=[...D.individuals].filter(x=>x.disposition==="育成"||["不足","育成待ち","充足予定"].includes(x.roleNeed)).sort((a,b)=>focusScore(b)-focusScore(a)).slice(0,8);$("#focusList").innerHTML=f.map(pokeCard).join("");$("#gapList").innerHTML=D.roles.filter(r=>["不足","暫定充足","育成待ち","充足予定"].includes(r.need)).slice(0,10).map(roleCard).join("")}
function renderRoles(){$("#roleList").innerHTML=D.roles.map(roleCard).join("")}
function renderRoster(){let q=$("#search").value.trim().toLowerCase(),qu=$("#qualityFilter").value,t=$("#typeFilter").value,l=[...D.individuals].filter(p=>(!q||`${p.name} ${p.roleName}`.toLowerCase().includes(q))&&(!qu||p.quality===qu)&&(!t||p.roleType===t)).sort((a,b)=>(qo[a.quality]??9)-(qo[b.quality]??9)||a.name.localeCompare(b.name,"ja"));$("#rosterList").innerHTML=l.map(pokeCard).join("")||`<div class="muted">該当なし</div>`;bindCards()}
function fmtDate(s){const d=new Date(s);return new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",weekday:"short",hour:"numeric",minute:"2-digit"}).format(d)}
function renderPlan(){
  $("#eventList").innerHTML=(D.events||[]).map(e=>`<article class="event-card ${e.miniCandyBoost?"boost":""}"><div class="event-head"><div><span class="eyebrow">${esc(e.kind)}</span><h3>${esc(e.name)}</h3></div>${e.miniCandyBoost?'<span class="boost-pill">ミニアメ</span>':''}</div><div class="event-date">${fmtDate(e.start)} → ${fmtDate(e.end)}</div><p>${esc(e.summary)}</p><a href="${esc(e.source)}" target="_blank" rel="noopener">公式お知らせ ↗</a></article>`).join("");
  const items=(D.resourcePlan||[]).filter(x=>!x.channels.some(c=>c.includes("後回し（睡眠EXP中心）")));
  $("#planList").innerHTML=items.map(x=>`<article class="plan-card"><div class="card-top"><div><div class="name">${esc(x.name)} <span class="muted">Lv${x.level} → ${x.targetLevel}</span></div><div class="meta">${esc(x.roleName)}</div></div><span class="badge quality">${esc(x.quality)}</span></div><div class="badges">${x.channels.map(c=>`<span class="badge ${c.includes("優先")?"boost-badge":""}">${esc(c)}</span>`).join("")}</div><p>${esc(x.reason)}</p></article>`).join("")||'<div class="muted">現在、アメ投入候補はありません。</div>';
}
function detail(p){
  let ms=(p.measurements||[]).filter(m=>m.metric!=="総合PR").sort((a,b)=>(a.lv??999)-(b.lv??999)),rows=ms.length?ms.map(m=>`<tr><td>Lv${m.lv}</td><td>${esc(m.metric)}</td><td>${m.pr}</td><td class="top-pct">上位 ${(100-m.pr).toFixed(1)}%</td><td>${esc(m.tool)}</td></tr>`).join(""):`<tr><td colspan="5" class="muted">未測定</td></tr>`;
  const srps=speciesSrp(p); const srpRows=srps.length?srps.map(x=>`<tr><td>${esc(x.role)}</td><td>${x.percentile}</td><td>${x.cohortSize<2?"比較1種":`上位 ${x.topPercent}%`}</td><td>${x.rank}/${x.cohortSize}</td></tr>`).join(""):`<tr><td colspan="4" class="muted">未測定 / 比較対象なし</td></tr>`;
  return `<div class="eyebrow">${esc(p.roleName)}</div><h2>${esc(p.name)} <span class="muted">Lv${p.level}</span></h2><div class="badges"><span class="badge quality">${esc(p.quality)}</span><span class="badge">種族 ${esc(p.speciesGrade??"未設定")}</span><span class="badge">${esc(p.foodPattern)}</span></div><div class="detail-grid"><div class="detail-box"><b>個体PR</b><p>${p.primaryPR!=null?`${esc(p.primaryPRTool)} / Lv${p.primaryPREvaluationLv} / ${esc(p.primaryMetric)} ${p.primaryPR}<br><span class="top-pct">同種個体 上位 ${p.topPercent}%</span>`:"未測定"}</p></div><div class="detail-box"><b>Species Role Percentile</b><p>${srpText(p)}</p><small class="muted">Lv${SRP.meta?.evaluationLevel??30}・無補正の種族間比較</small></div><div class="detail-box"><b>役割状態</b><p>${esc(p.roleNeed)} / 厳選 ${esc(p.refinement)}</p></div><div class="detail-box"><b>次の目標</b><p>Lv${esc(p.targetLevel)} / ${esc(p.disposition)}</p></div></div><div class="detail-box block"><b>食材</b><p>${p.foods.map(esc).join(" → ")}</p><b>性格</b><p>${esc(p.nature)}（↑${esc(p.natureUp)} / ↓${esc(p.natureDown)}）</p></div><div class="detail-box block"><b>サブスキル</b><p>${p.subskills.map(s=>`Lv${s.lv} ${esc(s.name)}`).join(" / ")}</p></div><div class="detail-box block"><b>意思決定</b><p>${esc(p.rationale)}</p></div><h3>種族SRP</h3><table class="measure-table"><thead><tr><th>役割</th><th>SRP</th><th>位置</th><th>順位</th></tr></thead><tbody>${srpRows}</tbody></table><h3>個体PR履歴</h3><table class="measure-table"><thead><tr><th>評価Lv</th><th>指標</th><th>PR</th><th>換算</th><th>Tool</th></tr></thead><tbody>${rows}</tbody></table><p class="method-note">個体PRとSRPは別物です。個体PRは同種・同食材構成内、SRPは同役割の種族間比較です。SRP source commit: ${esc((SRP.meta?.upstreamCommit||"—").slice(0,12))}</p>`;
}
function bindCards(){document.querySelectorAll(".poke-card").forEach(e=>e.onclick=()=>{let p=D.individuals.find(x=>x.id===e.dataset.id);$("#detail").innerHTML=detail(p);$("#detailDialog").showModal()})}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.view").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.view).classList.add("active");if(b.dataset.view==="roster")renderRoster();if(b.dataset.view==="roles")renderRoles();if(b.dataset.view==="plan")renderPlan()});
$("#closeDialog").onclick=()=>$("#detailDialog").close();$("#detailDialog").onclick=e=>{if(e.target===$("#detailDialog"))$("#detailDialog").close()};["search","qualityFilter","typeFilter"].forEach(id=>$("#"+id).addEventListener("input",renderRoster));
renderKPIs();renderHome();renderRoles();renderRoster();renderPlan();bindCards();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error))}
