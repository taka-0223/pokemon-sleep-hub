/* On-demand UI for Data Sufficiency Gate. No writeback to CURRENT or local storage. */
(function(){
  "use strict";
  const Gate=window.SleepDataGate;
  const D=window.APP_DATA||{individuals:[],meta:{},resources:{}};
  const $=id=>document.getElementById(id);
  const dialog=$("dataGateDialog");
  if(!Gate||!dialog)return;
  const individualTypes=new Set(["keep","invest","rare_investment","release_review","special"]);
  const commitFields={
    biscuit:["biscuit_count","fullness_state"],
    keep:[],
    invest:["current_level","specialty_candy","dream_shards"],
    rare_investment:["rare_item_type","rare_item_count","alternatives_checked"],
    release_review:["protect_checked","replacement_checked"],
    cooking:[],
    field:["field_bonus","weekly_conditions"],
    special:["special_item_count","special_unlock"]
  };
  const directionMissing={
    biscuit:["biscuit_count"],
    keep:[],
    invest:["current_level","specialty_candy","dream_shards"],
    rare_investment:["rare_item_count"],
    release_review:[],
    cooking:["recipe_level","ingredient_inventory"],
    field:["weekly_conditions","field_bonus"],
    special:["special_item_count"]
  };
  const fieldSpec={
    target_pokemon:{label:"対象ポケモン"},
    biscuit_count:{label:"配分に使用できるサブレ数",kind:"number",hint:"確認した種類の残数を入力してください"},
    fullness_state:{label:"対象の満腹・フレンドポイント状況",kind:"text",hint:"必要な相手だけ"},
    current_level:{label:"現在のレベル",kind:"number",min:1,hint:"公開データにあるLvは最新とは限りません"},
    specialty_candy:{label:"対象の専用アメ残数",kind:"number"},
    dream_shards:{label:"ゆめのかけら残数",kind:"number"},
    rare_item_type:{label:"投入する希少資源",kind:"select",
      values:[["","選択してください"],["universal_candy","ばんのうアメ"],["main_skill_seed","メインスキルのたね"],["sub_skill_seed","サブスキルのたね"],["evolution_item","進化アイテム"],["other","その他"]]},
    rare_item_count:{label:"投入する希少資源の残数",kind:"number"},
    alternatives_checked:{label:"他の育成・投入先と比較した",kind:"checkbox"},
    protect_checked:{label:"色違い・唯一の食材源・保護条件を確認した",kind:"checkbox"},
    replacement_checked:{label:"代替個体・役割・将来価値を確認した",kind:"checkbox"},
    recipe_level:{label:"対象レシピのレベル"},
    ingredient_inventory:{label:"対象食材の在庫"},
    field_bonus:{label:"比較する候補フィールドのボーナス",kind:"text"},
    weekly_conditions:{label:"今週のきのみ・料理・イベント条件",kind:"text"},
    special_item_count:{label:"特殊アイテムの現在数",kind:"number"},
    special_unlock:{label:"特殊個体の解放・強化状態",kind:"text"}
  };
  const labels={READY:"前提情報は揃っています",PROVISIONAL:"条件付きで検討できます",
    VERIFY:"追加確認が必要です",HOLD:"実行判断は保留です",MODEL_GAP:"アプリ側に未算出があります"};
  const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const pad=x=>String(x).padStart(2,"0");
  function localDate(){const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
  let state={type:"invest",intent:"direction",individualId:""};
  function individual(){return (D.individuals||[]).find(p=>p.id===state.individualId)||null;}
  function fieldHtml(key){
    const f=fieldSpec[key],id="dataGateField-"+key;
    if(!f)return "";
    if(f.kind==="checkbox")return '<label class="gate-checkbox"><input type="checkbox" data-gate-field="'+esc(key)+'"><span>'+esc(f.label)+'</span></label>';
    if(f.kind==="select")return '<label class="gate-field"><span>'+esc(f.label)+'</span><select id="'+id+'" data-gate-field="'+esc(key)+'">'+f.values.map(v=>'<option value="'+esc(v[0])+'">'+esc(v[1])+'</option>').join("")+'</select></label>';
    const attrs=f.kind==="number"?'type="number" inputmode="numeric" step="1" min="'+(f.min||0)+'"':'type="text"';
    return '<label class="gate-field"><span>'+esc(f.label)+'</span><input id="'+id+'" '+attrs+' data-gate-field="'+esc(key)+'" placeholder="未入力">'+(f.hint?'<small>'+esc(f.hint)+'</small>':"")+'</label>';
  }
  function renderInputs(){
    const type=state.type,individualNeeded=individualTypes.has(type);
    const person=individual();
    const target=individualNeeded
      ?'<label class="gate-field"><span>対象ポケモン</span><select id="dataGateTarget"><option value="">選択してください</option>'+
        (D.individuals||[]).map(p=>'<option value="'+esc(p.id)+'"'+(state.individualId===p.id?' selected':'')+'>'+esc(p.name)+"（Lv."+esc(p.level)+"）"+'</option>').join("")+'</select></label>'
      :"";
    const keys=type==="release_review"?commitFields[type]:(state.intent==="commit"?commitFields[type]:[]);
    const modelBlock=type==="cooking"&&state.intent==="commit"
      ?'<p class="gate-blocker">料理エンジンはまだAppに接続されていません。鍋や食材を入力するだけでは確定エナジーを計算できません。</p>':"";
    $("dataGateFields").innerHTML=target+keys.map(fieldHtml).join("")+modelBlock;
    const snapshot=D.meta?.currentFactsRevision||D.meta?.revision||"—";
    const sourceDate=(D.meta?.currentFactsRevision||"").slice(0,10)||D.meta?.generatedAt||"日付不明";
    $("dataGateContext").textContent=person
      ?"対象："+person.name+" / 公開データLv."+person.level+"（掲載 "+sourceDate+"、現在値は未確認）"
      :"公開データ "+snapshot+" / データ更新日 "+sourceDate+"（現況とは限りません）";
    const targetSelect=$("dataGateTarget");
    if(targetSelect)targetSelect.onchange=()=>{
      state.individualId=targetSelect.value;
      renderInputs();
      updateResult();
    };
    updateResult();
  }
  function readEvidence(asOf){
    const result=[];
    dialog.querySelectorAll("[data-gate-field]").forEach(el=>{
      if(el.type==="checkbox"){
        if(el.checked)result.push({key:el.dataset.gateField,value:true,certainty:"confirmed",
          observed_at:asOf,source:"この画面で確認",confirmed_current:true});
      }else if(el.value.trim()!==""){
        const n=el.type==="number"?Number(el.value):el.value.trim();
        if(el.type==="number" && (!Number.isFinite(n)||n<Number(el.min||0)))return;
        result.push({key:el.dataset.gateField,value:n,certainty:"confirmed",
          observed_at:asOf,source:"この画面で入力",confirmed_current:true});
      }
    });
    if(individualTypes.has(state.type)&&state.individualId)
      result.push({key:"target_pokemon",value:state.individualId,certainty:"confirmed",
        observed_at:asOf,source:"公開手持ちから選択",confirmed_current:true});
    return result;
  }
  function updateResult(){
    const type=state.type,commit=state.intent==="commit",person=individual(),asOf=localDate();
    const required=(type==="release_review"?commitFields[type]:(commit?commitFields[type]:[])).slice();
    if(individualTypes.has(type))required.unshift("target_pokemon");
    const missing=commit?required:directionMissing[type].slice();
    if(individualTypes.has(type)&&!commit)missing.push("target_pokemon");
    const assumptions=[];
    if(!commit && type==="biscuit")assumptions.push("サブレ配分までは確定しない前提です。");
    if(!commit && type==="invest")assumptions.push("育成候補の検討であり、アメの投入は未承認です。");
    if(!commit && type==="rare_investment")assumptions.push("希少資源を今すぐ投入する判断は別に行います。");
    if(!commit && type==="cooking")assumptions.push("料理Lv・食材在庫は最新値として同期していません。");
    if(!commit && type==="field")assumptions.push("週の条件を確認する前の候補比較です。");
    if(!commit && type==="special")assumptions.push("特殊アイテムの消費は未承認です。");
    const modelGaps=[];
    if(type==="cooking"&&commit)modelGaps.push("料理エンジン（Phase6の数値モデル未反映）");
    if(person&&person.primaryPR==null&&commit&&["keep","release_review"].includes(type))
      modelGaps.push("対象個体のPR未測定");
    const material=required;
    const r=Gate.evaluate({decision_type:type,as_of:asOf,
      available_evidence:readEvidence(asOf),missing_fields:missing,
      material_missing_fields:material,model_gaps:modelGaps,assumptions:assumptions,
      irreversible:type==="release_review",rare_resources_at_risk:commit&&["rare_investment","special"].includes(type)});
    const asks=r.ask_only.map(key=>fieldSpec[key]?.label||key);
    let html='<div class="gate-result-heading"><span class="gate-status is-'+esc(r.status.toLowerCase())+'">'+esc(r.status)+'</span><strong>'+esc(labels[r.status])+'</strong></div>';
    if(r.reason_for_check)html+='<p>'+esc(r.reason_for_check)+'</p>';
    if(asks.length)html+='<div class="gate-asks"><b>今回だけ必要な確認</b><ul>'+asks.map(v=>'<li>'+esc(v)+'</li>').join("")+'</ul></div>';
    if(r.model_gaps.length)html+='<div class="gate-system"><b>システム側の課題</b><p>'+r.model_gaps.map(esc).join("、")+'。ユーザー側で全データを入力して解決するものではありません。</p></div>';
    if(r.assumptions.length)html+='<div class="gate-assumptions">'+r.assumptions.map(v=>'<p>前提：'+esc(v)+'</p>').join("")+'</div>';
    if(type==="release_review")html+='<p class="gate-blocker">この画面から博士送りを許可・実行することはできません。最終判断は必ず個別に行ってください。</p>';
    if(r.status==="READY")html+='<p>必要な前提を確認できました。ただし、これは育成・捕獲・資源投入を推奨する判定ではありません。</p>';
    $("dataGateResult").className="gate-result is-"+r.status.toLowerCase();
    $("dataGateResult").innerHTML=html;
    $("dataGateSource").textContent="判断方針 "+r.source_revision+"（C_DataPolicy / C_DecisionGate） / 公開個体データ "+
      ((D.meta?.currentFactsRevision||D.meta?.revision||"未確認")+"（手持ち情報） / 評価・役割の参考版 "+(D.meta?.legacyDecisionRevision||D.meta?.revision||"未確認"))+"。入力内容はこの画面限りで、CURRENT・data.js・端末内に保存されません。";
  }
  function onDecisionChange(){
    state.type=$("dataGateType").value;
    if(state.type==="release_review")state.intent="commit";
    $("dataGateDirection").checked=state.intent==="direction";
    $("dataGateCommit").checked=state.intent==="commit";
    $("dataGateIntentGroup").hidden=state.type==="release_review";
    renderInputs();
  }
  function open(options){
    const o=options||{};
    state={type:o.type||"biscuit",intent:o.intent||"direction",individualId:o.individualId||""};
    $("dataGateType").value=state.type;
    onDecisionChange();
    if(dialog.showModal)dialog.showModal();else dialog.setAttribute("open","");
  }
  $("dataGateType").addEventListener("change",onDecisionChange);
  dialog.querySelectorAll('input[name="dataGateIntent"]').forEach(el=>el.addEventListener("change",()=>{
    if(el.checked){state.intent=el.value;renderInputs();}
  }));
  $("dataGateFields").addEventListener("input",updateResult);
  $("dataGateFields").addEventListener("change",updateResult);
  $("closeDataGate").onclick=()=>dialog.close();
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  const detailButton=$("gateFromIndividual");
  if(detailButton)detailButton.addEventListener("click",()=>open({
    type:"invest",intent:"direction",individualId:detailButton.dataset.individualId||""
  }));
  const planButton=$("gateFromPlan");
  if(planButton)planButton.addEventListener("click",()=>open({type:"biscuit"}));
  window.DataGateUI=Object.freeze({open});
})();
