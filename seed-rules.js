/* Main skill seed effect tables. Values are effects per activation, not a Tier or permission. */
(function(root, factory){
  "use strict";
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  if(root) root.SEED_SKILL_RULES=api;
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:null,function(){
  "use strict";

  const SCHEMA_VERSION="1.0";
  const DATA_VERSION="seed-effects-2026-11-01-v1";
  const CHECKED_AT="2026-11-01";

  function freezeDeep(value){
    if(value && typeof value==="object" && !Object.isFrozen(value)){
      Object.values(value).forEach(freezeDeep);
      Object.freeze(value);
    }
    return value;
  }

  // Index 0 is deliberately unavailable. It is not a zero-strength skill level.
  // Exact effect values are documented by community sources; official notices
  // corroborate selected mechanics/changes, not every number in these tables.
  const skills=freezeDeep({
    energy_for_everyone_s:{
      key:"energy_for_everyone_s",
      name:"げんきオールS",
      maxLevel:6,
      unit:"energy_recovery_per_member_per_activation",
      unitLabel:"各メンバーの回復量／発動",
      effects:[null,5,7,9,11,15,18],
      source:{
        title:"ポケスリ総合資料サイト：げんきオールS",
        url:"https://wiki.pokesleep.com/ja/main-skills/energyforeveryones"
      },
      evidenceType:"community_documented",
      checkedAt:CHECKED_AT,
      version:DATA_VERSION,
      limitations:[
        "回復量をそのままチームの増分エナジーへ換算しない。",
        "実際の有効回復量は対象のげんき、回復補正、回復上限と発動時刻に依存する。"
      ]
    },
    charge_strength_m:{
      key:"charge_strength_m",
      name:"エナジーチャージM",
      maxLevel:7,
      unit:"base_strength_per_activation",
      unitLabel:"基礎エナジー／発動",
      effects:[null,880,1251,1726,2383,3290,4546,6858],
      source:{
        title:"ポケモンスリープ攻略・検証Wiki：エナジーチャージ",
        url:"https://wikiwiki.jp/poke_sleep/メインスキル/エナジーチャージ"
      },
      corroboratingSources:[
        {
          title:"ポケスリ総合資料サイト：エナジーチャージM",
          url:"https://wiki.pokesleep.com/ja/main-skills/chargestrengthm",
          evidenceType:"community_documented",
          scope:"全レベルの効果表"
        },
        {
          title:"公式：Ver.3.3.0 アップデート内容",
          url:"https://www.pokemonsleep.net/news/333730373236393633383034383937323831/",
          evidenceType:"official",
          scope:"Lv.7の効果量上方修正。変更後の実数値の出典ではない。"
        }
      ],
      evidenceType:"community_documented",
      checkedAt:CHECKED_AT,
      version:DATA_VERSION,
      limitations:[
        "フィールド等の補正を掛ける前の基礎値。",
        "日次増分には条件を揃えた発動回数と編成時間が必要。",
        "Lv.7の旧値6409をこの表と混在させない。"
      ]
    },
    cooking_power_up_s:{
      key:"cooking_power_up_s",
      name:"料理パワーアップS",
      maxLevel:7,
      unit:"extra_pot_slots_next_meal_per_activation",
      unitLabel:"次回料理の追加容量／発動",
      effects:[null,7,10,12,17,22,27,31],
      source:{
        title:"ポケモンスリープ攻略・検証Wiki：料理パワーアップ",
        url:"https://wikiwiki.jp/poke_sleep/メインスキル/料理パワーアップ"
      },
      corroboratingSources:[
        {
          title:"ポケスリ総合資料サイト：料理パワーアップS",
          url:"https://wiki.pokesleep.com/ja/main-skills/cookingpower-ups",
          evidenceType:"community_documented",
          scope:"全レベルの効果表"
        }
      ],
      evidenceType:"community_documented",
      checkedAt:CHECKED_AT,
      version:DATA_VERSION,
      limitations:[
        "増加容量は増分エナジーではない。レシピ、元の鍋容量、食材供給との照合が必要。",
        "いいキャンプ等の補正や蓄積上限をこの生の効果表には含めない。"
      ]
    },
    tasty_chance_s:{
      key:"tasty_chance_s",
      name:"料理チャンスS",
      maxLevel:6,
      unit:"extra_tasty_percentage_points_per_activation",
      unitLabel:"大成功確率の加算ポイント／発動",
      effects:[null,4,5,6,7,8,10],
      source:{
        title:"ポケスリ総合資料サイト：料理チャンスS",
        url:"https://wiki.pokesleep.com/ja/main-skills/tastychances"
      },
      evidenceType:"community_documented",
      checkedAt:CHECKED_AT,
      version:DATA_VERSION,
      limitations:[
        "4は4パーセントポイントの加算。既存確率を1.04倍する意味ではない。",
        "蓄積、上限、大成功後のリセット、曜日、料理のエナジーを考慮せず日次エナジーへ換算しない。"
      ]
    }
  });

  const nameToKey=freezeDeep(Object.fromEntries(
    Object.values(skills).map(skill=>[skill.name,skill.key])
  ));

  // Do not trim, substring-match or map a compound skill to its base skill.
  // Examples such as マジカルフレイム or オールマイティー need their own tables.
  function resolveSkillKey(name){
    return typeof name==="string" && Object.prototype.hasOwnProperty.call(nameToKey,name)
      ? nameToKey[name] : null;
  }

  function getSkill(key){
    return typeof key==="string" && Object.prototype.hasOwnProperty.call(skills,key)
      ? skills[key] : null;
  }

  function getEffect(key,level){
    const skill=getSkill(key);
    return skill && Number.isInteger(level) && level>=1 && level<=skill.maxLevel
      ? skill.effects[level] : null;
  }

  return Object.freeze({
    SCHEMA_VERSION,DATA_VERSION,CHECKED_AT,
    skills,nameToKey,resolveSkillKey,getSkill,getEffect
  });
});
