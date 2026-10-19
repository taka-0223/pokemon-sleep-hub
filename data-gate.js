/* Data Sufficiency Gate v1.0 — CURRENT r24 policy; independent of public roster revision. */
(function(root, factory){
  "use strict";
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  if(root) root.SleepDataGate=api;
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:null,function(){
  "use strict";
  const POLICY_REVISION="2026-10-19-r24";
  const POLICY_VERSION="1.0";
  const STATUSES=Object.freeze(["READY","PROVISIONAL","VERIFY","HOLD","MODEL_GAP"]);
  const DECISIONS=Object.freeze(["biscuit","keep","invest","rare_investment","release_review","cooking","field","special"]);
  const hasValue=x=>x!==undefined && x!==null && x!=="";
  function unique(xs){
    return [...new Set((Array.isArray(xs)?xs:[]).filter(x=>typeof x==="string" && x.trim()).map(x=>x.trim()))];
  }
  function isCurrent(e,asOf){
    // A dated historical observation is NOT today's confirmed value merely because its
    // original source was "confirmed". No blanket TTL is imposed on every decision.
    return e && hasValue(e.value) && e.certainty==="confirmed" &&
      (e.confirmed_current===true || (!!asOf && e.observed_at===asOf));
  }
  function evaluate(input){
    const x=input&&typeof input==="object"?input:{};
    const decision=x.decision_type||"keep";
    if(!DECISIONS.includes(decision)) throw new TypeError("Unsupported decision_type: "+decision);
    const asOf=typeof x.as_of==="string"?x.as_of:null;
    const evidence=Array.isArray(x.available_evidence)?x.available_evidence.filter(e=>e&&typeof e==="object"):[];
    const currentKeys=new Set(evidence.filter(e=>isCurrent(e,asOf)).map(e=>e.key));
    const missing=unique(x.missing_fields).filter(key=>!currentKeys.has(key));
    const material=unique(x.material_missing_fields).filter(key=>!currentKeys.has(key));
    const modelGaps=unique(x.model_gaps);
    const assumptions=unique(x.assumptions);
    const risky=x.irreversible===true || x.rare_resources_at_risk===true ||
      decision==="release_review" || decision==="rare_investment";
    const stale=evidence.filter(e=>hasValue(e.value)&&typeof e.observed_at==="string"&&
      (!asOf || e.observed_at!==asOf)).map(e=>({
      key:String(e.key||""),observed_at:e.observed_at,source:e.source||null
    }));
    let status,reason=null;
    if(decision==="release_review"){
      status="HOLD";
      reason="博士送りは自動許可しません。色違い・唯一の供給源・代替・保護指定を人が確認してください。";
    }else if(risky&&(material.length||modelGaps.length)){
      status="HOLD";
      reason="希少資源または不可逆な判断です。未確認の前提が解消するまで実行を確定しません。";
    }else if(modelGaps.length){
      status="MODEL_GAP";
      reason="評価モデル側の未算出項目があります。実績0や低性能とみなさず、システム側の課題として扱います。";
    }else if(material.length){
      status="VERIFY";
      reason="不足情報によって結論が変わるため、この判断に必要な項目だけ確認してください。";
    }else if(missing.length||assumptions.length){
      status="PROVISIONAL";
      reason="現状の情報で方向性は扱えますが、未確認の値を確定値として使用しません。";
    }else{
      status="READY";
    }
    return {
      status:status,
      recommendation:typeof x.recommendation==="string"?x.recommendation:null,
      assumptions:assumptions,
      reason_for_check:reason,
      ask_only:material,
      missing_fields:missing,
      model_gaps:modelGaps,
      stale_evidence:stale,
      release_allowed:false,
      requires_manual_review:decision==="release_review",
      source_revision:POLICY_REVISION,
      policy_version:POLICY_VERSION
    };
  }
  return Object.freeze({evaluate,POLICY_REVISION,POLICY_VERSION,STATUSES,DECISIONS});
});
