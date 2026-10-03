const D=window.APP_DATA||{individuals:[],roles:[],coverage:{},coverageMatrix:[],resources:{},events:[],meta:{}};
const SRP=window.SRP_DATA||{meta:{status:"pending"},bySpecies:{}};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"—":s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const views=["home","roster","refine","roles","plan"];
const qualityOrder={"S":0,"A+":1,"A":2,"B":3,"C":4,"特殊":5};
let suppressClick=false;
const captureFamily={
  gardevoir:"ラルトス系",xatu:"ネイティ系",feraligatr:"ワニノコ系",empoleon:"ポッチャマ系",
  dodrio:"ドードー系",typhlosion:"ヒノアラシ系",mewtwo:"ミュウツー",dedenne:"デデンネ",
  bewear:"ヌイコグマ系",gengar:"ゴース系",charizard:"ヒトカゲ系",blastoise:"ゼニガメ系",
  skeledirge:"ホゲータ系",meowscarada:"ニャオハ系",ampharos:"メリープ系",clodsire:"パルデアウパー系",
  tyranitar:"ヨーギラス系",ribombee:"アブリー系",gourgeist_giga:"バケッチャ系",ditto:"メタモン",magnezone:"コイル系"
};
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
function prioritySlug(p){return p==="高"?"high":p==="中"?"mid":"low";}
function capturePriority(r){
  if(r.search==="条件付き継続")return {label:"良個体なら",className:"conditional",rank:3};
  if(r.priority==="高")return {label:"最優先",className:"top",rank:0};
  if(r.priority==="中")return {label:"優先",className:"mid",rank:1};
  return {label:"余裕があれば",className:"low",rank:2};
}
const needUrgency={不足:0,未所持:0,"副産物のみ":1,"暫定充足":2,"候補運用":2,"条件付き充足":3,"育成待ち":4,"充足予定":4,充足:5};
const gapUrgency={大:0,中:1,小:2};
function captureTargetLabel(r){
  if(!r.upgradeTarget)return "候補種未設定";
  return captureFamily[String(r.upgradeTarget)]||r.upgradeTargetName||String(r.upgradeTarget);
}
function refiningRoles(){
  return [...D.roles]
    .filter(r=>["継続","条件付き継続"].includes(r.search)||r.need==="不足")
    .sort((a,b)=>{
      const pa=capturePriority(a).rank,pb=capturePriority(b).rank;
      if(pa!==pb)return pa-pb;
      const na=needUrgency[a.need]??9,nb=needUrgency[b.need]??9;
      if(na!==nb)return na-nb;
      const ga=gapUrgency[a.gap]??9,gb=gapUrgency[b.gap]??9;
      if(ga!==gb)return ga-gb;
      return String(a.name||"").localeCompare(String(b.name||""),"ja");
    });
}
function captureCard(r,index){
  const p=capturePriority(r),target=captureTargetLabel(r),missing=!r.upgradeTarget;
  const facts=[
    r.need?"状況 "+r.need:null,
    r.search?"探索 "+r.search:null,
    r.gap?"差 "+r.gap:null
  ].filter(Boolean).map(x=>'<span>'+esc(x)+'</span>').join("");
  return '<article class="capture-card tier-'+p.className+(missing?' target-missing':'')+'">'+
    '<div class="capture-rank">'+(index+1)+'</div>'+
    '<div class="capture-body"><div class="capture-name">'+esc(target)+'</div><div class="capture-role">'+esc(r.name)+'</div>'+
    '<div class="capture-facts">'+facts+'</div><div class="capture-note">'+esc(r.note||"")+'</div></div>'+
    '<span class="capture-tier tier-'+p.className+'">'+esc(p.label)+'</span></article>';
}

