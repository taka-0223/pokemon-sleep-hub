# メインスキルのたね評価データ契約 v1

モデル版：`seed-v1`。データ形式：`1.0`。

## 判断を分離する

種族の定性的な投資候補優先度、個体・役割ごとの候補優先度、具体的な投入判断を別々に扱う。Tierは定量ROIの順位でも使用承認でもない。既存の種族Tier、個体品質、PR、`main_seed_cap` を金種評価へ自動転記しない。

`seed-data.js` は非公開CURRENTから生成する読み取り専用の入力データで、`data.js` を書き換えない。公開側は両者の `sourceRevision` と `sourceSha256` が一致することを確認してから使用する。別revision、別の元ファイル、モデル版不一致は現在の投入判断に混ぜない。

生成方法：

```bash
python3 scripts/build_seed_data.py /private/pokemon_sleep_decision_system_CURRENT_r37.xlsx seed-data.js
python3 -m unittest discover -s tests -p 'test_seed_data.py' -v
```

元のExcelは公開リポジトリへコミットしない。CURRENT全体は既存生成器、種評価はこの追加生成器から出力し、同じ元ファイルのrevisionとSHA256で接続する。片方の生成成功だけで全体の同期成功とは扱わない。

## 既存シートから読む事実

| シート | 主キー・利用列 | 意味 |
|---|---|---|
| P_Individuals | individual_id / active / current_species_key / target_species_key / level / main_skill_lv / remaining_evolutions / sub_N / source_type / source_note | 現在の事実。現在SLvには未実行の進化・サブスキル解放を加算しない |
| M_Species | species_key / main_skill | 現在種のスキル。将来種のスキルを現状へ流用しない |
| P_Account | snapshot_id / snapshot_date / category / key / value_num / value_text / certainty / source / note | main_skill_seed資源だけを抽出。日付と確実性を保持 |
| S_Scenarios | scenario_id / individual_id / role_slot_id / scenario_name / target_level / target_main_skill_lv / main_seed_count / status / review_date / note | 既存シナリオ。新モデルによる推奨には自動移行しない |
| D_Decisions | decision_id / individual_id / role_slot_id ＋下記seed列 | 個体・役割に限定した新たな種評価 |

未知の数値は `null`。確定した0は0。負数、整数ではないレベル・個数、ID重複、不明な個体参照は生成を停止する。退役個体とその旧シナリオは公開候補から除外し、除外件数をmetaに保持する。

資源のID検査は今回出力する `main_skill_seed` の行に限定する。無関係な資源の既存不整合はこのモジュールで修正せず、種評価の欠損に読み替えない。

対応するスキル名とkeyは次の完全一致のみ。未知・複合スキルは `mainSkillKey:null` とし、元の名前を `mainSkillName` に保持する。

| M_Species.main_skill | key |
|---|---|
| げんきオールS | energy_for_everyone_s |
| エナジーチャージM | charge_strength_m |
| 料理パワーアップS | cooking_power_up_s |
| 料理チャンスS | tasty_chance_s |

## 新シート M_SeedTier

1行を「種族 × スキル × 比較プロファイル」の評価とする。同じキーの二重登録は拒否する。

```text
seed_tier_id,species_key,main_skill_key,benchmark_id,tier,assessment_status,applicability,rationale,evidence_type,source_url,review_date,game_data_version,model_version,conditions,benchmark_description
```

- `seed_tier_id`：一意な評価ID。
- `species_key`：M_Speciesに存在するキー。
- `main_skill_key`：上記key。種族の現在スキルとの対応を検証する。
- `benchmark_id`：比較条件の識別子。初期定性評価は `seed-qualitative-v1`。
- `tier`：`S / A+ / A / B / C`、または未評価の空欄。未評価をCにしない。
- `assessment_status`：`validated / provisional / unassessed / stale`。初期の定性候補は `provisional`。
- `applicability`：`broad / conditional / not_applicable / unknown`。条件の有無と評価状態を分離する。
- `rationale`：評価理由。種族の総合性能ではなく、種投資候補としての理由。
- `evidence_type`：例 `qualitative_review`。実測値と定性判断を混ぜない。
- `source_url`：根拠となる参照先。なければ空欄とし、架空のURLを補わない。
- `review_date`：評価日 `YYYY-MM-DD`。
- `game_data_version`：参照したゲームデータ版。
- `model_version`：`seed-v1`。異なる版の評価は出力時に `stale` とする。
- `conditions`：成立条件を文章で記載。
- `benchmark_description`：共通の比較条件と、比較していない点。

Tierを付けた行は `benchmark_id / rationale / review_date / evidence_type / model_version` を必須とする。シート自体がない場合は `speciesAssessments:[]` と `speciesTierSheetPresent:false` を出し、一般Tierで補完しない。

## D_Decisionsの追加列

```text
seed_account_tier,seed_assessment_status,seed_applicability,seed_rationale,seed_review_date,seed_benchmark_id,seed_evidence_type,seed_model_version,seed_game_data_version
```

列の意味・許可値は M_SeedTier と同じ。対象範囲は同じ行の `individual_id × role_slot_id`。新列がなければ個体ごとに `tier:null / status:unassessed / applicability:unknown` を出力する。一般の `individual_quality`、`priority_rank`、`main_seed_cap` は参照しない。

`seed_game_data_version` は評価時の効果表データ版。初期版は `seed-effects-2026-11-01-v1`。M_SeedTierの `game_data_version` とともに評価のversionsへ保持する。欠損や不一致を現在版として補完しない。

