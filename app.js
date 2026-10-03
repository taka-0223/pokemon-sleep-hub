const D=window.APP_DATA||{individuals:[],roles:[],coverage:{},coverageMatrix:[],resources:{},events:[],meta:{}};
const SRP=window.SRP_DATA||{meta:{status:"pending"},bySpecies:{}};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"—":s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const views=["home","roster","refine","roles","plan"];
const qualityOrder={"S":0,"A+":1,"A":2,"B":3,"C":4,"特殊":5};
const foodTarget={milk_specialist:"モーモーミルク",cacao_specialist:"リラックスカカオ",apple:"とくせんリンゴ",potato:"ほっこりポテト",ginger:"あったかジンジャー",honey:"あまいミツ",pumpkin:"ずっしりカボチャ",oil_specialist:"ピュアなオイル",corn:"ワカクサコーン",mushroom:"あじわいキノコ",meat:"マメミート",egg_specialist:"とくせんエッグ",leek_specialist:"ふといながねぎ",tomato_specialist:"あんみんトマト",herb_specialist:"げきからハーブ",soybean_specialist:"ワカクサ大豆",coffee_specialist:"めざましコーヒー",avocado_specialist:"つやつやアボカド"};
const individualById=Object.fromEntries(D.individuals.map(p=>[p.id,p]));
const roleById=Object.fromEntries(D.roles.map(r=>[r.id,r]));
const statusKind=s=>["充足","特殊充足"].includes(s)?"good":["育成待ち","充足予定","暫定充足","条件付き充足","候補運用","副産物のみ","将来解禁","非専任のみ","需要未確認"].includes(s)?"mid":["不足","未所持"].includes(s)?"bad":"unknown";
const statusClass=s=>"state-"+statusKind(s);
const normalizeName=s=>String(s||"").replaceAll("（","(").replaceAll("）",")");
$("#revision").textContent="rev "+(D.meta.revision||"—");