function denseRow(p){
  return '<article class="dense-row" data-id="'+esc(p.id)+'">'+
    '<div class="poke-main"><div class="poke-name">'+esc(p.name)+' <span class="poke-meta">Lv'+esc(p.level)+'</span></div><div class="poke-meta">'+esc(p.roleName)+'</div></div>'+
    '<div class="species-cell"><span class="cell-label">種族</span><span class="cell-value">'+esc(p.speciesGrade||"—")+' <span class="srp-beta">'+esc(srpText(p))+'</span></span></div>'+
    '<div><span class="cell-label">個体</span><span class="cell-value">'+qualityBadge(p.quality)+(p.topPercent!=null?' <span class="top">上位'+esc(p.topPercent)+'%</span>':"")+'</span></div>'+
    '<div><span class="cell-label">役割</span><span class="cell-value '+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</span></div>'+
  '</article>';
}
function compactRole(r,refine,rank){
  const inc=individualById[r.incumbent]&&individualById[r.incumbent].name;
  const back=individualById[r.backup]&&individualById[r.backup].name;
  let badges="";
  if(refine){
    badges='<div class="mini-badges"><span class="mini-badge">探索 '+esc(r.search)+'</span><span class="mini-badge priority-'+prioritySlug(r.priority)+'">優先 '+esc(r.priority)+'</span>';
    if(r.upgradeTarget)badges+='<span class="mini-badge">狙う '+esc(captureTargetLabel(r))+'</span>';
    else badges+='<span class="mini-badge target-unset">候補種 未設定</span>';
    badges+='</div>';
  }
  const rankHtml=refine&&rank?'<span class="order-num">'+rank+'</span>':'';
  return '<article class="compact-row"><div class="compact-top"><div><div class="compact-name">'+rankHtml+esc(r.name)+'</div><div class="compact-meta">'+esc(r.type)+(inc?' ・ 主担当 '+esc(inc):(!inc&&back?' ・ 暫定 '+esc(back):""))+'</div></div><div class="compact-state '+statusClass(r.need)+'">'+esc(r.need)+'</div></div>'+badges+'<div class="compact-note">'+esc(r.note)+'</div></article>';
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
  const list=refiningRoles();
  $("#captureList").innerHTML=list.length?list.map(captureCard).join(""):'<div class="lede">現在、優先して捕獲する対象はありません。</div>';
  $("#refineList").innerHTML=list.map((r,i)=>compactRole(r,true,i+1)).join("");
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
  document.querySelectorAll(".dense-row[data-id]").forEach(el=>el.onclick=()=>{if(suppressClick)return;const p=individualById[el.dataset.id];if(!p)return;$("#detail").innerHTML=detail(p);$("#detailDialog").showModal();});
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
const swipeArea=$("#swipeArea");
let swipeState=null;
function canStartSwipe(target){
  return !target.closest("input,select,button,a,dialog,.status-summary,.resource-bar");
}
function clearSwipe(){
  const s=swipeState;
  if(!s)return;
  [s.current,s.neighbor].filter(Boolean).forEach(el=>{
    el.classList.remove("swipe-current","swipe-neighbor","swipe-animating");
    el.style.removeProperty("--swipe-x");
  });
  swipeArea.classList.remove("is-swiping");
  swipeState=null;
}
function setSwipeNeighbor(s,dir){
  s.current.classList.add("swipe-current");
  const next=s.index+dir;
  if(next<0||next>=views.length){
    if(s.neighbor){
      s.neighbor.classList.remove("swipe-neighbor","swipe-animating");
      s.neighbor.style.removeProperty("--swipe-x");
    }
    s.neighbor=null;s.dir=dir;return;
  }
  if(s.dir===dir&&s.neighbor)return;
  if(s.neighbor){
    s.neighbor.classList.remove("swipe-neighbor","swipe-animating");
    s.neighbor.style.removeProperty("--swipe-x");
  }
  s.dir=dir;
  s.neighbor=document.getElementById(views[next]);
  s.neighbor.classList.add("swipe-neighbor");
}
function finishSwipe(e,cancelled){
  const s=swipeState;
  if(!s||e.pointerId!==s.pointerId)return;
  if(s.locked!=="horizontal"){
    clearSwipe();
    return;
  }
  const dx=(typeof e.clientX==="number"?e.clientX:s.lastX)-s.startX;
  const w=s.width||swipeArea.clientWidth;
  const commit=!cancelled&&!!s.neighbor&&(Math.abs(dx)>w*.22||Math.abs(s.velocity)>.55);
  s.current.classList.add("swipe-animating");
  if(s.neighbor)s.neighbor.classList.add("swipe-animating");
  if(commit){
    s.current.style.setProperty("--swipe-x",(-s.dir*w)+"px");
    s.neighbor.style.setProperty("--swipe-x","0px");
    const nextId=views[s.index+s.dir];
    setTimeout(()=>{showView(nextId,true);clearSwipe();},220);
  }else{
    s.current.style.setProperty("--swipe-x","0px");
    if(s.neighbor)s.neighbor.style.setProperty("--swipe-x",(s.dir*w)+"px");
    setTimeout(clearSwipe,220);
  }
  setTimeout(()=>{suppressClick=false;},360);
}
swipeArea.addEventListener("pointerdown",e=>{
  if($("#detailDialog").open||!canStartSwipe(e.target))return;
  const current=document.querySelector(".view.active");
  if(!current)return;
  swipeState={
    pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastTime:performance.now(),
    velocity:0,locked:null,current,index:views.indexOf(current.id),neighbor:null,dir:0,width:swipeArea.clientWidth
  };
});
swipeArea.addEventListener("pointermove",e=>{
  const s=swipeState;
  if(!s||e.pointerId!==s.pointerId)return;
  const dx=e.clientX-s.startX,dy=e.clientY-s.startY;
  if(s.locked===null){
    if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
    if(Math.abs(dy)>Math.abs(dx)){s.locked="vertical";return;}
    s.locked="horizontal";
    try{swipeArea.setPointerCapture(e.pointerId);}catch(_){}
  }
  if(s.locked!=="horizontal")return;
  const dir=dx<0?1:-1;
  setSwipeNeighbor(s,dir);
  const now=performance.now(),dt=Math.max(1,now-s.lastTime);
  s.velocity=(e.clientX-s.lastX)/dt;
  s.lastX=e.clientX;s.lastTime=now;
  const w=s.width||swipeArea.clientWidth;
  const x=s.neighbor?dx:dx*.22;
  s.current.style.setProperty("--swipe-x",x+"px");
  if(s.neighbor)s.neighbor.style.setProperty("--swipe-x",(x+dir*w)+"px");
  swipeArea.classList.add("is-swiping");
  if(Math.abs(dx)>10)suppressClick=true;
  e.preventDefault();
});
swipeArea.addEventListener("pointerup",e=>finishSwipe(e,false));
swipeArea.addEventListener("pointercancel",e=>finishSwipe(e,true));
document.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight"].includes(e.key))return;const cur=document.querySelector(".view.active")?.id||"home",i=views.indexOf(cur),next=e.key==="ArrowRight"?i+1:i-1;if(next>=0&&next<views.length)showView(views[next],true);});
renderHome();renderRefine();renderRoles();renderPlan();showView(location.hash.slice(1)||"home",false);
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));