出力metaの `gameDataVersion` はこのモデルが対象とする効果表版 `seed-effects-2026-11-01-v1`。公式ゲームアプリ版ではない。各評価の原記録の版とは別に保持し、評価行の欠損をmetaから埋めない。r37の `APP_DATA.meta.gameDataVersion` とも照合する。

この初期契約は具体的な使用承認をD_Decisionsから生成しない。投入推奨は比較シナリオ、実行時の情報確認、明示的な推奨根拠を別に備えた場合に限る。

## 旧シナリオと参考計算

既存S_Scenariosの `approved` や `executed` は元のシナリオの状態として `legacyStatus` に保存する。新しい種モデルの `status` は常に `legacy_proposal`、`recommended:false` とし、`recommendation` は出力しない。

既存 `main_seed_count` は `seeds` という出典値であり、新たな推奨個数ではない。投入タイミングは元データに明示されていないため `timing:null / sourceTimingKnown:false`。UIが「現在SLvからの参考計算」を見せる場合に限り、別の比較シナリオとして `timing:now` を明示的に選ぶ。

進化やスキルLvサブスキルの将来上昇を、今使う種の必要数から先取り控除してはいけない。前提を完了した後のケースは、前提完了後の実際のSLvか明示的な将来シナリオとして扱う。

## 資源の履歴と現在性

P_Accountは観測日の新しい行を採用する。同日なら後の行を採用する。日付のない行を新しい観測と推測しない。

- `certainty:confirmed` の数値だけを `value` に出す。
- `approx / inferred / unknown` 等は `value:null`。元の数値は `reportedValue` に保持し、確定予算にしない。
- 確定した古い観測も現在の在庫を保証しない。`observedAt` を保持するが、`confirmed_current:true` は生成しない。
- このモジュールは資源を予約・消費しない。

## 出力オブジェクト

`window.SEED_INVESTMENT_DATA` に次を出力する。

| フィールド | 内容 |
|---|---|
| meta | schemaVersion / modelVersion / sourceRevision / sourceSha256 / sourceFile / generatedAt / assessmentMode / 件数 |
| individuals | 現役個体、現在種・将来種、現在SLv、残進化、サブスキル、個体種評価、出典、versions |
| speciesAssessments | M_SeedTier評価、条件、比較プロファイル、ゲームデータ版、出典 |
| scenarios | 新モデルでは未承認の旧シナリオ |
| resources.mainSkillSeed | 数値・元の申告値・確実性・観測日・出典 |

各個体・シナリオに `versions:{sourceRevision,modelVersion}` を付ける。初期の `assessmentMode` は `qualitative_priority` で、定量的な増分エナジーやROIを意味しない。

## 受入条件

1. 同じCURRENTから同じsidecarが生成される。
2. CURRENTとAppが違うrevisionまたは元ファイルハッシュのときは現行結果へ混ぜない。
3. 未評価、暫定、モデル未算出、資源不足、評価済み低Tierを区別する。
4. 既存Tier・PR・金種上限から新しい使用承認が発生しない。
5. 現在SLv、進化後SLv、サブスキルの将来上昇、旧シナリオ個数を混同しない。
6. 不明数値はnull、確定した0は0、約8個は確定8個にしない。
7. 不活性個体、孤立した参照、重複IDを候補へ入れない。
8. 全データの作成日と、個々の資源・評価の観測日を区別する。

## 既存生成系との接続

`build_r36_snapshot.py` は監査した `2026-10-25-r36` と `2026-11-01-r37` だけを受け入れる。未対応の将来revisionを旧モデルのメタデータで出力しない。

| CURRENT | schemaVersion | appVersion | modelVersion | seedModelVersion |
|---|---|---|---|---|
| 2026-10-25-r36 | 1.2 | 0.20 | r36 | なし |
| 2026-11-01-r37 | 1.3 | 0.21 | r36+seed-v1 | seed-v1 |

どちらも既存の35現役・8退役・33RoleSlot・47Coverage・63種族役割評価を維持する。種族の金種評価は別表なので、既存63件に混ぜない。既存D_Decisionsの判断日を新ファイルの日付で上書きせず、種評価には専用の評価日を持つ。

`check_r36_public.py` は指定manifestのrevision、source SHA256、data blob、schema/model/app版、判断日を照合する。r37には `schema_version / app_version / model_version / seed_model_version / game_data_version / decision_date` を明示する。r36の既存manifestに限り旧メタデータ既定値を認める。既存の件数、未測定値、退役参照、Phase 6暫定表示、測定履歴の検査は維持する。

再生成に必要な既存生成器の修正は以下に限定する。

- `P_Individuals.current_species_key` を `currentSpeciesKey` として出す。
- `coverage` 内のRoleSlotは料理・投資情報を付けた最終 `roles` から再構築し、表示別のコピーが古くならないようにする。
- 旧 `main_seed_cap` は公開UIとの互換のため文字列のまま保持するが、種モデルの推奨個数にはしない。
- CURRENTで不明のshiny空欄は `null` のまま出す。既存公開のIND-0041・0042・0043のfalseは原記録を根拠にしていないため維持しない。

## 原記録の既知の不足

r36には現在種crocalor、pupitar、pichuのM_Speciesレコードがない。この場合は原記録の現在種キーを保持し、スキルkey・名前をnull、sourceIssuesを `CURRENT_SPECIES_NOT_IN_MASTER` として出す。将来種のスキルで補完しない。新たなM_SeedTierの不正な種族参照とは区別する。
