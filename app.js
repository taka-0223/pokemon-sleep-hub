const D=window.APP_DATA||{individuals:[],roles:[],coverage:{},coverageMatrix:[],resources:{},events:[],meta:{}};
const SRP=window.SRP_DATA||{meta:{status:"pending",label:"Species Role Percentile"},bySpecies:{}};
const UPDATES=window.APP_UPDATES||[];
const SETTINGS_KEY="pokemon-sleep-hub.settings.v1";
const DEFAULT_SETTINGS={theme:"system",showCompletedRefine:true};
function loadSettings(){
  try{return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")};}
  catch(_){return {...DEFAULT_SETTINGS};}
}
let appSettings=loadSettings();
const systemDark=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
let darkMediaRules=[];
function captureDarkMediaRules(){
  if(darkMediaRules.length)return;
  for(const sheet of [...document.styleSheets]){
    try{
      for(const rule of [...sheet.cssRules]){
        if(typeof CSSMediaRule!=="undefined"&&rule instanceof CSSMediaRule&&rule.media.mediaText.includes("prefers-color-scheme: dark")){
          darkMediaRules.push(rule);
        }
      }
    }catch(_){}
  }
}
function updateThemeMeta(mode){
  const dark=mode==="dark"||(mode==="system"&&systemDark?.matches);
  const color=dark?"#1a2530":"#f5f6ee";
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>{
    if(mode==="system"){
      meta.content=meta.media?.includes("dark")?"#1a2530":"#f5f6ee";
    }else meta.content=color;
  });
}
function applyTheme(mode){
  captureDarkMediaRules();
  const normalized=["system","light","dark"].includes(mode)?mode:"system";
  for(const rule of darkMediaRules){
    rule.media.mediaText=normalized==="dark"?"all":normalized==="light"?"not all":"(prefers-color-scheme: dark)";
  }
  document.documentElement.dataset.theme=normalized;
  document.documentElement.style.colorScheme=normalized==="system"?"light dark":normalized;
  updateThemeMeta(normalized);
}
function saveSettings(){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(appSettings));
}
applyTheme(appSettings.theme);
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"—":s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const views=["home","roster","refine","roles","plan"];
const SCROLL_KEY="pokemon-sleep-hub.scroll.v1";
function loadScrollPositions(){
  try{return JSON.parse(sessionStorage.getItem(SCROLL_KEY)||"{}");}
  catch(_){return {};}
}
let scrollPositions=loadScrollPositions();
function saveScrollPositions(){
  try{sessionStorage.setItem(SCROLL_KEY,JSON.stringify(scrollPositions));}catch(_){}
}
const qualityOrder={"S":0,"A+":1,"A":2,"B":3,"C":4,"特殊":5};
let suppressClick=false;
const foodTarget={milk_specialist:"モーモーミルク",cacao_specialist:"リラックスカカオ",apple:"とくせんリンゴ",potato:"ほっこりポテト",ginger:"あったかジンジャー",honey:"あまいミツ",pumpkin:"ずっしりカボチャ",oil_specialist:"ピュアなオイル",corn:"ワカクサコーン",mushroom:"あじわいキノコ",meat:"マメミート",egg_specialist:"とくせんエッグ",leek_specialist:"ふといながねぎ",tomato_specialist:"あんみんトマト",herb_specialist:"げきからハーブ",soybean_specialist:"ワカクサ大豆",coffee_specialist:"めざましコーヒー",avocado_specialist:"つやつやアボカド"};
const individualById=Object.fromEntries(D.individuals.map(p=>[p.id,p]));
const roleById=Object.fromEntries(D.roles.map(r=>[r.id,r]));
const statusKind=s=>["充足","特殊充足"].includes(s)?"good":["育成待ち","充足予定","暫定充足","条件付き充足","候補運用","副産物のみ","将来解禁","非専任のみ","需要未確認"].includes(s)?"mid":["不足","未所持"].includes(s)?"bad":"unknown";
const statusClass=s=>"state-"+statusKind(s);
const roleClass=t=>t==="食材"?"role-food":t==="きのみ"?"role-berry":t==="スキル"?"role-skill":"role-other";
const normalizeName=s=>String(s||"").replaceAll("（","(").replaceAll("）",")");
$("#revision").textContent="data "+(D.meta.revision||"—")+" · app v"+(D.meta.appVersion||"—");

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
  const n=Number(x.comparatorCount||0),rank=Number(x.rank||0);
  if(!n||!rank)return "—";
  return rank+"位/"+n+"種";
}
const qualityClass={"S":"q-s","A+":"q-ap","A":"q-a","B":"q-b","C":"q-c","特殊":"q-special"};
function tierClass(q){return qualityClass[q]||"q-other";}
function qualityBadge(q){
  return '<span class="quality '+tierClass(q)+'">'+esc(q)+'</span>';
}
function tierText(q){
  return '<span class="tier-text '+tierClass(q)+'">'+esc(q||"—")+'</span>';
}
function displayName(p){
  const level=String(p.level??"");
  return String(p.name||"").replace(new RegExp("\\s+Lv\\s*"+level+"(?=\\s|（|\\(|$)","i"),"").trim();
}
const goldSubSkills=new Set(["きのみの数S","げんき回復ボーナス","ゆめのかけらボーナス","リサーチEXPボーナス","睡眠EXPボーナス","おてつだいボーナス","スキルレベルアップM"]);
const blueSubSkills=new Set(["スキル確率アップM","食材確率アップM","スキルレベルアップS","おてつだいスピードM","最大所持数アップL","最大所持数アップM"]);
function subSkillRarity(name){
  if(goldSubSkills.has(name))return "gold";
  if(blueSubSkills.has(name))return "blue";
  return "white";
}
function subSkillGrid(p){
  return '<div class="subskill-grid">'+p.subskills.map(s=>{
    const locked=Number(p.level||0)<Number(s.lv||0);
    return '<div class="subskill-slot subskill-'+subSkillRarity(s.name)+(locked?' locked':'')+'">'+
      (locked?'<span class="unlock-level">▣ Lv.'+esc(s.lv)+'</span>':'')+
      '<span class="subskill-name">'+esc(s.name)+'</span></div>';
  }).join("")+'</div>';
}