function srpFor(p){
  const s=SRP.bySpecies&&SRP.bySpecies[normalizeName(p.targetSpeciesName)];
  if(!s)return null;
  if(p.roleType==="きのみ")return s.berry||null;
  if(p.roleType==="スキル")return s.skill||null;
  if(p.roleType==="食材"){
    const f=foodTarget[p.roleKey];
    return f&&s.food?s.food[f]||null:null;
  }
  return null;
}
function srpText(p){
  const x=srpFor(p);
  if(!x)return "—";
  if((x.comparatorCount||0)<2)return "比較"+(x.comparatorCount||0)+"種";
  return "上位"+x.topPercent+"%";
}
function qualityBadge(q){
  return '<span class="quality '+esc(q)+'">'+esc(q)+'</span>';
}
function denseRow(p){
  return '<article class="dense-row" data-id="'+esc(p.id)+'">'+
    '<div class="poke-main"><div class="poke-name">'+esc(p.name)+' <span class="poke-meta">Lv'+esc(p.level)+'</span></div><div class="poke-meta">'+esc(p.roleName)+'</div></div>'+
    '<div class="species-cell"><span class="cell-label">種族</span><span class="cell-value">'+esc(p.speciesGrade||"—")+' <span class="srp-beta">'+esc(srpText(p))+'</span></span></div>'+
    '<div><span class="cell-label">個体</span><span class="cell-value">'+qualityBadge(p.quality)+(p.topPercent!=null?' <span class="top">上位'+esc(p.topPercent)+'%</span>':"")+'</span></div>'+
    '<div><span class="cell-label">役割</span><span class="cell-value '+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</span></div>'+
  '</article>';
}
function compactRole(r,refine){
  const inc=individualById[r.incumbent]&&individualById[r.incumbent].name;
  const back=individualById[r.backup]&&individualById[r.backup].name;
  let badges="";
  if(refine){
    badges='<div class="mini-badges"><span class="mini-badge">探索 '+esc(r.search)+'</span><span class="mini-badge">優先 '+esc(r.priority)+'</span>';
    if(r.upgradeTarget)badges+='<span class="mini-badge">候補 '+esc(r.upgradeTarget)+'</span>';
    badges+='</div>';
  }
  return '<article class="compact-row"><div class="compact-top"><div><div class="compact-name">'+esc(r.name)+'</div><div class="compact-meta">'+esc(r.type)+(inc?' ・ 主担当 '+esc(inc):(!inc&&back?' ・ 暫定 '+esc(back):""))+'</div></div><div class="compact-state '+statusClass(r.need)+'">'+esc(r.need)+'</div></div>'+badges+'<div class="compact-note">'+esc(r.note)+'</div></article>';
}
function coverageGroup(label,items){
  const state=x=>x.need||x.status||"未確認";
  const good=items.filter(x=>statusKind(state(x))==="good").length;
  let body="";
  items.forEach(r=>{
    const st=state(r);
    body+='<div class="coverage-item"><span class="coverage-dot dot-'+statusKind(st)+'"></span><span class="label">'+esc(r.name.replace(/供給枠|専任枠|・きのみ枠|枠/g,""))+'</span><span class="state">'+esc(st)+'</span></div>';
  });
  return '<section class="coverage-group"><div class="coverage-head"><b>'+esc(label)+'</b><span>'+good+'/'+items.length+' 充足</span></div><div class="coverage-grid">'+body+'</div></section>';
}
function renderHome(){
  const a=D.individuals,roles=D.roles;
  const measured=a.filter(x=>x.primaryPR!=null).length;
  const refining=roles.filter(r=>["継続","条件付き継続"].includes(r.search)).length;
  const kpis=[["手持ち",a.length],["A以上",a.filter(x=>["S","A+","A"].includes(x.quality)).length],["PR測定",measured+"/"+a.length],["厳選中",refining]];
  $("#kpis").innerHTML=kpis.map(x=>'<div class="kpi"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join("");
  const counts={}; roles.forEach(r=>counts[r.need]=(counts[r.need]||0)+1);
  const order={充足:0,育成待ち:1,充足予定:2,暫定充足:3,条件付き充足:4,不足:5};
  $("#statusSummary").innerHTML=Object.entries(counts).sort((a,b)=>(order[a[0]]??8)-(order[b[0]]??8)).map(x=>'<span class="status-pill '+statusClass(x[0])+'">'+esc(x[0])+' <b>'+x[1]+'</b></span>').join("");
  const matrix=D.coverageMatrix||[];const covFood=matrix.length?matrix.filter(x=>x.domain==="食材"):(D.coverage.food||[]);const covBerry=matrix.length?matrix.filter(x=>x.domain==="きのみ"):(D.coverage.berry||[]);const covSkill=matrix.length?matrix.filter(x=>x.domain==="スキル"):(D.coverage.skill||[]);$("#coverage").innerHTML=coverageGroup("食材",covFood)+coverageGroup("きのみ",covBerry)+coverageGroup("スキル",covSkill);
  const core=[...a].filter(p=>["S","A+"].includes(p.quality)||p.roleNeed==="充足").sort((x,y)=>(qualityOrder[x.quality]??9)-(qualityOrder[y.quality]??9)||(x.priority??99)-(y.priority??99)).slice(0,10);
  $("#coreRoster").innerHTML=core.map(denseRow).join("");
  bindRows();
}
function renderRoster(){
  const q=$("#search").value.trim().toLowerCase(),qu=$("#qualityFilter").value,t=$("#typeFilter").value;
  const list=[...D.individuals].filter(p=>(!q||(p.name+" "+p.roleName).toLowerCase().includes(q))&&(!qu||p.quality===qu)&&(!t||p.roleType===t)).sort((a,b)=>(qualityOrder[a.quality]??9)-(qualityOrder[b.quality]??9)||a.name.localeCompare(b.name,"ja"));
  $("#rosterList").innerHTML=list.length?list.map(denseRow).join(""):'<div class="lede">該当なし</div>';
  bindRows();
}
function renderRefine(){
  const pr={高:0,中:1,低:2};
  const list=D.roles.filter(r=>["継続","条件付き継続"].includes(r.search)||r.need==="不足").sort((a,b)=>(pr[a.priority]??9)-(pr[b.priority]??9));
  $("#refineList").innerHTML=list.map(r=>compactRole(r,true)).join("");
}
function renderRoles(){
  const typ={食材:0,きのみ:1,スキル:2};
  const need={不足:0,育成待ち:1,充足予定:2,暫定充足:3,条件付き充足:4,充足:5};
  const list=[...D.roles].sort((a,b)=>(typ[a.type]??9)-(typ[b.type]??9)||(need[a.need]??9)-(need[b.need]??9));
  $("#roleList").innerHTML=list.map(r=>compactRole(r,false)).join("");
}
function eventState(e){
  const now=Date.now(),s=Date.parse(e.start),end=Date.parse(e.end);
  if(now<s)return ["upcoming",Math.ceil((s-now)/86400000)+"日後"];
  if(now<=end)return ["active-event","開催中"];
  return ["","終了"];
}
function fmtDate(iso){
  const d=new Date(iso);
  return (d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}
function renderPlan(){
  const keys=[["dream_shard","ゆめのかけら"],["main_skill_seed","メインスキルのたね"],["mareep_candy","メリープ系"],["fuecoco_candy","ホゲータ系"],["squirtle_candy","ゼニガメ系"]];
  $("#resourceBar").innerHTML=keys.filter(x=>D.resources[x[0]]).map(x=>'<div class="resource"><small>'+x[1]+'</small><b>'+esc(D.resources[x[0]].value!=null?D.resources[x[0]].value:D.resources[x[0]].text)+'</b></div>').join("");
  $("#eventList").innerHTML=D.events.map(e=>{const st=eventState(e);return '<article class="event-card '+st[0]+'"><div class="event-state">'+st[1]+'</div><div class="event-name">'+esc(e.name)+'</div><div class="event-dates">'+fmtDate(e.start)+' → '+fmtDate(e.end)+'</div><div class="event-summary">'+esc(e.summary)+'</div><a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">公式を見る ↗</a></article>';}).join("");
  const list=[...D.individuals].filter(p=>p.disposition==="育成").sort((a,b)=>(a.priority??99)-(b.priority??99));
  $("#planList").innerHTML=list.map(denseRow).join("");
  bindRows();
}
function detail(p){
  const srp=srpFor(p);
  const measures=[...(p.measurements||[])].sort((a,b)=>(a.lv??999)-(b.lv??999)||String(a.metric).localeCompare(String(b.metric),"ja"));
  const rows=measures.length?measures.map(m=>'<tr><td>Lv'+esc(m.lv)+'</td><td>'+esc(m.metric)+'</td><td>'+esc(m.pr)+'</td><td>'+(typeof m.pr==="number"?'上位 '+(100-m.pr).toFixed(1)+'%':'—')+'</td></tr>').join(""):'<tr><td colspan="4">未測定</td></tr>';
  const srpHtml=srp?esc(srp.label)+'<br><span class="srp-beta">'+((srp.comparatorCount||0)>1?'上位 '+srp.topPercent+'% ('+srp.rank+'/'+srp.comparatorCount+')':'比較対象 '+(srp.comparatorCount||0)+'種')+'</span>':"未算出";
  return '<div class="eyebrow">'+esc(p.roleName)+'</div><h2 class="detail-title">'+esc(p.name)+' <span class="poke-meta">Lv'+esc(p.level)+'</span></h2>'+
  '<div class="mini-badges">'+qualityBadge(p.quality)+'<span class="mini-badge">種族 '+esc(p.speciesGrade||"—")+'</span><span class="mini-badge">'+esc(p.foodPattern)+'</span><span class="mini-badge '+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</span></div>'+
  '<div class="detail-grid" style="margin-top:10px"><div class="detail-box"><b>個体PR</b><p>'+(p.primaryPR!=null?esc(p.primaryMetric)+' PR'+p.primaryPR+'<br><span class="top">上位 '+p.topPercent+'%</span> / Lv'+p.primaryEvalLv:'未測定')+'</p></div><div class="detail-box"><b>種族SRP β</b><p>'+srpHtml+'</p></div></div>'+
  '<div class="detail-box" style="margin-top:8px"><b>食材</b><p>'+p.foods.map(esc).join(" → ")+'</p><b>性格</b><p>'+esc(p.nature)+'（↑'+esc(p.natureUp)+' / ↓'+esc(p.natureDown)+'）</p></div>'+
  '<div class="detail-box" style="margin-top:8px"><b>サブスキル</b><p>'+p.subskills.map(s=>"Lv"+s.lv+" "+esc(s.name)).join(" / ")+'</p></div>'+
  '<div class="detail-box" style="margin-top:8px"><b>意思決定</b><p>'+esc(p.rationale)+'</p></div>'+
  '<h3>PR履歴</h3><table class="measure-table"><thead><tr><th>Lv</th><th>指標</th><th>PR</th><th>換算</th></tr></thead><tbody>'+rows+'</tbody></table>'+
  '<p class="lede" style="margin-top:10px">SRP βはポケスリシミュの基礎パラメータを固定条件で役割内比較した独自指標。個体PRとは別物です。</p>';
}
function bindRows(){
  document.querySelectorAll(".dense-row[data-id]").forEach(el=>el.onclick=()=>{const p=individualById[el.dataset.id];if(!p)return;$("#detail").innerHTML=detail(p);$("#detailDialog").showModal();});
}
function showView(id,push){
  if(!views.includes(id))return;
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===id));
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===id));
  if(id==="roster")renderRoster();
  if(id==="refine")renderRefine();
  if(id==="roles")renderRoles();
  if(id==="plan")renderPlan();
  if(push!==false)history.replaceState(null,"","#"+id);
  window.scrollTo({top:0,behavior:"auto"});
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showView(b.dataset.view,true));
$("#closeDialog").onclick=()=>$("#detailDialog").close();
$("#detailDialog").onclick=e=>{if(e.target===$("#detailDialog"))$("#detailDialog").close();};
["search","qualityFilter","typeFilter"].forEach(id=>$("#"+id).addEventListener("input",renderRoster));
let touchX=null,touchY=null;
$("#swipeArea").addEventListener("touchstart",e=>{if($("#detailDialog").open)return;touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;},{passive:true});
$("#swipeArea").addEventListener("touchend",e=>{if(touchX==null)return;const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;touchX=null;if(Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.25)return;const cur=document.querySelector(".view.active")?.id||"home",i=views.indexOf(cur),next=dx<0?i+1:i-1;if(next>=0&&next<views.length)showView(views[next],true);},{passive:true});
document.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight"].includes(e.key))return;const cur=document.querySelector(".view.active")?.id||"home",i=views.indexOf(cur),next=e.key==="ArrowRight"?i+1:i-1;if(next>=0&&next<views.length)showView(views[next],true);});
renderHome();renderRefine();renderRoles();renderPlan();showView(location.hash.slice(1)||"home",false);
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));