window.APP_DATA = {
  "meta": {
    "title": "Pokémon Sleep Decision Hub",
    "revision": "2026-10-02-r9",
    "schemaVersion": "1.1",
    "generatedAt": "2026-10-02",
    "source": "pokemon_sleep_decision_system_CURRENT.xlsx",
    "individualPRDefinition": "同種族・同食材構成・同評価LvにおけるポケスリシミュのPR",
    "srpDefinition": "同役割種族間の標準化Lv30比較（PWA生成時にポケスリシミュ公開データから算出）"
  },
  "individuals": [
    {
      "id": "IND-0001",
      "name": "チルタリス",
      "level": 36,
      "speciesKey": "altaria",
      "targetSpeciesKey": "altaria",
      "targetSpeciesName": "チルタリス",
      "targetMainSkill": "げんきチャージS",
      "targetBerry": null,
      "skillLv": 2,
      "foods": [
        "とくせんエッグ",
        "ワカクサ大豆",
        "ワカクサ大豆"
      ],
      "foodPattern": "ABB",
      "nature": "のうてんき",
      "natureUp": "げんき回復",
      "natureDown": "メインスキル発生",
      "subskills": [
        {
          "lv": 10,
          "name": "おてつだいボーナス"
        },
        {
          "lv": 25,
          "name": "きのみの数S"
        },
        {
          "lv": 50,
          "name": "最大所持数S"
        },
        {
          "lv": 70,
          "name": "最大所持数M"
        },
        {
          "lv": 80,
          "name": "スキル確率アップS"
        }
      ],
      "quality": "S",
      "disposition": "育成",
      "refinement": "終了",
      "targetLevel": 50,
      "stopLevel": 50,
      "priority": 7,
      "rationale": "BFS＋おてボがLv25までに完成。役割スロットも充足。急ぎ投資は不要。",
      "dedicatedCandy": "可",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-003",
      "roleKey": "berry_yache",
      "roleName": "ヤチェのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "充足",
      "searchStatus": "停止",
      "speciesGrade": "A+",
      "primaryMetric": "きのみPR",
      "primaryPR": 97,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 3,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 99.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "きのみPR",
          "pr": 97,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 98,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "きのみPR",
          "pr": 93.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 98.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "きのみPR",
          "pr": 93.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0002",
      "name": "プクリン",
      "level": 34,
      "speciesKey": "wigglytuff",
      "targetSpeciesKey": "wigglytuff",
      "targetSpeciesName": "プクリン",
      "targetMainSkill": "げんきオールS",
      "targetBerry": null,
      "skillLv": 3,
      "foods": [
        "あまいミツ",
        "あまいミツ",
        "リラックスカカオ"
      ],
      "foodPattern": "AAB",
      "nature": "いじっぱり",
      "natureUp": "おてつだいスピード",
      "natureDown": "食材おてつだい確率",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップM"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 50,
          "name": "最大所持数L"
        },
        {
          "lv": 70,
          "name": "スキル確率アップS"
        },
        {
          "lv": 80,
          "name": "食材確率アップM"
        }
      ],
      "quality": "S",
      "disposition": "育成",
      "refinement": "終了",
      "targetLevel": 34,
      "stopLevel": 34,
      "priority": 2,
      "rationale": "ヒーラー個体として高完成度。レベルよりSLv6金種シナリオを優先検討。",
      "dedicatedCandy": "可",
      "universalCandy": "不可",
      "dreamShard": "可",
      "mainSeedCap": 3,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-001",
      "roleKey": "healer",
      "roleName": "ヒーラー枠",
      "roleType": "スキル",
      "roleNeed": "充足",
      "searchStatus": "条件付き継続",
      "speciesGrade": "A+",
      "primaryMetric": "スキル発動PR",
      "primaryPR": 99.7,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 0.3,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 98.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 99.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 93.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 99.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 93.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 99.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0003",
      "name": "カメール",
      "level": 19,
      "speciesKey": "wartortle",
      "targetSpeciesKey": "blastoise",
      "targetSpeciesName": "カメックス",
      "targetMainSkill": "食材ゲットS",
      "targetBerry": null,
      "skillLv": 2,
      "foods": [
        "モーモーミルク",
        "リラックスカカオ",
        "マメミート"
      ],
      "foodPattern": "ABC",
      "nature": "てれや",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "食材確率アップM"
        },
        {
          "lv": 25,
          "name": "最大所持数アップL"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 70,
          "name": "最大所持数アップS"
        },
        {
          "lv": 80,
          "name": "食材確率アップS"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": 2,
      "rationale": "個体品質は高いが役割は混合供給。共有ゼニガメ系アメはミルク専任IND-0004を優先し、IND-0003は睡眠EXPでLv30へ。",
      "dedicatedCandy": "後回し（睡眠EXP中心）",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-002",
      "roleKey": "milk_cacao_mixed",
      "roleName": "ミルク/カカオ混合供給枠",
      "roleType": "食材",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "食材PR",
      "primaryPR": 93,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 7,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 81,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 93,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 93.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 97.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 94.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 98.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0004",
      "name": "カメックス",
      "level": 30,
      "speciesKey": "blastoise",
      "targetSpeciesKey": "blastoise",
      "targetSpeciesName": "カメックス",
      "targetMainSkill": "食材ゲットS",
      "targetBerry": null,
      "skillLv": 4,
      "foods": [
        "モーモーミルク",
        "モーモーミルク",
        "リラックスカカオ"
      ],
      "foodPattern": "AAB",
      "nature": "のうてんき",
      "natureUp": "げんき回復",
      "natureDown": "メインスキル発生",
      "subskills": [
        {
          "lv": 10,
          "name": "最大所持数アップM"
        },
        {
          "lv": 25,
          "name": "スキルレベルアップS"
        },
        {
          "lv": 50,
          "name": "食材確率アップM"
        },
        {
          "lv": 70,
          "name": "きのみの数S"
        },
        {
          "lv": 80,
          "name": "おてつだいボーナス"
        }
      ],
      "quality": "B",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": 1,
      "rationale": "カメックスLv30到達。ミルク専任は第一完成ライン。専用アメ・万能アメは一旦停止し、Lv50食材Mは長期自然育成。",
      "dedicatedCandy": "優先",
      "universalCandy": "条件付き",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-015",
      "roleKey": "milk_specialist",
      "roleName": "ミルク専任枠",
      "roleType": "食材",
      "roleNeed": "充足",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "食材PR",
      "primaryPR": 51,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 49,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 36,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 51,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 75.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 91.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 73.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 90,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0005",
      "name": "ミュウツー",
      "level": 27,
      "speciesKey": "mewtwo",
      "targetSpeciesKey": "mewtwo",
      "targetSpeciesName": "ミュウツー",
      "targetMainSkill": "サイコブレイク(きのみゾーン)",
      "targetBerry": "マゴ",
      "skillLv": 1,
      "foods": [
        "ワカクサ大豆",
        "ワカクサコーン",
        "ワカクサ大豆"
      ],
      "foodPattern": "ABA",
      "nature": "いじっぱり",
      "natureUp": "おてつだいスピード",
      "natureDown": "食材おてつだい確率",
      "subskills": [
        {
          "lv": 10,
          "name": "食材確率アップM"
        },
        {
          "lv": 25,
          "name": "スキル確率アップS"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 70,
          "name": "食材確率アップS"
        },
        {
          "lv": 80,
          "name": "睡眠EXPボーナス"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "条件付き継続",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": 5,
      "rationale": "固定初期個体として実用性高。Lv50スキルPR94.0。金種は他候補比較後。",
      "dedicatedCandy": "可",
      "universalCandy": "条件付き",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "候補",
      "roleId": "ROLE-013",
      "roleKey": "psychic_zone",
      "roleName": "エスパー/マゴのみゾーン枠",
      "roleType": "スキル",
      "roleNeed": "候補運用",
      "searchStatus": "条件付き継続",
      "speciesGrade": null,
      "primaryMetric": "スキル発動PR",
      "primaryPR": 86,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 14,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 78.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 86,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 87.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 94,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 86.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 93.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0006",
      "name": "アチゲータ",
      "level": 25,
      "speciesKey": "crocalor",
      "targetSpeciesKey": "skeledirge",
      "targetSpeciesName": "ラウドボーン",
      "targetMainSkill": "げんきチャージS",
      "targetBerry": "ブリー",
      "skillLv": 2,
      "foods": [
        "とくせんリンゴ",
        "とくせんリンゴ",
        "とくせんリンゴ"
      ],
      "foodPattern": "AAA",
      "nature": "おっとり",
      "natureUp": "食材おてつだい確率",
      "natureDown": "げんき回復量",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップS"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 50,
          "name": "ゆめのかけらボーナス"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 80,
          "name": "おてつだいボーナス"
        }
      ],
      "quality": "A",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": 3,
      "rationale": "アチゲータLv25。おてスピM解禁済み。次はLv27ラウドボーン→Lv30リンゴ×5。不足分のみ万能アメ候補。",
      "dedicatedCandy": "優先",
      "universalCandy": "条件付き",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-004",
      "roleKey": "apple",
      "roleName": "リンゴ供給枠",
      "roleType": "食材",
      "roleNeed": "充足予定",
      "searchStatus": "停止",
      "speciesGrade": "A+",
      "primaryMetric": "食材PR",
      "primaryPR": 88,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 12,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 84,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 88,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 74.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 81,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 75,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 82,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0007",
      "name": "ネイティ",
      "level": 12,
      "speciesKey": "natu",
      "targetSpeciesKey": "xatu",
      "targetSpeciesName": "ネイティオ",
      "targetMainSkill": "食材ゲットS",
      "targetBerry": "マゴ",
      "skillLv": 1,
      "foods": [
        "とくせんエッグ",
        "とくせんエッグ",
        "とくせんリンゴ"
      ],
      "foodPattern": "AAB",
      "nature": "すなお",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 50,
          "name": "おてつだいボーナス"
        },
        {
          "lv": 70,
          "name": "食材確率アップS"
        },
        {
          "lv": 80,
          "name": "スキル確率アップS"
        }
      ],
      "quality": "A",
      "disposition": "キープ",
      "refinement": "継続",
      "targetLevel": 17,
      "stopLevel": 17,
      "priority": 9,
      "rationale": "速度M＋S＋おてボは良いがBFSなし。暫定利用しBFS探索を継続。",
      "dedicatedCandy": "条件付き",
      "universalCandy": "不可",
      "dreamShard": "条件付き",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-007",
      "roleKey": "berry_psychic",
      "roleName": "マゴのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "不足",
      "searchStatus": "継続",
      "speciesGrade": null,
      "primaryMetric": "きのみPR",
      "primaryPR": 86.8,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 13.2,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 79,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "きのみPR",
          "pr": 86.8,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 96.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "きのみPR",
          "pr": 83.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 96.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "きのみPR",
          "pr": 83.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0008",
      "name": "マスカーニャ",
      "level": 31,
      "speciesKey": "meowscarada",
      "targetSpeciesKey": "meowscarada",
      "targetSpeciesName": "マスカーニャ",
      "targetMainSkill": "料理パワーアップS",
      "targetBerry": "ウイ",
      "skillLv": 3,
      "foods": [
        "ほっこりポテト",
        "ほっこりポテト",
        "ほっこりポテト"
      ],
      "foodPattern": "AAA",
      "nature": "おとなしい",
      "natureUp": "メインスキル発生確率",
      "natureDown": "げんき回復量",
      "subskills": [
        {
          "lv": 10,
          "name": "おてつだいボーナス"
        },
        {
          "lv": 25,
          "name": "食材確率アップM"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 70,
          "name": "スキル確率アップM"
        },
        {
          "lv": 80,
          "name": "スキルレベルアップS"
        }
      ],
      "quality": "S",
      "disposition": "育成",
      "refinement": "終了",
      "targetLevel": 50,
      "stopLevel": 50,
      "priority": 8,
      "rationale": "AAAポテト＋食材M＋おてボ、Lv50速度M。役割個体として完成度高い。",
      "dedicatedCandy": "可",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-005",
      "roleKey": "potato",
      "roleName": "ポテト供給枠",
      "roleType": "食材",
      "roleNeed": "充足",
      "searchStatus": "停止",
      "speciesGrade": "A+",
      "primaryMetric": "食材PR",
      "primaryPR": 92.9,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 7.1,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 99,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 92.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 99,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 96.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 99.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 96.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0009",
      "name": "ミュウ",
      "level": 27,
      "speciesKey": "mew",
      "targetSpeciesKey": "mew",
      "targetSpeciesName": "ミュウ",
      "targetMainSkill": "オールマイティー",
      "targetBerry": "マゴ",
      "skillLv": 3,
      "foods": [
        "とくせんエッグ",
        "げきからハーブ",
        null
      ],
      "foodPattern": "AB-",
      "nature": "きまぐれ",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "スキルレベルアップM"
        },
        {
          "lv": 25,
          "name": "スキル確率アップS"
        },
        {
          "lv": 50,
          "name": null
        },
        {
          "lv": 70,
          "name": null
        },
        {
          "lv": 80,
          "name": null
        }
      ],
      "quality": "特殊",
      "disposition": "キープ",
      "refinement": "対象外",
      "targetLevel": 27,
      "stopLevel": 27,
      "priority": null,
      "rationale": "固定初期素体＋ひらめきのたねで可変。通常S/A/Bモデルの単純適用を避ける。",
      "dedicatedCandy": "保留",
      "universalCandy": "不可",
      "dreamShard": "保留",
      "mainSeedCap": 0,
      "silverSeedPolicy": "保留",
      "roleId": "ROLE-010",
      "roleKey": "cooking_pot",
      "roleName": "鍋拡張・料理パワーアップ枠",
      "roleType": "スキル",
      "roleNeed": "充足",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "スキル発動PR",
      "primaryPR": 63,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 37,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 26,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed; Mew special structure — reference only"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 63,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed; Mew special structure — reference only"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 7.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed; Mew special structure — reference only"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 51,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed; Mew special structure — reference only"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 5.5,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed; Mew special structure — reference only"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 52,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed; Mew special structure — reference only"
        }
      ]
    },
    {
      "id": "IND-0010",
      "name": "モココ",
      "level": 23,
      "speciesKey": "flaaffy",
      "targetSpeciesKey": "ampharos",
      "targetSpeciesName": "デンリュウ",
      "targetMainSkill": "エナジーチャージM",
      "targetBerry": "ウブ",
      "skillLv": 2,
      "foods": [
        "げきからハーブ",
        "とくせんエッグ",
        "げきからハーブ"
      ],
      "foodPattern": "ABA",
      "nature": "おとなしい",
      "natureUp": "メインスキル発生確率",
      "natureDown": "げんき回復量",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップM"
        },
        {
          "lv": 25,
          "name": "食材確率アップM"
        },
        {
          "lv": 50,
          "name": "げんき回復ボーナス"
        },
        {
          "lv": 70,
          "name": "食材確率アップS"
        },
        {
          "lv": 80,
          "name": "最大所持数アップL"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": 4,
      "rationale": "モココLv23で進化レベル条件達成。専用アメ16のため進化に64個不足。万能アメ最優先でデンリュウ化、その後Lv30へ。",
      "dedicatedCandy": "優先",
      "universalCandy": "条件付き",
      "dreamShard": "可",
      "mainSeedCap": 4,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-006",
      "roleKey": "direct_energy",
      "roleName": "直接エナジー・スキル枠",
      "roleType": "スキル",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": "A+",
      "primaryMetric": "スキル発動PR",
      "primaryPR": 98.5,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 1.5,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 95.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 98.5,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 84.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 97.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 79.8,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 96.8,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0011",
      "name": "ワニノコ",
      "level": 19,
      "speciesKey": "totodile",
      "targetSpeciesKey": "feraligatr",
      "targetSpeciesName": "オーダイル",
      "targetMainSkill": "エナジーチャージS(ランダム)",
      "targetBerry": "オレン",
      "skillLv": 1,
      "foods": [
        "マメミート",
        "ピュアなオイル",
        "ピュアなオイル"
      ],
      "foodPattern": "ABB",
      "nature": "おとなしい",
      "natureUp": "メインスキル発生確率",
      "natureDown": "げんき回復量",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップM"
        },
        {
          "lv": 25,
          "name": "最大所持数アップL"
        },
        {
          "lv": 50,
          "name": "食材確率アップM"
        },
        {
          "lv": 70,
          "name": "睡眠EXPボーナス"
        },
        {
          "lv": 80,
          "name": "おてつだいスピードM"
        }
      ],
      "quality": "C",
      "disposition": "アメ化候補",
      "refinement": "継続",
      "targetLevel": 19,
      "stopLevel": 19,
      "priority": null,
      "rationale": "きのみ得意だがBFSなし。Lv30きのみPR27、Lv50で4.7。次個体を探索。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-009",
      "roleKey": "berry_water",
      "roleName": "オレンのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "不足",
      "searchStatus": "継続",
      "speciesGrade": null,
      "primaryMetric": "きのみPR",
      "primaryPR": 27,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 73,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 18.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "きのみPR",
          "pr": 27,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 24.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "きのみPR",
          "pr": 4.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 25.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "きのみPR",
          "pr": 4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0012",
      "name": "コイル Lv14",
      "level": 14,
      "speciesKey": "magnemite",
      "targetSpeciesKey": "magnezone",
      "targetSpeciesName": "ジバコイル",
      "targetMainSkill": "料理パワーアップS",
      "targetBerry": "ベリブ",
      "skillLv": 3,
      "foods": [
        "ピュアなオイル",
        "げきからハーブ",
        "ピュアなオイル"
      ],
      "foodPattern": "ABA",
      "nature": "おだやか",
      "natureUp": "メインスキル発生確率",
      "natureDown": "おてつだいスピード",
      "subskills": [
        {
          "lv": 10,
          "name": "スキルレベルアップM"
        },
        {
          "lv": 25,
          "name": "食材確率アップS"
        },
        {
          "lv": 50,
          "name": "最大所持数アップS"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 80,
          "name": "スキル確率アップS"
        }
      ],
      "quality": "B",
      "disposition": "キープ",
      "refinement": "停止",
      "targetLevel": 14,
      "stopLevel": 14,
      "priority": null,
      "rationale": "発動性能は中位だがSLv3・スキル↑性格で低金種の鍋拡張控えとして保持。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-010",
      "roleKey": "cooking_pot",
      "roleName": "鍋拡張・料理パワーアップ枠",
      "roleType": "スキル",
      "roleNeed": "充足",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "スキル発動PR",
      "primaryPR": 54,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 46,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 40.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 54,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 21.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 45,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 19.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 47,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0013",
      "name": "パルデアウパー",
      "level": 12,
      "speciesKey": "paldean_wooper",
      "targetSpeciesKey": "clodsire",
      "targetSpeciesName": "ドオー",
      "targetMainSkill": "げんきチャージS",
      "targetBerry": "カゴ",
      "skillLv": 1,
      "foods": [
        "リラックスカカオ",
        "リラックスカカオ",
        "ほっこりポテト"
      ],
      "foodPattern": "AAB",
      "nature": "うっかりや",
      "natureUp": "食材おてつだい確率",
      "natureDown": "メインスキル発生確率",
      "subskills": [
        {
          "lv": 10,
          "name": "最大所持数アップL"
        },
        {
          "lv": 25,
          "name": "スキル確率アップS"
        },
        {
          "lv": 50,
          "name": "食材確率アップM"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 80,
          "name": "スキル確率アップM"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": 6,
      "rationale": "カカオAA＋食材↑性格＋Lv50食材M。カカオ専任としてLv30/50を段階投資。混合カメールとは別役割。",
      "dedicatedCandy": "可",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-008",
      "roleKey": "cacao_specialist",
      "roleName": "カカオ専任枠",
      "roleType": "食材",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "食材PR",
      "primaryPR": 81,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 19,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 69,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 81,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 94.3,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 98.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 96.5,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 99.2,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0014",
      "name": "コイル Lv12",
      "level": 12,
      "speciesKey": "magnemite",
      "targetSpeciesKey": "magnezone",
      "targetSpeciesName": "ジバコイル",
      "targetMainSkill": "料理パワーアップS",
      "targetBerry": "ベリブ",
      "skillLv": 1,
      "foods": [
        "ピュアなオイル",
        "げきからハーブ",
        "ピュアなオイル"
      ],
      "foodPattern": "ABA",
      "nature": "やんちゃ",
      "natureUp": "おてつだいスピード",
      "natureDown": "メインスキル発生確率",
      "subskills": [
        {
          "lv": 10,
          "name": "最大所持数アップS"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 50,
          "name": "スキル確率アップS"
        },
        {
          "lv": 70,
          "name": "食材確率アップS"
        },
        {
          "lv": 80,
          "name": "食材確率アップM"
        }
      ],
      "quality": "C",
      "disposition": "アメ化候補",
      "refinement": "停止",
      "targetLevel": 12,
      "stopLevel": 12,
      "priority": null,
      "rationale": "スキル得意に対して性格スキル↓。Lv30スキルPR22.4。役割は他個体で充足。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-010",
      "roleKey": "cooking_pot",
      "roleName": "鍋拡張・料理パワーアップ枠",
      "roleType": "スキル",
      "roleNeed": "充足",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "スキル発動PR",
      "primaryPR": 22.4,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 77.6,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 73,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 22.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 95.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 19,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 96.8,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 22.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0015",
      "name": "ヒトカゲ",
      "level": 12,
      "speciesKey": "charmander",
      "targetSpeciesKey": "charizard",
      "targetSpeciesName": "リザードン",
      "targetMainSkill": "食材ゲットS",
      "targetBerry": "ヒメリ",
      "skillLv": 1,
      "foods": [
        "マメミート",
        "マメミート",
        "あったかジンジャー"
      ],
      "foodPattern": "AAB",
      "nature": "がんばりや",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "食材確率アップS"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 50,
          "name": "最大所持数アップS"
        },
        {
          "lv": 70,
          "name": "スキル確率アップS"
        },
        {
          "lv": 80,
          "name": "リサーチEXPボーナス"
        }
      ],
      "quality": "A",
      "disposition": "キープ",
      "refinement": "停止",
      "targetLevel": 12,
      "stopLevel": 12,
      "priority": null,
      "rationale": "ミートAAB＋食材S＋速度S。役割需要未確認のため追加投資は保留。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "条件付き",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-011",
      "roleKey": "meat",
      "roleName": "マメミート供給枠",
      "roleType": "食材",
      "roleNeed": "未確認",
      "searchStatus": "未確認",
      "speciesGrade": null,
      "primaryMetric": "食材PR",
      "primaryPR": 80,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 20,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 67.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 80,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 50.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 77,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 49.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 75,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0016",
      "name": "ポッチャマ",
      "level": 12,
      "speciesKey": "piplup",
      "targetSpeciesKey": "empoleon",
      "targetSpeciesName": "エンペルト",
      "targetMainSkill": "おてつだいサポートS",
      "targetBerry": "ベリブ",
      "skillLv": 1,
      "foods": [
        "とくせんエッグ",
        "ふといながねぎ",
        "とくせんエッグ"
      ],
      "foodPattern": "ABA",
      "nature": "わんぱく",
      "natureUp": "げんき回復量",
      "natureDown": "食材おてつだい確率",
      "subskills": [
        {
          "lv": 10,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 25,
          "name": "食材確率アップS"
        },
        {
          "lv": 50,
          "name": "スキル確率アップS"
        },
        {
          "lv": 70,
          "name": "ゆめのかけらボーナス"
        },
        {
          "lv": 80,
          "name": "最大所持数アップS"
        }
      ],
      "quality": "B",
      "disposition": "アメ化候補",
      "refinement": "条件付き継続",
      "targetLevel": 12,
      "stopLevel": 12,
      "priority": null,
      "rationale": "きのみ得意でBFSなし。Lv30きのみPR73.9。鋼きのみ役の需要があれば次個体探索。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-012",
      "roleKey": "berry_steel",
      "roleName": "ベリブのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "不足",
      "searchStatus": "条件付き継続",
      "speciesGrade": null,
      "primaryMetric": "きのみPR",
      "primaryPR": 73.9,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 26.1,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 73.2,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "きのみPR",
          "pr": 73.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 65.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "きのみPR",
          "pr": 64.5,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 63.8,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "きのみPR",
          "pr": 64.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0017",
      "name": "パモ",
      "level": 12,
      "speciesKey": "pawmi",
      "targetSpeciesKey": "pawmot",
      "targetSpeciesName": "パーモット",
      "targetMainSkill": "げんきオールS",
      "targetBerry": "ウブ",
      "skillLv": 1,
      "foods": [
        "リラックスカカオ",
        "モーモーミルク",
        "とくせんエッグ"
      ],
      "foodPattern": "ABC",
      "nature": "いじっぱり",
      "natureUp": "おてつだいスピード",
      "natureDown": "食材おてつだい確率",
      "subskills": [
        {
          "lv": 10,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 25,
          "name": "最大所持数アップS"
        },
        {
          "lv": 50,
          "name": "食材確率アップS"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 80,
          "name": "スキルレベルアップM"
        }
      ],
      "quality": "A+",
      "disposition": "キープ",
      "refinement": "停止",
      "targetLevel": 12,
      "stopLevel": 12,
      "priority": null,
      "rationale": "速度M＋速度↑性格でパーモット想定スキルPR92.7。ただし主力プクリンを更新しない。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-001",
      "roleKey": "healer",
      "roleName": "ヒーラー枠",
      "roleType": "スキル",
      "roleNeed": "充足",
      "searchStatus": "条件付き継続",
      "speciesGrade": null,
      "primaryMetric": "スキル発動PR",
      "primaryPR": 92.7,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 7.3,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 86.9,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "スキル発動PR",
          "pr": 92.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 78.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "スキル発動PR",
          "pr": 85.8,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 79.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "スキル発動PR",
          "pr": 83.5,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0018",
      "name": "ヨーギラス",
      "level": 15,
      "speciesKey": "larvitar",
      "targetSpeciesKey": "tyranitar",
      "targetSpeciesName": "バンギラス",
      "targetMainSkill": "げんきチャージS",
      "targetBerry": "ウイ",
      "skillLv": 1,
      "foods": [
        "あったかジンジャー",
        "あったかジンジャー",
        "ワカクサ大豆"
      ],
      "foodPattern": "AAB",
      "nature": "やんちゃ",
      "natureUp": "おてつだいスピード",
      "natureDown": "メインスキル発生確率",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップM"
        },
        {
          "lv": 25,
          "name": "食材確率アップM"
        },
        {
          "lv": 50,
          "name": "最大所持数アップS"
        },
        {
          "lv": 70,
          "name": "げんき回復ボーナス"
        },
        {
          "lv": 80,
          "name": "スキルレベルアップS"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 23,
      "stopLevel": 23,
      "priority": 10,
      "rationale": "AABジンジャー、Lv25食材M、速度↑性格。ポケスリシミュ食材PRはLv30 95 / Lv50 94 / Lv60 93.4。長期本命。",
      "dedicatedCandy": "可",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-014",
      "roleKey": "ginger",
      "roleName": "ジンジャー供給枠",
      "roleType": "食材",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": "A+",
      "primaryMetric": "食材PR",
      "primaryPR": 95,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 5,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 92,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "食材PR",
          "pr": 95,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 84.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "食材PR",
          "pr": 94,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 83.5,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "食材PR",
          "pr": 93.4,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0019",
      "name": "ワニノコ Lv11",
      "level": 11,
      "speciesKey": "totodile",
      "targetSpeciesKey": "feraligatr",
      "targetSpeciesName": "オーダイル",
      "targetMainSkill": "エナジーチャージS(ランダム)",
      "targetBerry": "オレン",
      "skillLv": 1,
      "foods": [
        "マメミート",
        "マメミート",
        "ピュアなオイル"
      ],
      "foodPattern": "AAB",
      "nature": "なまいき",
      "natureUp": "メインスキル発生確率",
      "natureDown": "EXP獲得量",
      "subskills": [
        {
          "lv": 10,
          "name": "最大所持数アップS"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 70,
          "name": "スキル確率アップM"
        },
        {
          "lv": 80,
          "name": "最大所持数アップM"
        }
      ],
      "quality": "A",
      "disposition": "キープ",
      "refinement": "継続",
      "targetLevel": 11,
      "stopLevel": 11,
      "priority": null,
      "rationale": "BFSなしだがLv25速度M＋Lv50速度Sで旧個体より良い。きのみPRはLv30 78 / Lv50 80.1。BFS探索を続け、現時点では資源投入しない。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-009",
      "roleKey": "berry_water",
      "roleName": "オレンのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "不足",
      "searchStatus": "継続",
      "speciesGrade": null,
      "primaryMetric": "きのみPR",
      "primaryPR": 78,
      "primaryPREvaluationLv": 30,
      "primaryPRTool": "ポケスリシミュ",
      "topPercent": 22,
      "measurements": [
        {
          "lv": 30,
          "metric": "総合PR",
          "pr": 68.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 30,
          "metric": "きのみPR",
          "pr": 78,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "総合PR",
          "pr": 67.6,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 50,
          "metric": "きのみPR",
          "pr": 80.1,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "総合PR",
          "pr": 67.7,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        },
        {
          "lv": 60,
          "metric": "きのみPR",
          "pr": 80,
          "tool": "ポケスリシミュ",
          "settings": "Investment projection; final-form at evaluation Lv; silver seed OFF; current nature/subskills/food fixed"
        }
      ]
    },
    {
      "id": "IND-0020",
      "name": "アブリー①",
      "level": 11,
      "speciesKey": "cutiefly",
      "targetSpeciesKey": "ribombee",
      "targetSpeciesName": "アブリボン",
      "targetMainSkill": "食材セレクトS",
      "targetBerry": "モモン",
      "skillLv": 1,
      "foods": [
        "あまいミツ",
        "あまいミツ",
        "ワカクサコーン"
      ],
      "foodPattern": "AAC",
      "nature": "やんちゃ",
      "natureUp": "おてつだいスピード",
      "natureDown": "メインスキル発生確率",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップM"
        },
        {
          "lv": 25,
          "name": "食材確率アップM"
        },
        {
          "lv": 50,
          "name": "ゆめのかけらボーナス"
        },
        {
          "lv": 70,
          "name": "スキル確率アップS"
        },
        {
          "lv": 80,
          "name": "食材確率アップS"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 25,
      "stopLevel": 25,
      "priority": 12,
      "rationale": "食材とくいで速度↑＋Lv25食材M。ミツAA。Lv10スキルMは本業外だが総合的に長期採用圏。",
      "dedicatedCandy": "可",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-016",
      "roleKey": "honey",
      "roleName": "あまいミツ専任枠",
      "roleType": "食材",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": "A",
      "primaryMetric": "食材PR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0021",
      "name": "アブリー②",
      "level": 11,
      "speciesKey": "cutiefly",
      "targetSpeciesKey": "ribombee",
      "targetSpeciesName": "アブリボン",
      "targetMainSkill": "食材セレクトS",
      "targetBerry": "モモン",
      "skillLv": 2,
      "foods": [
        "あまいミツ",
        "ピュアなオイル",
        "あまいミツ"
      ],
      "foodPattern": "ABA",
      "nature": "すなお",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "スキルレベルアップS"
        },
        {
          "lv": 25,
          "name": "食材確率アップM"
        },
        {
          "lv": 50,
          "name": "スキル確率アップM"
        },
        {
          "lv": 70,
          "name": "最大所持数アップL"
        },
        {
          "lv": 80,
          "name": "食材確率アップS"
        }
      ],
      "quality": "A",
      "disposition": "キープ",
      "refinement": "停止",
      "targetLevel": 11,
      "stopLevel": 11,
      "priority": null,
      "rationale": "Lv25食材Mは強いが速度補正なし。ミツ/オイル混合の控えとして保持し、①を優先。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-016",
      "roleKey": "honey",
      "roleName": "あまいミツ専任枠",
      "roleType": "食材",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": "A",
      "primaryMetric": "食材PR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0022",
      "name": "バケッチャ",
      "level": 12,
      "speciesKey": "pumpkaboo_giga",
      "targetSpeciesKey": "gourgeist_giga",
      "targetSpeciesName": "パンプジン（ギガだましゅ）",
      "targetMainSkill": "エナジーチャージS",
      "targetBerry": "ブリー",
      "skillLv": 1,
      "foods": [
        "ずっしりカボチャ",
        "ずっしりカボチャ",
        "ほっこりポテト"
      ],
      "foodPattern": "AAC",
      "nature": "すなお",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "食材確率アップM"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 50,
          "name": "最大所持数アップM"
        },
        {
          "lv": 70,
          "name": "食材確率アップS"
        },
        {
          "lv": 80,
          "name": "スキル確率アップS"
        }
      ],
      "quality": "A+",
      "disposition": "育成",
      "refinement": "停止",
      "targetLevel": 25,
      "stopLevel": 25,
      "priority": 11,
      "rationale": "食材M＋速度MがLv25までに揃う。AACカボチャ/ポテト。ギガだまで遅い点を考慮しSではなくA+。",
      "dedicatedCandy": "優先候補",
      "universalCandy": "条件付き",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-017",
      "roleKey": "pumpkin",
      "roleName": "ずっしりカボチャ専任枠",
      "roleType": "食材",
      "roleNeed": "育成待ち",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "食材PR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0023",
      "name": "メタモン",
      "level": 22,
      "speciesKey": "ditto",
      "targetSpeciesKey": "ditto",
      "targetSpeciesName": "メタモン",
      "targetMainSkill": "へんしん(スキルコピー)",
      "targetBerry": "キー",
      "skillLv": 1,
      "foods": [
        "ピュアなオイル",
        "ピュアなオイル",
        "ふといながねぎ"
      ],
      "foodPattern": "AAB",
      "nature": "おっとり",
      "natureUp": "食材おてつだい確率",
      "natureDown": "げんき回復量",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップM"
        },
        {
          "lv": 25,
          "name": "ゆめのかけらボーナス"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 70,
          "name": "スキルレベルアップS"
        },
        {
          "lv": 80,
          "name": "リサーチEXPボーナス"
        }
      ],
      "quality": "B",
      "disposition": "キープ",
      "refinement": "停止",
      "targetLevel": 22,
      "stopLevel": 22,
      "priority": null,
      "rationale": "食材↑性格とオイルAA＋ねぎは価値あり。ただしメタモン自体の食材収集性能は競合より低く、食材Mなし。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "条件付き",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-018",
      "roleKey": "oil_flexible",
      "roleName": "オイル/ねぎ柔軟枠",
      "roleType": "食材",
      "roleNeed": "条件付き充足",
      "searchStatus": "停止",
      "speciesGrade": null,
      "primaryMetric": "食材PR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0024",
      "name": "キュワワー",
      "level": 22,
      "speciesKey": "comfey",
      "targetSpeciesKey": "comfey",
      "targetSpeciesName": "キュワワー",
      "targetMainSkill": "げんきエールS",
      "targetBerry": "モモン",
      "skillLv": 2,
      "foods": [
        "ワカクサコーン",
        "ワカクサコーン",
        "リラックスカカオ"
      ],
      "foodPattern": "AAC",
      "nature": "いじっぱり",
      "natureUp": "おてつだいスピード",
      "natureDown": "食材おてつだい確率",
      "subskills": [
        {
          "lv": 10,
          "name": "スキルレベルアップS"
        },
        {
          "lv": 25,
          "name": "最大所持数アップS"
        },
        {
          "lv": 50,
          "name": "睡眠EXPボーナス"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 80,
          "name": "おてつだいスピードM"
        }
      ],
      "quality": "B",
      "disposition": "キープ",
      "refinement": "継続",
      "targetLevel": 22,
      "stopLevel": 22,
      "priority": null,
      "rationale": "AAコーンは役割価値あり。ただし食材↓性格＋食材確率サブなし。より良いコーン専任を探索。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-019",
      "roleKey": "corn",
      "roleName": "ワカクサコーン枠",
      "roleType": "食材",
      "roleNeed": "暫定充足",
      "searchStatus": "継続",
      "speciesGrade": "A",
      "primaryMetric": "食材PR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0025",
      "name": "ゴース",
      "level": 12,
      "speciesKey": "gastly",
      "targetSpeciesKey": "gengar",
      "targetSpeciesName": "ゲンガー",
      "targetMainSkill": "エナジーチャージS",
      "targetBerry": null,
      "skillLv": 1,
      "foods": [
        "げきからハーブ",
        "あじわいキノコ",
        "あじわいキノコ"
      ],
      "foodPattern": "ABB",
      "nature": "まじめ",
      "natureUp": "なし",
      "natureDown": "なし",
      "subskills": [
        {
          "lv": 10,
          "name": "スキル確率アップS"
        },
        {
          "lv": 25,
          "name": "げんき回復ボーナス"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 80,
          "name": "最大所持数アップS"
        }
      ],
      "quality": "B",
      "disposition": "キープ",
      "refinement": "継続",
      "targetLevel": 30,
      "stopLevel": 30,
      "priority": null,
      "rationale": "食材とくいだが食材確率補正なし。ABBキノコで役割空席を埋めるため保持。より良いキノコ個体は探索継続。",
      "dedicatedCandy": "条件付き",
      "universalCandy": "原則不可",
      "dreamShard": "可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-020",
      "roleKey": "mushroom",
      "roleName": "あじわいキノコ専任枠",
      "roleType": "食材",
      "roleNeed": "暫定充足",
      "searchStatus": "継続",
      "speciesGrade": "A",
      "primaryMetric": "食材PR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0026",
      "name": "ドードー",
      "level": 13,
      "speciesKey": "doduo",
      "targetSpeciesKey": "dodrio",
      "targetSpeciesName": "ドードリオ",
      "targetMainSkill": "げんきチャージS",
      "targetBerry": "シーヤ",
      "skillLv": 1,
      "foods": [
        "ワカクサ大豆",
        "ワカクサ大豆",
        "ワカクサ大豆"
      ],
      "foodPattern": "AAA",
      "nature": "やんちゃ",
      "natureUp": "おてつだいスピード",
      "natureDown": "メインスキル発生確率",
      "subskills": [
        {
          "lv": 10,
          "name": "食材確率アップM"
        },
        {
          "lv": 25,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 50,
          "name": "おてつだいスピードM"
        },
        {
          "lv": 70,
          "name": "ゆめのかけらボーナス"
        },
        {
          "lv": 80,
          "name": "最大所持数アップM"
        }
      ],
      "quality": "A",
      "disposition": "キープ",
      "refinement": "継続",
      "targetLevel": 23,
      "stopLevel": 23,
      "priority": null,
      "rationale": "きのみとくい。Lv25速度S・Lv50速度M＋速度↑性格は強いがBFSなし。準当たりとして保持しBFS探索継続。",
      "dedicatedCandy": "条件付き",
      "universalCandy": "不可",
      "dreamShard": "条件付き",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-021",
      "roleKey": "berry_flying",
      "roleName": "シーヤのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "暫定充足",
      "searchStatus": "継続",
      "speciesGrade": "A",
      "primaryMetric": "きのみPR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    },
    {
      "id": "IND-0027",
      "name": "ヒノアラシ",
      "level": 12,
      "speciesKey": "cyndaquil",
      "targetSpeciesKey": "typhlosion",
      "targetSpeciesName": "バクフーン",
      "targetMainSkill": "エナジーチャージS(ランダム)",
      "targetBerry": "ヒメリ",
      "skillLv": 1,
      "foods": [
        "あったかジンジャー",
        "げきからハーブ",
        "あったかジンジャー"
      ],
      "foodPattern": "ABA",
      "nature": "のうてんき",
      "natureUp": "げんき回復",
      "natureDown": "メインスキル発生確率",
      "subskills": [
        {
          "lv": 10,
          "name": "食材確率アップM"
        },
        {
          "lv": 25,
          "name": "おてつだいボーナス"
        },
        {
          "lv": 50,
          "name": "最大所持数アップM"
        },
        {
          "lv": 70,
          "name": "おてつだいスピードS"
        },
        {
          "lv": 80,
          "name": "食材確率アップS"
        }
      ],
      "quality": "C",
      "disposition": "キープ",
      "refinement": "継続",
      "targetLevel": 12,
      "stopLevel": 12,
      "priority": null,
      "rationale": "バクフーン種族は高価値だが個体はBFS/早期速度不足。トープ枠不足のため暫定保持し、上位個体取得時に交代。",
      "dedicatedCandy": "不可",
      "universalCandy": "不可",
      "dreamShard": "不可",
      "mainSeedCap": 0,
      "silverSeedPolicy": "不要",
      "roleId": "ROLE-022",
      "roleKey": "berry_fire",
      "roleName": "ヒメリのみ・きのみ枠",
      "roleType": "きのみ",
      "roleNeed": "不足",
      "searchStatus": "継続",
      "speciesGrade": "A+",
      "primaryMetric": "きのみPR",
      "primaryPR": null,
      "primaryPREvaluationLv": null,
      "primaryPRTool": null,
      "topPercent": null,
      "measurements": []
    }
  ],
  "roles": [
    {
      "id": "ROLE-001",
      "key": "healer",
      "name": "ヒーラー枠",
      "type": "スキル",
      "need": "充足",
      "search": "条件付き継続",
      "priority": "高",
      "incumbent": "IND-0002",
      "backup": "IND-0017",
      "upgradeTargetSpecies": "gardevoir",
      "gap": "中",
      "note": "プクリンは完成度高。パモは良個体だが更新にはならない。将来サーナイト良個体は評価継続。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-002",
      "key": "milk_cacao_mixed",
      "name": "ミルク/カカオ混合供給枠",
      "type": "食材",
      "need": "育成待ち",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0003",
      "backup": null,
      "upgradeTargetSpecies": "blastoise",
      "gap": "小",
      "note": "カメールABC。睡眠EXPでLv30へ。ミルク専任・カカオ専任とは別スロットで扱う。",
      "ingredientTargets": [
        "モーモーミルク",
        "リラックスカカオ"
      ]
    },
    {
      "id": "ROLE-003",
      "key": "berry_yache",
      "name": "ヤチェのみ・きのみ枠",
      "type": "きのみ",
      "need": "充足",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0001",
      "backup": null,
      "upgradeTargetSpecies": null,
      "gap": "小",
      "note": "BFS＋おてボ個体で当面更新不要。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-004",
      "key": "apple",
      "name": "リンゴ供給枠",
      "type": "食材",
      "need": "充足予定",
      "search": "停止",
      "priority": "高",
      "incumbent": "IND-0006",
      "backup": null,
      "upgradeTargetSpecies": "skeledirge",
      "gap": "小",
      "note": "AAAリンゴのホゲータを育成。Lv30を第一節目。",
      "ingredientTargets": [
        "とくせんリンゴ"
      ]
    },
    {
      "id": "ROLE-005",
      "key": "potato",
      "name": "ポテト供給枠",
      "type": "食材",
      "need": "充足",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0008",
      "backup": null,
      "upgradeTargetSpecies": "meowscarada",
      "gap": "小",
      "note": "AAAポテト＋食材M＋おてボ。追加探索不要。",
      "ingredientTargets": [
        "ほっこりポテト"
      ]
    },
    {
      "id": "ROLE-006",
      "key": "direct_energy",
      "name": "直接エナジー・スキル枠",
      "type": "スキル",
      "need": "育成待ち",
      "search": "停止",
      "priority": "高",
      "incumbent": "IND-0010",
      "backup": null,
      "upgradeTargetSpecies": "ampharos",
      "gap": "小",
      "note": "メリープ個体のスキル素質が高く、まずデンリュウまで育成。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-007",
      "key": "berry_psychic",
      "name": "マゴのみ・きのみ枠",
      "type": "きのみ",
      "need": "不足",
      "search": "継続",
      "priority": "中",
      "incumbent": null,
      "backup": "IND-0007",
      "upgradeTargetSpecies": "xatu",
      "gap": "中",
      "note": "現ネイティは速度型の良個体だがBFSなし。BFS個体を探索継続。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-008",
      "key": "cacao_specialist",
      "name": "カカオ専任枠",
      "type": "食材",
      "need": "育成待ち",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0013",
      "backup": "IND-0003",
      "upgradeTargetSpecies": "clodsire",
      "gap": "小",
      "note": "パルデアウパーAABを専任候補。カメールは混合供給のバックアップ。",
      "ingredientTargets": [
        "リラックスカカオ"
      ]
    },
    {
      "id": "ROLE-009",
      "key": "berry_water",
      "name": "オレンのみ・きのみ枠",
      "type": "きのみ",
      "need": "不足",
      "search": "継続",
      "priority": "中",
      "incumbent": null,
      "backup": "IND-0019",
      "upgradeTargetSpecies": "feraligatr",
      "gap": "大",
      "note": "旧Lv19ワニノコはアメ化候補。新Lv11個体は速度M/Sで暫定候補だがBFSなしのため探索継続。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-010",
      "key": "cooking_pot",
      "name": "鍋拡張・料理パワーアップ枠",
      "type": "スキル",
      "need": "充足",
      "search": "停止",
      "priority": "低",
      "incumbent": "IND-0009",
      "backup": "IND-0012",
      "upgradeTargetSpecies": "magnezone",
      "gap": "小",
      "note": "ミュウ現スキルとコイルLv14を保持。追加厳選の緊急性は低い。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-011",
      "key": "meat",
      "name": "マメミート供給枠",
      "type": "食材",
      "need": "未確認",
      "search": "未確認",
      "priority": "低",
      "incumbent": null,
      "backup": "IND-0015",
      "upgradeTargetSpecies": "charizard",
      "gap": null,
      "note": "主力料理・食材ボトルネック未確認。ヒトカゲはキープのみ。",
      "ingredientTargets": [
        "マメミート"
      ]
    },
    {
      "id": "ROLE-012",
      "key": "berry_steel",
      "name": "ベリブのみ・きのみ枠",
      "type": "きのみ",
      "need": "不足",
      "search": "条件付き継続",
      "priority": "低",
      "incumbent": null,
      "backup": "IND-0016",
      "upgradeTargetSpecies": "empoleon",
      "gap": "中",
      "note": "現ポッチャマはBFSなし。役割需要が高まる場合のみ追加探索。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-013",
      "key": "psychic_zone",
      "name": "エスパー/マゴのみゾーン枠",
      "type": "スキル",
      "need": "候補運用",
      "search": "条件付き継続",
      "priority": "中",
      "incumbent": "IND-0005",
      "backup": null,
      "upgradeTargetSpecies": "mewtwo",
      "gap": "中",
      "note": "既評価ミュウツーを育成候補。2体目以降の厳選コストは未確認。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-014",
      "key": "ginger",
      "name": "ジンジャー供給枠",
      "type": "食材",
      "need": "育成待ち",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0018",
      "backup": null,
      "upgradeTargetSpecies": "tyranitar",
      "gap": "小",
      "note": "AABジンジャー＋食材M＋速度↑性格。おひるね島で長期育成。",
      "ingredientTargets": [
        "あったかジンジャー"
      ]
    },
    {
      "id": "ROLE-015",
      "key": "milk_specialist",
      "name": "ミルク専任枠",
      "type": "食材",
      "need": "充足",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0004",
      "backup": "IND-0003",
      "upgradeTargetSpecies": "blastoise",
      "gap": "小",
      "note": "カメックスLv30到達。ミルク専任の第一完成ライン。Lv50食材Mは長期自然育成。",
      "ingredientTargets": [
        "モーモーミルク"
      ]
    },
    {
      "id": "ROLE-016",
      "key": "honey",
      "name": "あまいミツ専任枠",
      "type": "食材",
      "need": "育成待ち",
      "search": "停止",
      "priority": "中",
      "incumbent": "IND-0020",
      "backup": "IND-0021",
      "upgradeTargetSpecies": "ribombee",
      "gap": "小",
      "note": "①は速度↑＋Lv25食材M＋AAミツ。②はオイル混合の控え。",
      "ingredientTargets": [
        "あまいミツ"
      ]
    },
    {
      "id": "ROLE-017",
      "key": "pumpkin",
      "name": "ずっしりカボチャ専任枠",
      "type": "食材",
      "need": "育成待ち",
      "search": "停止",
      "priority": "高",
      "incumbent": "IND-0022",
      "backup": null,
      "upgradeTargetSpecies": "gourgeist_giga",
      "gap": "小",
      "note": "Lv10食材M＋Lv25速度M。新高エナジー食材の主力候補。",
      "ingredientTargets": [
        "ずっしりカボチャ"
      ]
    },
    {
      "id": "ROLE-018",
      "key": "oil_flexible",
      "name": "オイル/ねぎ柔軟枠",
      "type": "食材",
      "need": "条件付き充足",
      "search": "停止",
      "priority": "低",
      "incumbent": "IND-0023",
      "backup": "IND-0021",
      "upgradeTargetSpecies": "ditto",
      "gap": "中",
      "note": "メタモンはオイルAA＋Lv60ねぎ。アブリー②もLv30オイルで補助可能。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-019",
      "key": "corn",
      "name": "ワカクサコーン枠",
      "type": "食材",
      "need": "暫定充足",
      "search": "継続",
      "priority": "中",
      "incumbent": "IND-0024",
      "backup": null,
      "upgradeTargetSpecies": "bewear",
      "gap": "中",
      "note": "AAコーンだが食材↓性格。より良いコーン専任が来るまで暫定保持。",
      "ingredientTargets": [
        "ワカクサコーン"
      ]
    },
    {
      "id": "ROLE-020",
      "key": "mushroom",
      "name": "あじわいキノコ専任枠",
      "type": "食材",
      "need": "暫定充足",
      "search": "継続",
      "priority": "高",
      "incumbent": "IND-0025",
      "backup": null,
      "upgradeTargetSpecies": "gengar",
      "gap": "中",
      "note": "ABBゴースを暫定担当。食材M等の上位個体は更新候補。",
      "ingredientTargets": [
        "あじわいキノコ"
      ]
    },
    {
      "id": "ROLE-021",
      "key": "berry_flying",
      "name": "シーヤのみ・きのみ枠",
      "type": "きのみ",
      "need": "暫定充足",
      "search": "継続",
      "priority": "中",
      "incumbent": "IND-0026",
      "backup": null,
      "upgradeTargetSpecies": "dodrio",
      "gap": "中",
      "note": "速度型ドードーを暫定担当。BFS個体を探索継続。",
      "ingredientTargets": []
    },
    {
      "id": "ROLE-022",
      "key": "berry_fire",
      "name": "ヒメリのみ・きのみ枠",
      "type": "きのみ",
      "need": "不足",
      "search": "継続",
      "priority": "高",
      "incumbent": null,
      "backup": "IND-0027",
      "upgradeTargetSpecies": "typhlosion",
      "gap": "大",
      "note": "ヒノアラシは種族価値高いが個体は弱め。BFS/速度個体を優先探索。",
      "ingredientTargets": []
    }
  ],
  "events": [
    {
      "id": "cooking-week-v3",
      "name": "デカ盛り！料理ウィーク vol.3",
      "start": "2026-10-05T04:00:00+09:00",
      "end": "2026-10-12T03:59:00+09:00",
      "kind": "料理・食材",
      "miniCandyBoost": true,
      "summary": "食材得意+1、鍋2倍（日曜4倍）、料理最終エナジー1.25倍。ミニアメブーストはEXP2倍・ゆめのかけら4倍・1日50アメまで。",
      "source": "https://www.pokemonsleep.net/news/343430323735323935393230393739393731/"
    },
    {
      "id": "growth-week-v6",
      "name": "ポケモンすくすくウィーク vol.6",
      "start": "2026-10-12T04:00:00+09:00",
      "end": "2026-10-19T03:59:00+09:00",
      "kind": "育成",
      "miniCandyBoost": false,
      "summary": "睡眠EXP1.5倍、1日1回目の睡眠リサーチのアメ獲得量1.5倍。",
      "source": "https://www.pokemonsleep.net/news/343430333034343435373637353438393336/"
    },
    {
      "id": "new-moon-18",
      "name": "第18回ニュームーンデー",
      "start": "2026-10-10T04:00:00+09:00",
      "end": "2026-10-13T03:59:00+09:00",
      "kind": "リサーチ",
      "miniCandyBoost": false,
      "summary": "10/11新月。幻のポケモン特別ピックアップ、満腹になりづらい等。料理ウィーク末尾〜すくすく初日に重なる。",
      "source": "https://www.pokemonsleep.net/news/343430323833353239363833363634383937/"
    }
  ],
  "resourcePlan": [
    {
      "individualId": "IND-0003",
      "name": "カメール",
      "level": 19,
      "targetLevel": 30,
      "quality": "A+",
      "roleName": "ミルク/カカオ混合供給枠",
      "priority": 2,
      "channels": [
        "専用アメ: 後回し（睡眠EXP中心）"
      ],
      "reason": "個体品質は高いが役割は混合供給。共有ゼニガメ系アメはミルク専任IND-0004を優先し、IND-0003は睡眠EXPでLv30へ。"
    },
    {
      "individualId": "IND-0006",
      "name": "アチゲータ",
      "level": 25,
      "targetLevel": 30,
      "quality": "A",
      "roleName": "リンゴ供給枠",
      "priority": 3,
      "channels": [
        "専用アメ: 優先",
        "ばんのうアメ: 条件付き"
      ],
      "reason": "アチゲータLv25。おてスピM解禁済み。次はLv27ラウドボーン→Lv30リンゴ×5。不足分のみ万能アメ候補。"
    },
    {
      "individualId": "IND-0010",
      "name": "モココ",
      "level": 23,
      "targetLevel": 30,
      "quality": "A+",
      "roleName": "直接エナジー・スキル枠",
      "priority": 4,
      "channels": [
        "専用アメ: 優先",
        "ばんのうアメ: 条件付き"
      ],
      "reason": "モココLv23で進化レベル条件達成。専用アメ16のため進化に64個不足。万能アメ最優先でデンリュウ化、その後Lv30へ。"
    },
    {
      "individualId": "IND-0005",
      "name": "ミュウツー",
      "level": 27,
      "targetLevel": 30,
      "quality": "A+",
      "roleName": "エスパー/マゴのみゾーン枠",
      "priority": 5,
      "channels": [
        "専用アメ: 可",
        "ばんのうアメ: 条件付き"
      ],
      "reason": "固定初期個体として実用性高。Lv50スキルPR94.0。金種は他候補比較後。"
    },
    {
      "individualId": "IND-0013",
      "name": "パルデアウパー",
      "level": 12,
      "targetLevel": 30,
      "quality": "A+",
      "roleName": "カカオ専任枠",
      "priority": 6,
      "channels": [
        "専用アメ: 可"
      ],
      "reason": "カカオAA＋食材↑性格＋Lv50食材M。カカオ専任としてLv30/50を段階投資。混合カメールとは別役割。"
    },
    {
      "individualId": "IND-0001",
      "name": "チルタリス",
      "level": 36,
      "targetLevel": 50,
      "quality": "S",
      "roleName": "ヤチェのみ・きのみ枠",
      "priority": 7,
      "channels": [
        "専用アメ: 可"
      ],
      "reason": "BFS＋おてボがLv25までに完成。役割スロットも充足。急ぎ投資は不要。"
    },
    {
      "individualId": "IND-0008",
      "name": "マスカーニャ",
      "level": 31,
      "targetLevel": 50,
      "quality": "S",
      "roleName": "ポテト供給枠",
      "priority": 8,
      "channels": [
        "専用アメ: 可"
      ],
      "reason": "AAAポテト＋食材M＋おてボ、Lv50速度M。役割個体として完成度高い。"
    },
    {
      "individualId": "IND-0018",
      "name": "ヨーギラス",
      "level": 15,
      "targetLevel": 23,
      "quality": "A+",
      "roleName": "ジンジャー供給枠",
      "priority": 10,
      "channels": [
        "専用アメ: 可"
      ],
      "reason": "AABジンジャー、Lv25食材M、速度↑性格。ポケスリシミュ食材PRはLv30 95 / Lv50 94 / Lv60 93.4。長期本命。"
    },
    {
      "individualId": "IND-0022",
      "name": "バケッチャ",
      "level": 12,
      "targetLevel": 25,
      "quality": "A+",
      "roleName": "ずっしりカボチャ専任枠",
      "priority": 11,
      "channels": [
        "専用アメ: 優先候補",
        "ばんのうアメ: 条件付き"
      ],
      "reason": "食材M＋速度MがLv25までに揃う。AACカボチャ/ポテト。ギガだまで遅い点を考慮しSではなくA+。"
    },
    {
      "individualId": "IND-0020",
      "name": "アブリー①",
      "level": 11,
      "targetLevel": 25,
      "quality": "A+",
      "roleName": "あまいミツ専任枠",
      "priority": 12,
      "channels": [
        "専用アメ: 可"
      ],
      "reason": "食材とくいで速度↑＋Lv25食材M。ミツAA。Lv10スキルMは本業外だが総合的に長期採用圏。"
    }
  ]
};