function foodGrid(p){
  const levels=[1,30,60];
  return '<div class="food-grid">'+(p.foods||[]).map((name,i)=>{
    if(!name)return '';
    const locked=Number(p.level||0)<levels[i];
    return '<div class="food-slot'+(locked?' locked':'')+'"><small>Lv.'+levels[i]+'</small><strong>'+esc(name)+'</strong></div>';
  }).join("")+'</div>';
}
function natureCard(p){
  const neutral=(p.natureUp==="なし"||!p.natureUp)&&(p.natureDown==="なし"||!p.natureDown);
  return '<div class="nature-card"><div class="nature-name"><small>せいかく</small><strong>'+esc(p.nature)+'</strong></div>'+
    '<div class="nature-effects">'+(neutral?'<span class="nature-neutral">補正なし</span>':
      '<span class="nature-up">↑ '+esc(p.natureUp)+'</span><span class="nature-down">↓ '+esc(p.natureDown)+'</span>')+'</div></div>';
}
const refinePriorityOrder={高:0,中:1,低:2};
const refineNeedOrder={不足:0,未所持:0,"副産物のみ":1,"暫定充足":2,"候補運用":2,"条件付き充足":3,"育成待ち":4,"充足予定":4,充足:5};
const refineSearchOrder={継続:0,"条件付き継続":1,未確認:2,停止:3};
function prioritySlug(p){return p==="高"?"high":p==="中"?"mid":"low";}
function refineState(r){
  if(r.search==="停止")return {label:"完了",className:"done",done:true};
  if(r.search==="継続")return {label:"厳選中",className:"active",done:false};
  if(r.search==="条件付き継続")return {label:"条件付き",className:"conditional",done:false};
  return {label:"未確認",className:"unknown",done:false};
}
function targetSpeciesLabel(r){
  if(!r.upgradeTarget)return "未設定";
  return r.upgradeTargetLabel||r.upgradeTargetName||String(r.upgradeTarget);
}
function candidateLabel(c){
  return c.displayLabel||c.name||String(c.speciesKey||"—");
}
function targetSpeciesHtml(r,done){
  const xs=Array.isArray(r.targetCandidates)?r.targetCandidates:[];
  if(!xs.length)return '<b>'+esc(targetSpeciesLabel(r))+'</b>';
  return '<div class="target-list">'+xs.map(c=>{
    const name=esc(candidateLabel(c)),grade=c.grade||"—";
    return c.preferred
      ? '<b>'+name+' '+tierText(grade)+'<small>'+(done?'採用':'本命')+'</small></b>'
      : '<span>'+name+' '+tierText(grade)+'</span>';
  }).join('<em>・</em>')+'</div>';
}

