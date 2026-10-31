/* Read-only main-skill-seed views. No stored edits, reservations or game actions. */
(function(root,factory){
  "use strict";
  const api=factory(root);
  if(typeof module==="object" && module.exports) module.exports=api;
  if(root) root.SeedInvestmentUI=api;
})(typeof window!=="undefined"?window:null,function(root){
  "use strict";

  const state={individualId:null,targetSkillLevel:null};
  const boundPanels=new WeakSet();
  const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const isText=value=>typeof value==="string" && value.length>0;
  const isPositive=value=>Number.isSafeInteger(value) && value>0;
  const isCount=value=>Number.isSafeInteger(value) && value>=0;
  const object=value=>value && typeof value==="object" && !Array.isArray(value)?value:{};

  function environment(){
    return {appData:root&&root.APP_DATA,seedData:root&&root.SEED_INVESTMENT_DATA,
      model:root&&root.SeedModel,rules:root&&root.SEED_SKILL_RULES};
  }

  function validateData(input){
    const ctx=object(input),app=object(ctx.appData),data=object(ctx.seedData);
    const a=object(app.meta),s=object(data.meta),model=object(ctx.model),rules=object(ctx.rules);
    const fail=reason=>({valid:false,reason});
    if(typeof model.evaluateCandidate!=="function" || typeof model.normalizeAssessment!=="function" ||
       typeof rules.getSkill!=="function" || !isText(rules.DATA_VERSION))
      return fail("金種の評価モデルまたは効果表を読み込めません。再読み込み後も続く場合は更新を確認してください。");
    if(!isText(a.revision) || !isText(s.sourceRevision) || a.revision!==s.sourceRevision)
      return fail("手持ちデータと金種データの版が一致しません。この画面では未評価として扱います。");
    const hash=/^[0-9a-f]{64}$/;
    if(!hash.test(a.sourceSha256||"") || !hash.test(s.sourceSha256||"") || a.sourceSha256!==s.sourceSha256)
      return fail("金種データの参照元を照合できません。この画面では未評価として扱います。");
    if(s.schemaVersion!=="1.0" || s.modelVersion!==model.MODEL_VERSION || a.seedModelVersion!==s.modelVersion)
      return fail("金種データの形式または評価モデルの版が一致しません。この画面では未評価として扱います。");
    // gameDataVersion is the audited effect-table revision, not an inferred game release.
    // Comparing rules to their own DATA_VERSION would let a stale cached table self-validate.
    if(!isText(a.gameDataVersion) || !isText(s.gameDataVersion) ||
       a.gameDataVersion!==s.gameDataVersion || s.gameDataVersion!==rules.DATA_VERSION)
      return fail("手持ち・金種データとスキル効果表の版を照合できません。この画面では未評価として扱います。");
    const entries=Object.entries(object(rules.skills));
    if(!entries.length || entries.some(([,skill])=>object(skill).version!==s.gameDataVersion))
      return fail("スキル効果表に版不明または異なる版の項目があります。この画面では未評価として扱います。");
    try{
      if(entries.some(([key])=>object(rules.getSkill(key)).version!==s.gameDataVersion))
        return fail("スキル効果表の参照結果とデータ版が一致しません。この画面では未評価として扱います。");
    }catch(error){
      return fail("スキル効果表の参照結果を確認できません。この画面では未評価として扱います。");
    }
    if(!Array.isArray(app.individuals) || !Array.isArray(data.individuals) || !Array.isArray(data.speciesAssessments))
      return fail("金種評価に必要な手持ち・種族データがありません。未評価として扱います。");
    const publicIds=app.individuals.filter(p=>p&&p.active!==false).map(p=>p.id);
    const seedIds=data.individuals.map(p=>p&&p.id);
    if(data.individuals.some(p=>!p||p.active!==true) ||
       publicIds.some(id=>!isText(id)) || seedIds.some(id=>!isText(id)) ||
       new Set(publicIds).size!==publicIds.length || new Set(seedIds).size!==seedIds.length ||
       publicIds.length!==seedIds.length || s.individualCount!==seedIds.length ||
       seedIds.some(id=>!publicIds.includes(id)))
      return fail("金種データと現行の手持ち一覧が一致しません。未評価として扱います。");
    return {valid:true,reason:null};
  }

  function versionsFor(ctx){
    const meta=ctx.seedData.meta;
    const versions={sourceRevision:meta.sourceRevision,modelVersion:meta.modelVersion};
    if(isText(meta.gameDataVersion)) versions.gameDataVersion=meta.gameDataVersion;
    return versions;
  }

  function speciesName(ctx,key){
    const rows=Array.isArray(ctx.appData.speciesMaster)?ctx.appData.speciesMaster:[];
    const found=rows.find(row=>row.key===key);
    return found&&isText(found.name)?found.name:(key||"種族未確認");
  }

  function findSpeciesAssessment(ctx,p){
    const rows=ctx.seedData.speciesAssessments;
    let matches=rows.filter(row=>row.speciesKey===p.currentSpeciesKey);
    if(!matches.length && p.targetSpeciesKey!==p.currentSpeciesKey)
      matches=rows.filter(row=>row.speciesKey===p.targetSpeciesKey);
    if(matches.length!==1) return null; // Different benchmark rows need an explicit selection.
    const row=matches[0];
    if(row.speciesKey===p.currentSpeciesKey && row.skillKey!==p.mainSkillKey) return null;
    return row;
  }

  function buildView(input,selection){
    const ctx=object(input),check=validateData(ctx),pick=object(selection);
    if(!check.valid) return check;
    const data=ctx.seedData,people=data.individuals;
    let p=null;
    if(isText(pick.individualId)) p=people.find(row=>row.id===pick.individualId)||null;
    else p=people.find(row=>row.id==="IND-0002")||people[0]||null;
    if(!p) return {valid:false,reason:"この個体は現行の手持ちに登録されていません。金種評価は未評価です。"};
    const versions=versionsFor(ctx);
    const currentVersions={...versions,rulesVersion:data.meta.gameDataVersion};
    const speciesRow=findSpeciesAssessment(ctx,p);
    const speciesAssessment=ctx.model.normalizeAssessment(speciesRow,
      {kind:"species",individual:p,currentVersions});
    const accountAssessment=ctx.model.normalizeAssessment(p.accountAssessment,
      {kind:"account",individual:p,currentVersions});
    const rule=ctx.rules.getSkill(p.mainSkillKey);
    const sourceIssues=Array.isArray(p.sourceIssues)?p.sourceIssues:[];
    const usableRule=rule && sourceIssues.length===0?rule:null;
    const target=isPositive(pick.targetSkillLevel)?pick.targetSkillLevel:null;
    const scenario={id:"reference:"+p.id+":"+(target===null?"unset":target),individualId:p.id,
      skillKey:p.mainSkillKey,targetSkillLevel:target,timing:"now",seedType:"mainSkillSeed",versions};
    const result=ctx.model.evaluateCandidate({individual:p,speciesAssessment:speciesRow,
      accountAssessment:p.accountAssessment,scenario,stocks:data.resources,
      skillRules:ctx.rules,currentVersions,registeredIndividualIds:people.map(row=>row.id)});
    const catalog=data.speciesAssessments.map(row=>({
      row,name:speciesName(ctx,row.speciesKey),
      assessment:ctx.model.normalizeAssessment(row,{kind:"species",
        individual:{currentSpeciesKey:row.speciesKey},currentVersions})
    }));
    return {valid:true,individual:p,people,rule:usableRule,targetSkillLevel:target,
      speciesAssessment,accountAssessment,result,catalog,
      speciesName:speciesAssessment.speciesKey?speciesName(ctx,speciesAssessment.speciesKey):null,
      stock:object(object(data.resources).mainSkillSeed),sourceRevision:data.meta.sourceRevision,
      sourceIssues,legacy:(Array.isArray(data.scenarios)?data.scenarios:[])
        .filter(row=>row.individualId===p.id && row.status==="legacy_proposal"),
      recommended:false,approved:false};
  }

  function tierLabel(assessment){
    const a=object(assessment);
    if(a.status==="stale") return "未評価（再確認が必要）";
    if(!a.tier || !["validated","provisional"].includes(a.status)) return "未評価";
    return "Tier "+a.tier+(a.status==="provisional"?"（暫定）":"");
  }

  function applicabilityHtml(assessment){
    const labels={broad:"広く適用",conditional:"条件付き",not_applicable:"対象外",unknown:"適用条件未確認"};
    const applicability=object(assessment).applicability;
    const label=Object.prototype.hasOwnProperty.call(labels,applicability)?labels[applicability]:labels.unknown;
    return '<p class="seed-meta seed-applicability">適用：'+label+'</p>';
  }

  function rationaleHtml(assessment){
    const a=object(assessment),parts=[];
    if(isText(a.rationale)) parts.push('<p class="seed-rationale">'+esc(a.rationale)+'</p>');
    if(Array.isArray(a.conditions) && a.conditions.length)
      parts.push('<ul class="seed-conditions">'+a.conditions.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>');
    return parts.join("");
  }

  function assessmentHtml(view){
    const s=view.speciesAssessment,a=view.accountAssessment;
    const scope=s.scope==="target_species"?"進化先 ":"現在の種族 ";
    return '<div class="seed-layers">'+
      '<section class="seed-layer"><h4>1. 種族の投資候補</h4><p class="seed-tier">'+esc(tierLabel(s))+'</p>'+
      applicabilityHtml(s)+
      (view.speciesName?'<p class="seed-meta">'+esc(scope+view.speciesName)+'</p>':"")+
      (s.scope==="target_species"?'<p class="seed-note">進化後の候補評価です。今の個体性能や現在の投入必要数を示すものではありません。</p>':"")+
      rationaleHtml(s)+'</section>'+
      '<section class="seed-layer"><h4>2. この個体の投資候補</h4><p class="seed-tier">'+esc(tierLabel(a))+'</p>'+
      applicabilityHtml(a)+rationaleHtml(a)+'<p class="seed-note">候補Tierと、今使うかどうかの判断は別です。</p></section></div>';
  }

  function stockHtml(stock){
    const s=object(stock),amount=isCount(s.reportedValue)?s.reportedValue:isCount(s.value)?s.value:null;
    const date=isText(s.observedAt)?s.observedAt:"観測日不明";
    let value="記録なし";
    if(amount!==null) value=(s.certainty==="approx"?"約":"")+amount+"個";
    else if(isText(s.text)) value=s.text;
    const status=s.certainty==="approx"?"概数":s.certainty==="confirmed"?"その時点の確認値":"未確認値";
    return '<p class="seed-stock"><strong>汎用種の在庫記録：'+esc(value)+'</strong><span>'+esc(date+"の"+status)+
      '。現在の確定在庫としては扱いません。</span></p>';
  }

  function alertHtml(reason){
    return '<section class="seed-panel seed-unavailable" role="alert"><h3>メインスキルのたね：未評価</h3><p>'+esc(reason)+'</p></section>';
  }

  function referenceHtml(view){
    const p=view.individual,rule=view.rule,result=view.result.scenario;
    const selected=view.targetSkillLevel;
    let controls="",output="";
    if(rule){
      const options=['<option value="">目標を選択</option>'];
      for(let level=1;level<=rule.maxLevel;level++) options.push('<option value="'+level+'"'+
        (selected===level?' selected':"")+'>SLv.'+level+'</option>');
      controls='<label class="seed-field"><span>比較する目標SLv</span><select data-seed-field="target" aria-label="比較する目標SLv">'+options.join("")+'</select></label>';
      if(selected===null) output='<p class="seed-note">目標SLvを選ぶと必要個数と1回あたりの効果差を比較できます。選択は使用の意思決定・承認ではありません。</p>';
      else if(result.status==="ready" && result.requiredSeeds!==null){
        const delta=result.perTriggerDelta;
        output='<dl class="seed-metrics"><div><dt>登録SLv → 比較目標</dt><dd>SLv.'+esc(result.baselineSkillLevel)+' → SLv.'+esc(selected)+'</dd></div>'+
          '<div><dt>参考必要個数</dt><dd>'+esc(result.requiredSeeds)+'個'+(result.requiredSeeds===0?'（すでに目標以上）':"")+'</dd></div>'+
          (delta?'<div><dt>1回あたりの効果差</dt><dd>'+esc(delta.before)+' → '+esc(delta.after)+'（差 '+esc(delta.delta)+'）<small>'+esc(delta.unitLabel||delta.unit)+'</small></dd></div>':
            '<div><dt>1回あたりの効果差</dt><dd>未算出</dd></div>')+'</dl>'+
          (delta&&delta.limitations.length?'<ul class="seed-conditions">'+delta.limitations.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':"");
      }else output='<p class="seed-warning">必要個数は未算出です。登録SLv・スキル・参照版・目標値を確認してください。未確認を0個として扱いません。</p>';
    }else output='<p class="seed-warning">このスキルの効果表または個体の前提情報が未整備です。必要個数・効果差は未算出であり、低評価や0個という意味ではありません。</p>';
    return '<section class="seed-reference" data-seed-approved="false" data-seed-recommended="false"><h4>3. 投入シナリオの比較</h4>'+
      '<p class="seed-decision">投入判断は未確定・使用承認なし</p>'+
      '<p class="seed-meta">'+esc(p.mainSkillName||"メインスキル未確認")+' / 登録SLv.'+esc(isPositive(p.currentSkillLevel)?p.currentSkillLevel:"未確認")+'</p>'+
      controls+output+'<p class="seed-note">これは登録済みSLvから「今使う」と仮定した参考計算です。将来の進化・未解放サブスキルの上昇分は差し引きません。実際の使用前にはゲーム画面の現在値を確認します。</p>'+
      '<p class="seed-note">発動回数・編成時間・交代枠・料理条件は未反映です。日次ROIは未算出で、必要個数や効果差は使用推奨を意味しません。</p></section>';
  }

  function catalogHtml(view){
    return '<details class="seed-catalog"><summary>種族金種Tierの一覧と条件（'+view.catalog.length+'件）</summary>'+
      '<p class="seed-note">良個体を長期採用する場合の、定性的な投資候補の優先度です。同条件で測定した金種効率ランキングではありません。未掲載の種族は低Tierではなく未評価です。</p>'+
      '<ul class="seed-species-list">'+view.catalog.map(item=>'<li><div class="seed-species-head"><strong>'+esc(item.name)+'</strong><span>'+esc(tierLabel(item.assessment))+'</span></div>'+
        applicabilityHtml(item.assessment)+rationaleHtml(item.assessment)+'</li>').join("")+'</ul></details>';
  }

  function legacyHtml(view){
    if(!view.legacy.length) return "";
    return '<details class="seed-legacy"><summary>以前の検討案（参考資料）</summary><p class="seed-note">実行時点が確定していない過去案です。今回の必要個数の計算や使用推奨には転用していません。</p><ul>'+
      view.legacy.map(row=>'<li>'+esc(row.name||row.id)+' <small>'+esc(object(row.source).reviewedAt||"検討日不明")+'</small></li>').join("")+'</ul></details>';
  }

  function planHtml(view){
    if(!view.valid) return alertHtml(view.reason);
    return '<section class="seed-panel"><h3>メインスキルのたね</h3><p class="seed-note">種族の候補、手持ち個体の候補、実際の投入判断を分けて表示します。過去の投入上限は使用許可とみなしません。</p>'+
      stockHtml(view.stock)+'<label class="seed-field"><span>比較する個体</span><select data-seed-field="individual" aria-label="金種の比較対象個体">'+
      view.people.map(p=>'<option value="'+esc(p.id)+'"'+(p.id===view.individual.id?' selected':"")+'>'+esc((p.name||p.id)+"（"+p.id+" / Lv."+(isPositive(p.level)?p.level:"未確認")+"）")+'</option>').join("")+'</select></label>'+
      assessmentHtml(view)+referenceHtml(view)+catalogHtml(view)+legacyHtml(view)+
      '<p class="seed-meta seed-source">参照版：'+esc(view.sourceRevision)+' / 一時比較のみ。手持ち・在庫・評価データは変更しません。</p></section>';
  }

  function renderPlan(){
    const doc=root&&root.document,panel=doc&&doc.getElementById("seedInvestmentPanel");
    if(!panel) return false;
    let view;
    try{view=buildView(environment(),state);}catch(error){
      view={valid:false,reason:"金種評価の読み込みに失敗しました。未評価として扱い、投入判断は確定しません。"};
    }
    if(view.valid) state.individualId=view.individual.id;
    panel.innerHTML=planHtml(view);
    if(!boundPanels.has(panel)){
      panel.addEventListener("change",event=>{
        const target=event.target;
        if(!target || typeof target.getAttribute!=="function") return;
        const field=target.getAttribute("data-seed-field");
        if(field==="individual"){
          state.individualId=String(target.value); state.targetSkillLevel=null;
        }else if(field==="target"){
          state.targetSkillLevel=/^[1-9]\d*$/.test(String(target.value))?Number(target.value):null;
        }else return;
        renderPlan();
        const focus=typeof panel.querySelector==="function"?panel.querySelector('[data-seed-field="'+field+'"]'):null;
        if(focus&&typeof focus.focus==="function") focus.focus();
      });
      boundPanels.add(panel);
    }
    return view.valid;
  }

  function individualHtml(id){
    let view;
    try{view=buildView(environment(),{individualId:id});}catch(error){
      return alertHtml("金種評価の読み込みに失敗しました。投入判断は未確定です。");
    }
    if(!view.valid) return alertHtml(view.reason);
    return '<section class="seed-panel seed-detail" data-seed-approved="false" data-seed-recommended="false"><h3>金種の投資判断</h3>'+
      assessmentHtml(view)+'<section class="seed-reference"><h4>3. 投入判断</h4><p class="seed-decision">未確定・使用承認なし</p>'+
      '<p class="seed-note">目標SLv別の必要個数は「育成」の金種欄で比較できます。個体Tier・種族Tierだけでは投入先や個数を確定しません。</p></section></section>';
  }

  return Object.freeze({renderPlan,individualHtml,validateData,buildView,planHtml});
});
