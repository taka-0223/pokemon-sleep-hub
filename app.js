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
const speciesNameByKey=Object.fromEntries((D.speciesMaster||[]).map(p=>[p.key,p.name]));
const statusKind=s=>["充足","特殊充足"].includes(s)?"good":["育成待ち","充足予定","暫定充足","条件付き充足","候補運用","副産物のみ","将来解禁","非専任のみ","需要未確認"].includes(s)?"mid":["不足","未所持"].includes(s)?"bad":"unknown";
const statusClass=s=>"state-"+statusKind(s);
const roleClass=t=>t==="食材"?"role-food":t==="きのみ"?"role-berry":t==="スキル"?"role-skill":"role-other";
const normalizeName=s=>String(s||"").replaceAll("（","(").replaceAll("）",")");
$("#revision").textContent="CURRENT "+(D.meta.revision||"—")+" · 評価モデル "+(D.meta.modelVersion||"—");
const provenanceBar=$("#factsStatus");
if(provenanceBar){const pr=D.individuals.filter(p=>p.primaryPR!=null).length;
 provenanceBar.textContent="CURRENT "+D.meta.revision+"｜現役"+D.individuals.length+"体・PR測定"+pr+"体・RoleSlot "+D.roles.length+"件・Coverage "+(D.coverageMatrix||[]).length+"件。料理Phase 6は定性的な判断基準を採用し、供給量などの未測定値は未算出のままです。";
 provenanceBar.dataset.status=D.meta.revision==="2026-10-25-r36"?"current":"fallback";}

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
function qualityBadge(q){return '<span class="quality '+tierClass(q)+'">'+esc(q||"未評価")+'</span>';}
function tierText(q,status){const label=!q?"Tier未評価":status==="provisional"?"暫定"+q:q;return '<span class="tier-text '+tierClass(q)+(status==="provisional"?" tier-provisional":"")+'">'+esc(label)+'</span>';}
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
      ? '<b>'+name+' '+tierText(grade,c.status)+'<small>'+(done?'採用':'本命')+'</small></b>'
      : '<span>'+name+' '+tierText(grade,c.status)+'</span>';
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
    meta+=' ・ 個体 <i class="path-quality '+tierClass(p.quality)+'">'+esc(p.quality||"未評価")+'</i>';
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
    return '<div class="path-node path-goal"><small>更新目標</small><strong>'+esc(candidateLabel(c))+' '+tierText(c.grade,c.status)+'</strong><span>'+(c.preferred?'本命候補':'候補')+'</span></div>';
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
    '<span>'+esc(candidateLabel(c))+' '+tierText(c.grade,c.status)+'</span>'
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
    '<div class="roster-primary"><div class="roster-name-line"><span class="poke-name">'+esc(displayName(p))+(p.shiny===true?' <span class="shiny-marker" title="色違い">★</span>':'')+'</span><span class="roster-level">Lv.'+esc(p.level)+'</span></div>'+
      '<div class="roster-role">'+esc(p.roleName)+'</div></div>'+
    '<div class="roster-quality">'+qualityBadge(p.quality)+prMain+'</div>'+
    '<div class="roster-facts"><span>種族 '+tierText(p.speciesGrade,p.speciesStatus)+'</span><span>SRP '+esc(srpText(p))+'</span></div>'+
    '<div class="roster-state '+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</div>'+
  '</article>';
}
function rolePersonPanel(label,id,r){
  const p=id&&individualById[id];
  if(!p)return "";
  const aligned=p.roleId===r.id;
  const relation=aligned?(p.quality?'個体 '+p.quality:'個体評価未確定'):'兼任';
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
  const hasModelGap=/MODEL_GAP/.test(String(r.investmentGate||"")+" "+String(r.cookingDemand||"")+" "+String(r.note||""));
  const note='<details class="role-note-disclosure"><summary>判断根拠・料理需要・投資条件</summary>'+
    '<p>'+esc(r.note||"")+'</p><p><b>料理需要：</b>'+esc(r.cookingDemand||"対象外")+'</p><p><b>投資条件：</b>'+esc(r.investmentGate||"未設定")+'</p></details>';
  return '<article class="role-assignment '+roleClass(r.type)+'">'+
    '<div class="role-assignment-head"><div class="compact-name">'+esc(r.name)+'</div>'+
      '<div class="role-head-badges">'+(hasModelGap?'<span class="model-gap-chip">MODEL_GAP</span>':'')+
      '<span class="compact-state '+statusClass(r.need)+'">'+esc(r.need)+'</span></div></div>'+
    assignment+note+
  '</article>';
}
function confidenceLabel(x){return x==="high"?"高":x==="medium"?"中":x==="low"?"低":"—";}
function renderSpeciesAssessments(){
  const root=$("#speciesTierList"),count=$("#speciesTierCount");
  if(!root)return;
  const list=[...(D.speciesAssessments||[])].sort((a,b)=>
    String(a.roleName||"").localeCompare(String(b.roleName||""),"ja")||
    String(speciesNameByKey[a.speciesKey]||a.speciesKey||"").localeCompare(String(speciesNameByKey[b.speciesKey]||b.speciesKey||""),"ja")
  );
  if(count)count.textContent=list.length+"件";
  root.innerHTML=list.map(a=>
    '<article class="species-tier-row">'+
      '<div class="species-tier-name"><strong>'+esc(speciesNameByKey[a.speciesKey]||a.speciesKey)+'</strong><span>'+esc(a.roleName||a.roleKey)+'</span></div>'+
      '<div class="species-tier-meta">'+tierText(a.grade,a.status)+'<small>信頼 '+esc(confidenceLabel(a.confidence))+'</small></div>'+
    '</article>'
  ).join("");
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
function homeRolePerson(r){
  const id=r.incumbent||r.backup;
  const p=id&&individualById[id];
  if(!p)return "担当なし";
  return displayName(p)+(r.incumbent?"":"（暫定）");
}
function homeAttentionRow(r){
  return '<button type="button" class="home-row home-role-row" data-home-view="roles">'+
    '<div class="home-row-main"><strong>'+esc(r.name)+'</strong><span>'+esc(r.type)+' ・ '+esc(homeRolePerson(r))+'</span></div>'+
    '<span class="home-state '+statusClass(r.need)+'">'+esc(r.need)+'</span>'+
  '</button>';
}
function homeRefineRow(r){
  const target=targetSpeciesLabel(r);
  return '<button type="button" class="home-row home-refine-row" data-home-view="refine">'+
    '<div class="home-row-main"><strong>'+esc(r.name)+'</strong><span>'+esc(homeRolePerson(r))+' → '+esc(target)+'</span></div>'+
    '<span class="home-priority priority-'+prioritySlug(r.priority)+'">'+esc(r.priority||"—")+'</span>'+
  '</button>';
}
function homeTrainingRow(p){
  const target=p.targetLevel!=null?'Lv.'+esc(p.targetLevel):'継続育成';
  return '<button type="button" class="home-row home-training-row individual-link" data-individual-id="'+esc(p.id)+'">'+
    '<div class="home-train-grade">'+qualityBadge(p.quality)+'</div>'+
    '<div class="home-row-main"><strong>'+esc(displayName(p))+' <em>Lv.'+esc(p.level)+'</em></strong><span>'+esc(p.roleName)+'</span></div>'+
    '<span class="home-train-target">→ '+target+'</span>'+
  '</button>';
}
function bindHomeActions(){
  document.querySelectorAll("[data-home-view]").forEach(el=>el.onclick=()=>showView(el.dataset.homeView,true));
}
function renderHome(){
  const a=D.individuals,roles=D.roles;
  const measured=a.filter(x=>x.primaryPR!=null).length;
  const refining=roles.filter(r=>["継続","条件付き継続"].includes(r.search));
  const highRefining=refining.filter(r=>r.priority==="高");
  const missing=roles.filter(r=>["不足","未所持"].includes(r.need));
  const trainingWait=roles.filter(r=>r.need==="育成待ち");
  const training=a.filter(p=>p.disposition==="育成").sort((x,y)=>(x.priority??99)-(y.priority??99));

  const pulse=[
    ["不足",missing.length,"danger"],
    ["高優先厳選",highRefining.length,"focus"],
    ["育成待ち",trainingWait.length,"mid"],
    ["育成中",training.length,"good"]
  ];
  $("#homePulse").innerHTML=pulse.map(x=>'<div class="home-pulse-card is-'+x[2]+'"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join("");

  const needOrder={不足:0,未所持:0,育成待ち:1,候補運用:2,暫定充足:3,条件付き充足:4,"副産物のみ":5};
  const priorityOrder={高:0,中:1,低:2};
  const attention=roles
    .filter(r=>Object.prototype.hasOwnProperty.call(needOrder,r.need))
    .sort((x,y)=>(priorityOrder[x.priority]??9)-(priorityOrder[y.priority]??9)||(needOrder[x.need]??9)-(needOrder[y.need]??9)||String(x.name||"").localeCompare(String(y.name||""),"ja"))
    .slice(0,4);
  $("#homeAttention").innerHTML=attention.length?attention.map(homeAttentionRow).join(""):'<div class="home-empty">要注意の役割はありません。</div>';

  const highList=[...highRefining]
    .sort((x,y)=>(needOrder[x.need]??9)-(needOrder[y.need]??9)||String(x.name||"").localeCompare(String(y.name||""),"ja"))
    .slice(0,4);
  $("#homeRefine").innerHTML=highList.length?highList.map(homeRefineRow).join(""):'<div class="home-empty">高優先の厳選はありません。</div>';

  $("#homeTraining").innerHTML=training.length?training.slice(0,4).map(homeTrainingRow).join(""):'<div class="home-empty">育成中の個体はありません。</div>';

  const highQuality=a.filter(x=>["S","A+","A"].includes(x.quality)).length;
  const filled=roles.filter(r=>["充足","特殊充足"].includes(r.need)).length;
  const summary=[
    ["手持ち",a.length+"体"],
    ["A以上",highQuality+"体"],
    ["PR測定",measured+"/"+a.length],
    ["充足",filled+"/"+roles.length]
  ];
  $("#homeSummary").innerHTML=
    '<div class="home-summary-grid">'+summary.map(x=>'<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join("")+'</div>'+
    '<div class="home-data-line"><span>手持ち '+esc(D.meta.currentFactsRevision||D.meta.revision||"—")+'</span>'+
    (D.meta.currentDecisionRevision?'<span>直近方針 '+esc(D.meta.currentDecisionCount)+'体・'+esc(D.meta.currentDecisionRevision)+'</span>':'')+
    '<span>評価 '+esc(D.meta.revision||"—")+'</span></div>';

  bindHomeActions();
  bindRows();
}
function renderRoster(){
  const q=$("#search").value.trim().toLowerCase(),qu=$("#qualityFilter").value,t=$("#typeFilter").value;
  const list=[...D.individuals].filter(p=>(!q||(p.name+" "+p.roleName).toLowerCase().includes(q))&&(!qu||p.quality===qu)&&(!t||p.roleType===t)).sort((a,b)=>(qualityOrder[a.quality]??9)-(qualityOrder[b.quality]??9)||a.name.localeCompare(b.name,"ja"));
  $("#rosterList").innerHTML=list.length?list.map(denseRow).join(""):'<div class="lede">該当なし</div>';
  bindRows();
}
function renderRefine(){let list=refiningRoles();const showDone=!!appSettings.showCompletedRefine;if(!showDone)list=list.filter(r=>!refineState(r).done);
 const lead=$("#refineLead");if(lead)lead.textContent=showDone?"現行CURRENTの厳選対象を上位に表示。種族Tierは役割別評価で、暫定と未評価を区別します。":"厳選中・条件付きの役割を表示。料理需要と資源投資の許可は別判断です。";
 $("#refineList").innerHTML=list.length?list.map(r=>compactRole(r,true)).join(""):'<div class="lede">表示対象の役割がありません。</div>';bindRows();}
function renderRoles(){
  const need={不足:0,未所持:0,育成待ち:1,充足予定:2,暫定充足:3,候補運用:3,条件付き充足:4,充足:5,特殊充足:5};
  const order=["食材","きのみ","スキル"];
  const roleDataLabel="CURRENT "+esc(D.meta.revision)+"：役割担当・種族候補";
  $("#roleList").innerHTML=order.map(type=>{
    const list=D.roles.filter(r=>r.type===type).sort((a,b)=>(need[a.need]??9)-(need[b.need]??9)||String(a.name||"").localeCompare(String(b.name||""),"ja"));
    if(!list.length)return "";
    const filled=list.filter(r=>["充足","特殊充足"].includes(r.need)).length;
    return '<section class="role-domain"><div class="role-domain-head"><div><span class="eyebrow">'+roleDataLabel+'</span><h3>'+esc(type)+'</h3></div><span>'+filled+'/'+list.length+' 充足</span></div>'+
      '<div class="role-domain-list">'+list.map(roleAssignmentCard).join("")+'</div></section>';
  }).join("");
  const cv=$("#coverageList");if(cv){const types=["食材","きのみ","スキル"];cv.innerHTML=types.map(type=>{
   const entries=(D.coverageMatrix||[]).filter(x=>x.domain===type);if(!entries.length)return "";
   return '<section class="coverage-r36"><h3>'+esc(type)+' Coverage <small>'+entries.length+'項目</small></h3><div class="coverage-r36-list">'+entries.map(c=>'<article><strong>'+esc(c.name)+'</strong><span>'+esc(c.status)+'</span>'+
    (c.phase6FoodClass?'<small>料理 '+esc(c.phase6FoodClass)+'（暫定）</small>':'')+'</article>').join("")+'</div></section>';}).join("");}
  renderSpeciesAssessments();
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
  const keys=[["dream_shard","ゆめのかけら"],["mareep_candy","メリープ系"],["fuecoco_candy","ホゲータ系"],["squirtle_candy","ゼニガメ系"]];
  $("#resourceBar").innerHTML=keys.filter(x=>D.resources[x[0]]).map(x=>'<div class="resource"><small>'+x[1]+'</small><b>'+esc(D.resources[x[0]].value!=null?D.resources[x[0]].value:D.resources[x[0]].text)+'</b></div>').join("");
  if(window.SeedInvestmentUI)window.SeedInvestmentUI.renderPlan();
  $("#eventList").innerHTML=D.events.map(e=>{const st=eventState(e);return '<article class="event-card '+st[0]+'"><div class="event-state">'+st[1]+'</div><div class="event-name">'+esc(e.name)+'</div><div class="event-dates">'+fmtDate(e.start)+' → '+fmtDate(e.end)+'</div><div class="event-summary">'+esc(e.summary)+'</div><a class="event-link" href="'+esc(e.url)+'" target="_blank" rel="noopener">公式を見る ↗</a></article>';}).join("");
  const list=[...D.individuals].filter(p=>p.disposition==="育成").sort((a,b)=>(a.priority??99)-(b.priority??99));
  $("#planList").innerHTML=list.map(denseRow).join("");
  bindRows();
}
function resourceGateHtml(p){
 const g=p.resourceGate||{};
 const rows=[
  ["専用アメ",g.dedicatedCandy],
  ["万能アメ",g.universalCandy],
  ["金種の検討上限",g.mainSeedCap],
  ["銀種",g.silverSeedPolicy]
 ].filter(x=>x[1]!==undefined&&x[1]!==null&&x[1]!=="");
 if(!rows.length)return "";
 return '<details class="resource-gate-disclosure"><summary>資源投資ゲート</summary><dl>'+rows.map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>').join("")+'</dl><p class="detail-provenance">金種の検討上限は従来の制限値で、使用推奨・必要個数・投入承認ではありません。金種専用の三層評価は別欄で確認します。</p></details>';
}
function detail(p){const decisionLabel="CURRENT "+esc(D.meta.revision)+(p.currentDecisionStatus==="provisional"?"・暫定":"・個体方針");
 const provenance="方針：CURRENT "+esc(D.meta.revision)+"（審査日 "+esc(p.currentDecisionDate||"未登録")+"）。種族Tierは役割別。PR未測定は0点を意味しません。";
 const srp=srpFor(p),measures=[...(p.measurements||[])].sort((a,b)=>(a.lv??999)-(b.lv??999)||String(a.metric).localeCompare(String(b.metric),"ja"));
 const rows=measures.length?measures.map(m=>'<tr><td>Lv'+esc(m.lv)+'</td><td>'+esc(m.metric)+'</td><td>'+esc(m.pr)+'</td><td>上位 '+(100-Number(m.pr)).toFixed(1)+'%</td></tr>').join(""):'<tr><td colspan="4">未測定</td></tr>';
 const srpUnavailable=p.roleType==="食材"&&!foodTarget[p.roleKey]?"対象外（複合役割）":(SRP.meta?.status==="ready"?"比較対象なし":"未算出");
 const srpValue=srp?(srp.comparatorCount||0)>1?srp.rank+"/"+srp.comparatorCount:String(srp.comparatorCount||0):"—";
 const srpFoot=srp?((srp.comparatorCount||0)>1?"上位 "+srp.topPercent+"%":"比較対象 "+(srp.comparatorCount||0)+"種"):srpUnavailable;
 return '<section class="detail-hero"><div class="detail-role">'+esc(p.roleName)+'</div><div class="detail-identity"><div><h2>'+esc(displayName(p))+'</h2><span class="detail-level">Lv.'+esc(p.level)+'</span></div>'+qualityBadge(p.quality)+'</div>'+
  '<div class="detail-tags"><span>種族 '+tierText(p.speciesGrade,p.speciesStatus)+'</span><span>'+esc(p.foodPattern)+'</span><span class="'+statusClass(p.roleNeed)+'">'+esc(p.roleNeed)+'</span>'+(p.shiny===true?'<span class="shiny-marker">★ 色違い</span>':'')+'</div><p class="detail-provenance">'+provenance+'</p></section>'+
 '<div class="main-skill-card"><span class="main-skill-icon">✦</span><div><small>メインスキル</small><strong>'+esc(p.mainSkill||"未登録")+'</strong></div><span class="main-skill-lv">Lv.'+esc(p.mainSkillLv||"—")+'</span></div>'+
 '<div class="score-grid"><div class="score-card"><div class="score-label">個体PR</div><strong>'+(p.primaryPR!=null?esc(p.primaryPR):"未測定")+'</strong><small>'+esc(p.primaryMetric||"役割未割当")+'</small><div class="score-foot">'+(p.primaryPR!=null?'上位 '+esc(p.topPercent)+'% ・ Lv.'+esc(p.primaryEvalLv):'PR未測定≠0')+'</div></div>'+
 '<div class="score-card"><div class="score-label">SRP <span class="info-dot" tabindex="0" data-tip="同じ役割の種族を固定条件で比較した順位。個体PRとは別指標。">i</span></div><strong>'+esc(srpValue)+'</strong><small>役割内順位</small><div class="score-foot">'+esc(srpFoot)+'</div></div></div>'+
 '<section class="detail-section"><div class="detail-section-head"><span>食材</span></div>'+foodGrid(p)+'</section><section class="detail-section">'+natureCard(p)+'</section><section class="detail-section subskill-section"><div class="detail-section-head"><span>サブスキル</span></div>'+subSkillGrid(p)+'</section>'+
 '<section class="decision-card"><div class="decision-top"><div><small>この個体の方針（'+decisionLabel+'）</small><strong>'+esc(p.disposition||"未設定")+'</strong></div><span>'+esc(p.refinement||"未設定")+'</span></div><p>'+esc(p.rationale||p.modelReviewReason)+'</p>'+
 '<dl class="r36-decision-grid"><div><dt>役割適性</dt><dd>'+esc(p.roleFit||"未評価")+'</dd></div><div><dt>料理貢献</dt><dd>'+esc(p.cookingContribution||"未算出")+'</dd></div><div><dt>投資の検討順</dt><dd>'+esc(p.investmentWindow||"未設定")+'</dd></div><div><dt>次の確認・行動</dt><dd>'+esc(p.resourceNextStep||"未設定")+'</dd></div></dl>'+resourceGateHtml(p)+'</section>'+
 (window.SeedInvestmentUI?window.SeedInvestmentUI.individualHtml(p.id):'<p class="detail-provenance" role="alert">金種評価モデルは未読込のため未評価です。</p>')+
 '<details class="history-disclosure"><summary>PR履歴 <span>'+measures.length+'件</span></summary><table class="measure-table"><thead><tr><th>Lv</th><th>指標</th><th>PR</th><th>換算</th></tr></thead><tbody>'+rows+'</tbody></table></details>';}
function openIndividual(id){
  if(suppressClick)return;
  const p=individualById[id];
  if(!p)return;
  $("#detail").innerHTML=detail(p);
  const gateButton=$("#gateFromIndividual");
  if(gateButton)gateButton.dataset.individualId=id;
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
function renderAppInfo(){const info=[["アプリ","v"+(D.meta.appVersion||"—")],["評価・個体・役割・料理判断",D.meta.revision||"—"],["現役個体",D.individuals.length+"体"],["正式PR測定",D.individuals.filter(x=>x.primaryPR!=null).length+"体"],["RoleSlot",D.roles.length+"件"],["Coverage",(D.coverageMatrix||[]).length+"件"],["種族役割評価",(D.speciesAssessments||[]).length+"件"],["料理Phase 6","定性判断採用・定量値未算出"],["SRPデータ",(SRP.meta?.status==="ready"&&Object.keys(SRP.bySpecies||{}).length>0)?"利用可能":"未読込"],["元ファイル",D.meta.source||"—"]];$("#appInfo").innerHTML=info.map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>').join("");}
function renderSettings(){$("#settingsVersion").textContent="app v"+(D.meta.appVersion||"—");$("#settingsDataRevision").textContent="全評価 CURRENT "+(D.meta.revision||"—")+" ／ Tier・役割・個体方針・料理判断";$("#themeMode").value=appSettings.theme;$("#showCompletedRefine").checked=!!appSettings.showCompletedRefine;$("#updateStatus").textContent="更新状況を確認できます。";$("#applyUpdate").hidden=true;renderUpdateHistory();renderAppInfo();}
function openSettings(){
  renderSettings();
  $("#settingsDialog").showModal();
}
function parseRemoteData(text){
  const src=String(text||"").trim().replace(/^window\.APP_DATA=/,"").replace(/;$/,"");
  return JSON.parse(src);
}
async function checkForUpdates(){const status=$("#updateStatus"),apply=$("#applyUpdate"),check=$("#checkUpdate");status.textContent="更新を確認しています…";apply.hidden=true;check.disabled=true;try{const reg=await navigator.serviceWorker?.getRegistration?.();if(reg)await reg.update();const res=await fetch("./data.js?update-check="+Date.now(),{cache:"no-store"});if(!res.ok)throw Error("HTTP "+res.status);const latest=parseRemoteData(await res.text());if(latest.meta?.revision!==D.meta.revision||latest.meta?.appVersion!==D.meta.appVersion){status.textContent="更新があります：CURRENT "+latest.meta?.revision+" / app v"+latest.meta?.appVersion;apply.hidden=false;}else status.textContent="最新です。CURRENT "+D.meta.revision+" / app v"+D.meta.appVersion;}catch(e){status.textContent="更新確認に失敗しました。通信状態を確認してください。";}finally{check.disabled=false;}}
async function applyLatestUpdate(){
  const status=$("#updateStatus");
  status.textContent="更新を適用しています…";
  try{
    // Keep the offline fallback until the new worker has installed its full core.
    // Versioned assets and _refresh bypass stale network responses without deleting it.
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
window.addEventListener("pagehide",rememberCurrentScroll);
syncCompactHeader();
renderHome();renderRefine();renderRoles();renderPlan();showView(location.hash.slice(1)||"home",false);