function roleHolder(r){
  const id=r.incumbent||r.backup;
  if(!id)return null;
  const p=individualById[id];
  if(!p)return null;
  return {p,kind:r.incumbent?"主担当":"暫定"};
}
function currentRoleHtml(r){
  const h=roleHolder(r);
  if(!h)return '<div class="path-node path-current is-empty"><small>現状</small><strong>未所持</strong><span>担当なし</span></div>';
  const p=h.p;
  const aligned=p.roleId===r.id;
  let meta=h.kind;
  if(aligned){
    meta+=' ・ 個体 <i class="path-quality '+tierClass(p.quality)+'">'+esc(p.quality||"—")+'</i>';
    if(p.primaryPR!=null)meta+=' ・ PR'+esc(p.primaryPR);
  }else{
    meta+=' ・ 兼任';
  }
  return '<button type="button" class="path-node path-current individual-link" data-individual-id="'+esc(p.id)+'"><small>現状</small><strong>'+esc(displayName(p))+' <em>Lv.'+esc(p.level)+'</em></strong><span>'+meta+'</span></button>';
}
function preferredCandidate(r){
  const xs=Array.isArray(r.targetCandidates)?r.targetCandidates:[];
  return xs.find(c=>c.preferred)||xs[0]||null;
}
function goalRoleHtml(r,done){
  if(done&&!r.upgradeTarget){
    return '<div class="path-node path-goal is-done"><small>更新目標</small><strong>更新不要</strong><span>現状維持</span></div>';
  }
  const c=preferredCandidate(r);
  if(c){
    return '<div class="path-node path-goal"><small>更新目標</small><strong>'+esc(candidateLabel(c))+' '+tierText(c.grade||"—")+'</strong><span>'+(c.preferred?'本命候補':'候補')+'</span></div>';
  }
  if(r.upgradeTarget){
    return '<div class="path-node path-goal"><small>更新目標</small><strong>'+esc(targetSpeciesLabel(r))+'</strong><span>候補</span></div>';
  }
  return '<div class="path-node path-goal is-empty"><small>更新目標</small><strong>未設定</strong><span>候補未設定</span></div>';
}
function alternativeCandidatesHtml(r){
  const xs=Array.isArray(r.targetCandidates)?r.targetCandidates:[];
  const primary=preferredCandidate(r);
  const alts=xs.filter(c=>c!==primary);
  if(!alts.length)return "";
  return '<div class="refine-target refine-alts"><span>他候補</span><div class="target-list">'+alts.map(c=>
    '<span>'+esc(candidateLabel(c))+' '+tierText(c.grade||"—")+'</span>'
  ).join('<em>・</em>')+'</div></div>';
}
function refiningRoles(){
  return [...D.roles].sort((a,b)=>
    (refineSearchOrder[a.search]??9)-(refineSearchOrder[b.search]??9)
    ||(refinePriorityOrder[a.priority]??9)-(refinePriorityOrder[b.priority]??9)
    ||(refineNeedOrder[a.need]??9)-(refineNeedOrder[b.need]??9)
    ||String(a.name||"").localeCompare(String(b.name||""),"ja")
  );
}
function denseRow(p){
  const prMain=p.primaryPR!=null
    ? '<div class="roster-pr"><small>'+esc(p.primaryMetric||"個体PR")+'</small><strong>'+esc(p.primaryPR)+'</strong>'+(p.topPercent!=null?'<span>上位'+esc(p.topPercent)+'%</span>':'')+'</div>'
    : '<div class="roster-pr is-empty"><small>個体PR</small><strong>—</strong><span>未測定</span></div>';
  return '<article class="dense-row roster-card '+roleClass(p.roleType)+'" data-id="'+esc(p.id)+'">'+
    '<div class="roster-primary"><div class="roster-name-line"><span class="poke-name">'+esc(displayName(p))+'</span><span class="roster-level">Lv.'+esc(p.level)+'</span></div>'+
      '<div class="roster-role">'+esc(p.roleName)+'</div></div>'+
    '<div class="roster-quality">'+qualityBadge(p.quality)+prMain+'</div>'+
    '<div class="roster-facts"><span>種族 '+tierText(p.speciesGrade)+'</span><span>SRP '+esc(srpText(p))+'</span></div>'+
    '<div class="roster-state '+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</div>'+
  '</article>';
}
function rolePersonPanel(label,id,r){
  const p=id&&individualById[id];
  if(!p)return "";
  const aligned=p.roleId===r.id;
  const relation=aligned?(p.quality?'個体 '+p.quality:'評価あり'):'兼任';
  const pr=aligned&&p.primaryPR!=null?' ・ PR'+p.primaryPR:'';
  return '<button type="button" class="role-person individual-link" data-individual-id="'+esc(p.id)+'"><small>'+esc(label)+'</small><strong>'+esc(displayName(p))+' <em>Lv.'+esc(p.level)+'</em></strong><span>'+esc(relation)+esc(pr)+'</span></button>';
}
function roleAssignmentCard(r){
  const people=[];
  if(r.incumbent)people.push(rolePersonPanel("主担当",r.incumbent,r));
  if(r.backup)people.push(rolePersonPanel(r.incumbent?"バックアップ":"暫定担当",r.backup,r));
  const assignment=people.length
    ? '<div class="role-people'+(people.length===1?' is-single':'')+'">'+people.join("")+'</div>'
    : '<div class="role-empty-state"><small>現在の担当</small><strong>担当なし</strong></div>';
  const note=r.note
    ? '<details class="role-note-disclosure"><summary>判断メモ</summary><p>'+esc(r.note)+'</p></details>'
    : '';
  return '<article class="role-assignment '+roleClass(r.type)+'">'+
    '<div class="role-assignment-head"><div class="compact-name">'+esc(r.name)+'</div>'+
      '<span class="compact-state '+statusClass(r.need)+'">'+esc(r.need)+'</span></div>'+
    assignment+note+
  '</article>';
}
function compactRole(r,refine){
  const inc=individualById[r.incumbent]&&individualById[r.incumbent].name;
  const back=individualById[r.backup]&&individualById[r.backup].name;
  const holder=inc?("主担当 "+inc):(!inc&&back?("暫定 "+back):"");
  if(refine){
    const rs=refineState(r);
    return '<article class="compact-row refine-row '+roleClass(r.type)+' is-'+rs.className+'">'+
      '<div class="compact-top"><div><div class="compact-name">'+esc(r.name)+'</div>'+
      '<div class="compact-meta">'+esc(r.type)+' ・ '+esc(r.need)+'</div></div>'+
      '<div class="refine-flags"><span class="refine-status status-'+rs.className+'">'+rs.label+'</span>'+
      (rs.done?'':'<span class="refine-priority priority-'+prioritySlug(r.priority)+'">優先度 '+esc(r.priority||"—")+'</span>')+'</div></div>'+
      '<div class="refine-path">'+currentRoleHtml(r)+'<span class="path-arrow" aria-hidden="true">→</span>'+goalRoleHtml(r,rs.done)+'</div>'+
      (rs.done?'':alternativeCandidatesHtml(r))+
      '<div class="compact-note">'+esc(r.note)+'</div></article>';
  }
  return '<article class="compact-row '+roleClass(r.type)+'"><div class="compact-top"><div><div class="compact-name">'+esc(r.name)+'</div>'+
    '<div class="compact-meta">'+esc(r.type)+(holder?' ・ '+esc(holder):'')+'</div></div>'+
    '<div class="compact-state '+statusClass(r.need)+'">'+esc(r.need)+'</div></div>'+
    '<div class="compact-note">'+esc(r.note)+'</div></article>';
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
  let list=refiningRoles();
  const showDone=!!appSettings.showCompletedRefine;
  if(!showDone)list=list.filter(r=>!refineState(r).done);
  const lead=$("#refineLead");
  if(lead)lead.textContent=showDone
    ?"厳選中を上に、完了済みを下に表示。現状→更新目標と候補種を確認できます。"
    :"厳選中・条件付きのみ表示中。現状→更新目標と候補種を確認できます。";
  $("#refineList").innerHTML=list.length?list.map(r=>compactRole(r,true)).join(""):'<div class="lede">表示対象の役割がありません。</div>';
  bindRows();
}
function renderRoles(){
  const need={不足:0,未所持:0,育成待ち:1,充足予定:2,暫定充足:3,候補運用:3,条件付き充足:4,充足:5,特殊充足:5};
  const order=["食材","きのみ","スキル"];
  $("#roleList").innerHTML=order.map(type=>{
    const list=D.roles.filter(r=>r.type===type).sort((a,b)=>(need[a.need]??9)-(need[b.need]??9)||String(a.name||"").localeCompare(String(b.name||""),"ja"));
    if(!list.length)return "";
    const filled=list.filter(r=>["充足","特殊充足"].includes(r.need)).length;
    return '<section class="role-domain"><div class="role-domain-head"><div><span class="eyebrow">CURRENT ASSIGNMENT</span><h3>'+esc(type)+'</h3></div><span>'+filled+'/'+list.length+' 充足</span></div>'+
      '<div class="role-domain-list">'+list.map(roleAssignmentCard).join("")+'</div></section>';
  }).join("");
  bindRows();
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
  const srpUnavailable=p.roleType==="食材"&&!foodTarget[p.roleKey]?"対象外（複合役割）":(SRP.meta?.status==="ready"?"比較対象なし":"未算出");
  const srpValue=srp?(srp.comparatorCount||0)>1?srp.rank+'/'+srp.comparatorCount:String(srp.comparatorCount||0):"—";
  const srpFoot=srp?((srp.comparatorCount||0)>1?'上位 '+srp.topPercent+'%': '比較対象 '+(srp.comparatorCount||0)+'種'):srpUnavailable;
  return '<section class="detail-hero">'+
    '<div class="detail-role">'+esc(p.roleName)+'</div>'+
    '<div class="detail-identity"><div><h2>'+esc(displayName(p))+'</h2><span class="detail-level">Lv.'+esc(p.level)+'</span></div>'+qualityBadge(p.quality)+'</div>'+
    '<div class="detail-tags"><span>種族 '+tierText(p.speciesGrade)+'</span><span>'+esc(p.foodPattern)+'</span><span class="'+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</span></div>'+
  '</section>'+
  '<div class="main-skill-card"><span class="main-skill-icon">✦</span><div><small>メインスキル</small><strong>'+esc(p.mainSkill||"未登録")+'</strong></div><span class="main-skill-lv">Lv.'+esc(p.mainSkillLv||"—")+'</span></div>'+
  '<div class="score-grid">'+
    '<div class="score-card"><div class="score-label">個体PR</div><strong>'+(p.primaryPR!=null?esc(p.primaryPR):"—")+'</strong><small>'+esc(p.primaryMetric||"未測定")+'</small><div class="score-foot">'+(p.primaryPR!=null?'上位 '+esc(p.topPercent)+'% ・ Lv.'+esc(p.primaryEvalLv):'未測定')+'</div></div>'+
    '<div class="score-card"><div class="score-label">SRP <span class="info-dot" tabindex="0" data-tip="同じ役割の種族を固定条件で比較した順位。個体PRとは別指標。">i</span></div><strong>'+esc(srpValue)+'</strong><small>役割内順位</small><div class="score-foot">'+esc(srpFoot)+'</div></div>'+
  '</div>'+
  '<section class="detail-section"><div class="detail-section-head"><span>食材</span></div>'+foodGrid(p)+'</section>'+
  '<section class="detail-section">'+natureCard(p)+'</section>'+
  '<section class="detail-section subskill-section"><div class="detail-section-head"><span>サブスキル</span></div>'+subSkillGrid(p)+'</section>'+
  '<section class="decision-card"><div class="decision-top"><div><small>この個体の方針</small><strong>'+esc(p.disposition||"未設定")+'</strong></div><span>'+esc(p.refinement||"—")+'</span></div><p>'+esc(p.rationale)+'</p></section>'+
  '<details class="history-disclosure"><summary>PR履歴 <span>'+measures.length+'件</span></summary><table class="measure-table"><thead><tr><th>Lv</th><th>指標</th><th>PR</th><th>換算</th></tr></thead><tbody>'+rows+'</tbody></table></details>';
}
function openIndividual(id){
  if(suppressClick)return;
  const p=individualById[id];
  if(!p)return;
  $("#detail").innerHTML=detail(p);
  $("#detailDialog").showModal();
}
function bindRows(){
  document.querySelectorAll(".dense-row[data-id]").forEach(el=>el.onclick=()=>openIndividual(el.dataset.id));
  document.querySelectorAll("[data-individual-id]").forEach(el=>el.onclick=e=>{e.stopPropagation();openIndividual(el.dataset.individualId);});
}

function renderUpdateHistory(){
  const root=$("#updateHistory");
  if(!root)return;
  root.innerHTML=UPDATES.length?UPDATES.map((u,i)=>
    '<details class="update-entry" '+(i===0?'open':'')+'><summary><div><strong>v'+esc(u.version)+'</strong><span>'+esc(u.title)+'</span></div><time>'+esc(u.date)+'</time></summary>'+
    '<ul>'+((u.items||[]).map(x=>'<li>'+esc(x)+'</li>').join(""))+'</ul></details>'
  ).join(""):'<div class="settings-empty">更新履歴はまだありません。</div>';
}
function renderAppInfo(){
  const info=[
    ["アプリ","v"+(D.meta.appVersion||"—")],
    ["データ",D.meta.revision||"—"],
    ["データ更新日",D.meta.generatedAt||"—"],
    ["手持ち",D.individuals.length+"体"],
    ["役割",D.roles.length+"件"],
    ["SRPデータ",(SRP.meta?.status==="ready"&&Object.keys(SRP.bySpecies||{}).length>0)?"利用可能":"未読込"],
    ["データ元",D.meta.source||"—"]
  ];
  $("#appInfo").innerHTML=info.map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>').join("");
}
function renderSettings(){
  $("#settingsVersion").textContent="app v"+(D.meta.appVersion||"—");
  $("#settingsDataRevision").textContent="data "+(D.meta.revision||"—");
  $("#themeMode").value=appSettings.theme;
  $("#showCompletedRefine").checked=!!appSettings.showCompletedRefine;
  $("#updateStatus").textContent="更新状況を確認できます。";
  $("#applyUpdate").hidden=true;
  renderUpdateHistory();
  renderAppInfo();
}
function openSettings(){
  renderSettings();
  $("#settingsDialog").showModal();
}
function parseRemoteData(text){
  const src=String(text||"").trim().replace(/^window\.APP_DATA=/,"").replace(/;$/,"");
  return JSON.parse(src);
}
async function checkForUpdates(){
  const status=$("#updateStatus"),apply=$("#applyUpdate"),check=$("#checkUpdate");
  status.textContent="更新を確認しています…";
  apply.hidden=true;
  check.disabled=true;
  try{
    const reg=await navigator.serviceWorker?.getRegistration?.();
    if(reg)await reg.update();
    const res=await fetch("./data.js?update-check="+Date.now(),{cache:"no-store"});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const remote=parseRemoteData(await res.text());
    const appChanged=String(remote.meta?.appVersion||"")!==String(D.meta.appVersion||"");
    const dataChanged=String(remote.meta?.revision||"")!==String(D.meta.revision||"");
    if(appChanged||dataChanged){
      const parts=[];
      if(appChanged)parts.push("app v"+remote.meta.appVersion);
      if(dataChanged)parts.push("data "+remote.meta.revision);
      status.textContent="更新があります： "+parts.join(" / ");
      apply.hidden=false;
    }else{
      status.textContent="最新です。 app v"+(D.meta.appVersion||"—")+" / data "+(D.meta.revision||"—");
    }
  }catch(e){
    status.textContent="更新確認に失敗しました。通信状態を確認してください。";
  }finally{
    check.disabled=false;
  }
}
async function applyLatestUpdate(){
  const status=$("#updateStatus");
  status.textContent="更新を適用しています…";
  try{
    if("caches" in window){
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith("pokemon-sleep-hub-")).map(k=>caches.delete(k)));
    }
    const reg=await navigator.serviceWorker?.getRegistration?.();
    if(reg)await reg.update();
  }catch(_){}
  const url=new URL(location.href);
  url.searchParams.set("_refresh",Date.now());
  location.replace(url.toString());
}
function reloadApp(){
  const url=new URL(location.href);
  url.searchParams.set("_reload",Date.now());
  location.replace(url.toString());
}
function rememberCurrentScroll(){
  const id=document.querySelector(".view.active")?.id;
  if(!id||!views.includes(id))return;
  scrollPositions[id]=Math.max(0,Math.round(window.scrollY||0));
  saveScrollPositions();
}
function restoreScroll(id){
  const y=Math.max(0,Number(scrollPositions[id]||0));
  requestAnimationFrame(()=>window.scrollTo({top:y,behavior:"auto"}));
}
function showView(id,push){
  if(!views.includes(id))return;
  const current=document.querySelector(".view.active")?.id;
  if(current&&current!==id)rememberCurrentScroll();
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===id));
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===id));
  if(id==="roster")renderRoster();
  if(id==="refine")renderRefine();
  if(id==="roles")renderRoles();
  if(id==="plan")renderPlan();
  if(push!==false)history.replaceState(null,"","#"+id);
  restoreScroll(id);
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showView(b.dataset.view,true));
$("#closeDialog").onclick=()=>$("#detailDialog").close();
$("#detailDialog").onclick=e=>{if(e.target===$("#detailDialog"))$("#detailDialog").close();};

$("#settingsButton").onclick=openSettings;
$("#closeSettings").onclick=()=>$("#settingsDialog").close();
$("#settingsDialog").onclick=e=>{if(e.target===$("#settingsDialog"))$("#settingsDialog").close();};
$("#themeMode").addEventListener("change",e=>{
  appSettings.theme=e.target.value;
  saveSettings();
  applyTheme(appSettings.theme);
});
$("#showCompletedRefine").addEventListener("change",e=>{
  appSettings.showCompletedRefine=e.target.checked;
  saveSettings();
  renderRefine();
});
$("#checkUpdate").onclick=checkForUpdates;
$("#applyUpdate").onclick=applyLatestUpdate;
$("#reloadApp").onclick=reloadApp;
if(systemDark?.addEventListener)systemDark.addEventListener("change",()=>{if(appSettings.theme==="system")updateThemeMeta("system");});
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
function syncCompactHeader(){
  document.body.classList.toggle("header-compact",window.scrollY>48);
}
window.addEventListener("scroll",syncCompactHeader,{passive:true});
syncCompactHeader();
renderHome();renderRefine();renderRoles();renderPlan();showView(location.hash.slice(1)||"home",false);
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));