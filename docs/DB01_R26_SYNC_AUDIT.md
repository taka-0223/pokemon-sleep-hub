# DB更新01｜CURRENT r26 → PWAの同期監査（2026-10-20）

## 同期の権限と状態

- 非公開SSOT：`pokemon_sleep_decision_system_CURRENT_r26.xlsx`／`2026-10-20-r26`／有効40個体
- 公開main比較元：`16c5d7f67762c06607e27318444ab51cf5c33ae5`／`data.js`は`2026-10-15-r23`、38個体
- **このPRにr26の`data.js`やCURRENT原本は含めない。** 既存評価の差分が未承認のため、更新公開を意図的に止める。
- 新機能・料理Phase 6・種族Tier再設計・博士送り判断は対象外。

## 再現結果

`python3 scripts/build_data.py /private/CURRENT_r26.xlsx /tmp/data-r26.js`。

| 指標 | 公開r23 | 旧buildのr26 | 修正buildのr26 |
| --- | ---: | ---: | ---: |
| 有効個体 | 38 | 40 | 40 |
| 主要PRを表示できる個体 | 36 | 27 | 27 |
| RoleSlot | 33 | 33 | 33 |
| Coverage行 | 47 | 47 | 47 |
| Resources | 17 | 0 | 15 |

## 根本原因

1. **Resources消失**：CURRENT `P_Account`の実列は`key/value_num/value_text`。旧builderは`account_key`を必須列としていたため0行になっていた。修正後は日時順の台帳から資源・状態・イベントの同名キーの最終行を採用する。`value_num==0`は数値0、空欄はnull。私的な友好度・別領域の管理行は公開しない。
2. **測定値54件の消失**：`IND-0020`〜`IND-0028`は公開r23に各6件のPR測定記録があり、CURRENT r23/r25/r26の`L_Measurements`には1件も無い。公開r13の2026-10-04コミット`4849943b`等の公開履歴で出自を追跡できるが、正本への正式な再採録は承認待ち。公開値からCURRENTへ自動逆流させない。
3. **17→15の残差**：`larvitar_candy`および`paldean_wooper_candy`は公開r23にあるが、r26の`P_Account`には無い。値を推測で戻さない。
4. **Species Tier / 育成優先順位**：公開r23とCURRENTの`M_SpeciesAssessment`・`D_Decisions`等の導出結果に元から相違。事前監査で個体16件の`speciesGrade`と13件の`priority`が変わることを確認。既存評価をbuilderで合わせ込まない。
5. **計算条件の混在**：`IND-0005`の`L_Measurements`に「銀のたねOFF」の既存測定6件と、ONの「Investment scenario」3件が共存。旧buildは両者を個体詳細の測定履歴へ混在させていた。修正後はシナリオ行を個体の正式測定履歴から除外するが、CURRENT内の数値そのものは変更しない。過去PRのOFF記載と再現計算結果の食い違いは未解決。
6. **その他事実衝突**：mainSkillLv等にも公開版とCURRENTの相違がある。正しさは公開値だけから推定できない。

## 変更したもの

- `scripts/build_data.py`：列対応・スナップショット形式・シナリオ除外の最小修正。
- `scripts/check_data_sync.py`：公開前の差分チェック。既存PR/測定消失、キー/RoleSlot/Coverage欠損、無承認評価変化を**失敗扱い**にする。変更を許す場合、比較元ハッシュ・CURRENTハッシュ・revision・具体的なbefore/after・出典を列挙するレビュー済みmanifestが必要。
- `tests/test_data_sync.py`：原本を公開せず合成データで、欠測/null/0、決定論的ビルド、PR/Role/資源消失、明示承認を検証。
- `.github/workflows/data-sync-guard.yml`：PR・mainへのpush時、旧データと比較して失敗ならCIを失敗させる。

## 次の承認が必要な事項

- 公開済み9匹・54件の元測定を原本/実行条件/出典とともにCURRENTへ移行する判断。
- 公開r23とCURRENTで異なるTier・優先順位・RoleSlot状態・メインスキルLvの各承認差分。
- 資源キー2件が実際のCURRENTで欠測な理由と今後の保存方針。
- PR計算で銀のたねON/OFFを正式に採用する条件。暫定数値は未採用。
- 安全なr26生成物・承認manifestを用意した後、**別途ユーザーがmainマージ・本番公開を承認する。**

このPRのCIチェックは、未承認公開への**警告とマージ前ゲート**として機能する。GitHub Pagesがmainへの直接push時に独立して実行される構成では、CIの失敗だけで配信停止を技術的に保証できない。直接mainにデータ更新をpushしない運用と、必要ならbranch protectionで必須チェックを設定する運用を併用すること。

## 継続監査：r28→r29（2026-10-20 JST）

このセクションの最新SSOTは、ライブラリ `/ゲーム：ポケモンスリープ/pokemon_sleep_decision_system_CURRENT_r29.xlsx`。上のr26は過去の再現基準であり、最新正本ではない。

- r28で `M_Rules!J3 = 2026-10-20-r28`、`DATA_REVISION`（D19）=`2026-10-20-r26`、最終ログ=`2026-10-20-r28` が不一致。
- r29では `M_Rules!J3` と `D19` を `2026-10-20-r29` に統一し、`LOG-105` を追記。
- 変更前後の実ファイル全セル照合で、変更は上記2セル＋追記6セルの**合計8セルのみ**。既存165測定・42個体登録（有効41）・33 RoleSlot・47 Coverage・判断・資源の内容は変更せず。
- 既存`build_data.py`では不整合ブックを生成できたため、`verify_versioned_source_revision()`を追加。バージョン付きCURRENTでは「ファイル名・表示revision・DATA_REVISION・最新変更履歴」の一致を確認し、不一致なら出力前に例外停止。
- 不整合のあるr28で生成を試すと`ValueError: CURRENT revision mismatch`、新r29では正常に生成。合成単体テストは**16件成功**。最新ブランチでのCIはGitHub Actions結果を参照。
- r29候補データは、**有効41個体、主要PR27、RoleSlot33、Coverage47、資源16キー**。バイト同一の再生成を確認。**正式公開用ではない**。
- 公開r23との再照合では、Tier差分16個体、優先順位差分13個体、PR消失9個体、資源キー2件不足、役割マスター33件に何らかの配信フィールド差分がある。RoleSlotのIDは33件すべて保持。これらの差分は有効性を自動判定していないため、未承認のまま残す。

### 歴史的PR54件の測定条件に関する追加根拠

- 保存ワークフロー`37199678249`の元スクリプトは`tmpEvaluate.silverSeed`が存在すると各キーを`false`にして保存後リロードしている。
- 測定日以前（2026-09-29）の上流シミュレータ`733701bbe6a625241c7701e76d830e0d8ff68c64`のソースでは、`default-config.ts`が銀種既定`true`と`tmpEvaluate`複製を設定、`models/config.ts`が`watchEffect`から`config.save()`により`localStorage.config`を保持。元スクリプトの設定変更・再読込の経路が成立する蓋然性は高い。
- ただし実行時にOFFの全設定を再読取したログ、上流の正確な配信ビルドSHAは残っていない。原本が`silverSeed:false`と記録した**測定結果54件の存在・値・入力個体との一致は確定**できるが、現行正式PR計算条件への完全互換・正式採用は依然として未承認。
- 元の測定値を`L_Measurements`へ自動追記せず、レビュー用候補JSONをライブラリに保管。公開`data.js`からの逆流・ゼロ補完・既存PR再計算は実施していない。

### 保留の解除条件

1. 54件のhistoricalPRが旧公開値であることと、正式PRとして保持する際の条件表記・ユーザー承認を一致させる。
2. 公開版とCURRENTの種族Tier・優先順位・役割変更の根拠を照合し、意図した差分だけ許可する。
3. 資源2キーの欠測と最新値／スナップショットの扱いを決める。未確認数値を0で埋めない。
4. 最新CURRENTを基に検証・承認manifestを作り、fail-closedゲートPASS後にPR→別途ユーザー承認→mainマージ→公開画面検証。


## 2026-10-20 継続監査：r23公開スナップショットに由来する分岐

**比較の再現：** 非公開CURRENT r23とr29から、同じ修正済み`build_data.py`で別ファイルへドライラン生成。r23再生成は有効38件／主指標PR27件、r29再生成は41件／PR27件。**既存個体のSpecies Tier・priority_rank・主指標PRには両者間で差がない**。したがって公開r23のTier16件・順位13件・PR9件の相違は、r24〜r29の更新によって新たに生じたものではない。

**直接上書きの証拠：** 2026-10-04のGitHub履歴 [one-time public snapshot patch](https://github.com/taka-0223/pokemon-sleep-hub/blob/61ff6a7b1b1711e753e043f69b9f4f470dcf7589/scripts/apply_r13_snapshot.py) において、当時の公開`data.js`へ直接「9個体×6＝54 PR値」「12個体のSpecies Tier」「13 RoleSlotの候補表示」を投入した。現在のTier相違16個体のうち11個体はこの12件の上書き対象と一致する。残る5件および順位13件の個別の上書き原因はこのスクリプト単体では特定できない。過去の公開値を新CURRENTへ暗黙に再採用しない。

**54 PRの一次測定原本：** [Measure missing Pokemon PR実行](https://github.com/taka-0223/pokemon-sleep-hub/actions/runs/37199678249) と [Artifact](https://github.com/taka-0223/pokemon-sleep-hub/actions/runs/37199678249/artifacts/11302453018) を参照。保存ZIP SHA-256は `cb61e5785ced43c582ec9bd46cde199b12aa6a69ba36ab3f06bb4201ed7a9d9c`。54 PR値は旧公開版と完全一致、測定対象9個体の食材・性格・5サブスキルも最新CURRENTと一致。現行CURRENTのL_Measurementsは165件で不変であり、保留中の54行には既存ID・測定組み合わせの衝突がない。

**銀種OFF条件の証拠と限界：** 元の測定コードは`localStorage.config.tmpEvaluate.silverSeed`をすべてfalseに設定してページ再読込している。[2026-10-04以前の上流シミュレータの固定コミット](https://github.com/reimer0204/pokesle-simulator/tree/733701bbe6a625241c7701e76d830e0d8ff68c64)で、再読込後の`tmpEvaluate`が評価時に使用される経路を確認。ただし当時ホスト上で実際に配信された上流コミット・評価直前の実効設定の再読込ログは残っていない。したがって historical evidence は再現可能な出典を伴うが、「実効OFFを完全立証した」とは記載しない。

**レビュー用差分台帳：** Tier16、priority13、歴史PR54、資源2欠測、RoleSlot本体の更新3件を非公開ライブラリへ保存。**正式採用・CURRENTへの54値の追記・公開用data.jsへの値の復旧は未実施**。

**安全性の結論：** 既存PR消失・未承認Tier/priority差分・資源キー消失を検出する`check_data_sync.py`のfail-closed制約は必要。過去の`apply_r13_snapshot.py`を再実行すること、公開`data.js`をCURRENTの代用SSOTにすること、測定値や評価をコード定数として合わせ込むことは禁止。

## 2026-10-21｜r30 historical measurement restoration (private SSOT)

- Latest private SSOT is `pokemon_sleep_decision_system_CURRENT_r30.xlsx` (`2026-10-21-r30`). The prior r29 remains preserved in private Library; neither workbook is part of this public PR.
- After provenance review, the historical GitHub Actions artifact from [2026-10-04 run #37199678249](https://github.com/taka-0223/pokemon-sleep-hub/actions/runs/37199678249) was used to **append exactly 54 original measured observations**, with new `MEAS-0166..MEAS-0219` IDs. Prior 165 measurements remain byte-equivalent by logical cells. Original 9 individual inputs and all 54 PR values matched the archived run and prior public r23.
- This is restoration of an archived measurement result, **not a fresh calculation**. The historical script explicitly requested silver-seed OFF and reloaded; effective runtime state was not independently logged. This limitation is recorded per restored measurement in `settings` / `source_note`.
- The only other private-workbook changes are revision metadata `M_Rules!J3`, `M_Rules!J4`, `M_Rules!D19` and `LOG-106` (6 cells). No species tier, decisions, active individual, role, coverage or resource records were altered.
- r29→r30 separate-generation diff: 41 active individuals unchanged, 33 roles, 47 role coverage and 16 resource keys unchanged. PR-measured individuals **27→36**, with exactly nine previously absent `primaryPR` values restored to their originally published values.
- Historical-only per-field manifest: **36 approved output-field changes** (9 × `measurements`, `primaryPR`, `primaryEvalLv`, `topPercent`). With this exact manifest, the r29→r30 fail-closed comparison PASSes. The manifest is strictly scoped: it **does not approve publishing the whole r30 data.js** or any grade/priority/role/resource drift versus actual public r23.
- CURRENT SHA-256: `4b57d7bade41f503c97737fa9b7d99c5dfb010b8eb4b6728a3a33359f224e1f9`. Generated r30 review-only data.js SHA-256: `a3eb2093d5a7f9d6f909ae52432dd9a2707b25732628245da834398dbadf4f28`.
- Regression suites include explicit tests that an exact historical measurement addition can pass the reviewed-delta gate **but cannot authorize an unrelated Species Tier change**.
- **Full publication remains blocked**: existing public-vs-CURRENT Species Tier/priority/role-display drift remains unapproved and 2 previously published resource keys are absent in CURRENT. The `main` branch and public r23 data.js remain unchanged. No merge/deploy authorization is implied by this restoration.

## 2026-10-21｜r31 historical null resource keys and resource certainty guard

- The private SSOT advanced from r30 to **r31** (`2026-10-21-r31`) solely to re-register two historically published unknown resource identifiers: `larvitar_candy` and `paldean_wooper_candy`. The published r23 `data.js` had `value:null` for both, and the earliest CURRENT r23 already lacked these identifiers. The recovered P_Account rows have `snapshot_date=2026-10-15`, `value_num=null`, `certainty=unknown`, and an archive source note; **current balances remain unknown**.
- Source r30→r31 workbook logical-cell delta: 24 cells (M_Rules revision 2 cells; 2 new P_Account rows 16 nonblank cells; new LOG-107 6 cells). The preexisting 41 active individuals, 219 measurements, all Species Tier/decisions, 33 RoleSlots and 47 RoleCoverage remain unchanged.
- `scripts/build_data.py` now selects the newest dated account observation for each key, preventing an appended older archive row from overriding a more recent observation.
- `certainty=inferred` or `approx` is **not exposed as a confirmed numeric resource balance**: the public numeric `value` becomes `null`, with the original nonnumeric `text` preserved. A confirmed zero remains 0. Optional `certainty` and `observedAt` metadata retain provenance; non-resource private ledger rows are excluded.
- Confirmed local test on the **exact GitHub branch build_data.py**: derived r31 candidate contains 41 active individuals, 36 primary-PR holders, 33 RoleSlots, 47 Coverage and **18 resource keys**. Two independent builds are byte-identical. The archive-key-only r30→r31 before/after manifest (two resource paths) passes the fail-closed gate; the same change with no manifest is blocked.
- Unit suite now has **22 synthetic offline tests**, including missing resource, dated overwrite, inferred/approximate quantity, known zero, and no leakage of private note.
- No r31 candidate `data.js` or private CURRENT workbook has been committed to the public GitHub repository. Full release approval is **still blocked** by historical Tier / priority / candidate-list / Coverage changes.

### Public-vs-current discrepancy breakdown (not an automatic approval)
- Historical Tier discrepancies: 16 individual entries; 11 were explicitly hardcoded by the one-time [r13 public patch](https://github.com/taka-0223/pokemon-sleep-hub/blob/61ff6a7b1b1711e753e043f69b9f4f470dcf7589/scripts/apply_r13_snapshot.py). 3 of the other 5 lack matching master assessment; 2 refer to a provisional master grade. No grade is automatically overwritten.
- Historical priority discrepancies: 13 individual entries. The published priorities show changes during r18 (2026-10-06) and r21 (2026-10-09), but the CURRENT r23→r31 decision priority fields are unchanged. Thus the historical published ranking cannot simply be discarded without reviewing those later decisions.
- RoleSlot `targetCandidates` changed for all 33 roles at the serialized-object level. After normalization of candidate `speciesKey` + `grade` + `preferred`, 14 roles have **substantive candidate/grade mismatches**, and 19 differ only in labeling, order or field layout. The substantive list is ROLE-002/003/004/005/006/008/010/011/014/015/016/017/018/033; ROLE-002/015/018/033 would display empty candidate arrays on current-generation data. This remains a release blocker.
- RoleCoverage ING-013 and SKL-002 both show `育成待ち` in the CURRENT r23 and r31, while public r23 showed `充足`; the linked RoleSlot statuses themselves are `充足`. Coverage and assignment are distinct dimensions, so the discrepancy cannot be merged blindly.

**Current next step**: reconcile the 14 substantive role-candidate master differences and the dated priority review with the original decision evidence; make a *separate* explicit main merge/production publication decision after full approved manifest validation. The app's present v0.19 data gate and UI remain intact.

## 2026-10-21 r32｜根拠あるCoverage更新と14役割の候補不整合

### 非公開CURRENTの限定修正
- ライブラリSSOT `pokemon_sleep_decision_system_CURRENT_r32.xlsx`（`2026-10-21-r32`）。r31から**論理セル15件のみ**変更（M_Rulesのrevision2、Coverage7、LOG-108の6）。r31原本はそのまま保持。既存41有効個体・PR測定219件・Species Tier・個体優先順位・33 RoleSlot・その他45 Coverage・資源18キーは変更なし。
- `ING-013` は「育成待ち」→「充足」。出典：`LOG-070` ドオーLv30のAAカカオ×5解禁、`ROLE-008` は2026-10-09に充足・厳選停止。旧basisを更新。
- `SKL-002` は「育成待ち」→「充足」。出典：`LOG-058` モココ→デンリュウ進化、`ROLE-006` は2026-10-06に充足・厳選停止。旧holder「モココ」を「デンリュウ」に更新。
- r31→r32同じ生成パイプラインの比較で、公開派生データは **CoverageMatrix上記2件のstatusのみ**が変化。レビューした２経路だけを許可する差分マニフェストによるローカルの fail-closed ゲートは**PASS**、全体公開に対する自動承認ではない。
- private workbook SHA-256: `56ac111ddff45c3402282152866d1725be689f250489e2a28561f07fe001898b`。r32公開候補は private 監査フォルダにのみ保管し、`data.js`をmainへ反映していない。

### 未解決RoleSlot候補14件の分類（評価変更はしない）
- 公開r23の候補に存在するのに最新`M_SpeciesAssessment`の対応`role_key/species_key`に**未収録の候補が合計26件**。同じ候補種は両方にあるがTierが異なるものは**9件**。
- 意味的差分がある14 RoleSlots：ROLE-002/003/004/005/006/008/010/011/014/015/016/017/018/033。うち **ROLE-002/015/018/033はmasterの該当role_key評価が0件**なので最新生成では候補一覧が空になる（生成器の単純なバグではなくマスター収録の不足）。
- 他19 RoleSlotsは候補種・Tier・preferredの組が同一で、並び・表示ラベル等の差のみ。ユーザー向けの表示品質はApp開発で要確認。
- 新しい `role_candidate_loss` ゲートにより、旧公開版に候補が存在するRoleSlotを候補ゼロへ変更する操作は、**一般的なallowed_changesマニフェストを付けてもBLOCKED**。元の候補を正本へ自動輸入したわけではない。

### 個体優先順位13件の履歴分類
- **5件**は公開r17→r18（2026-10-06）の変動に由来、**8件**はr18→r21（2026-10-09）の再配分に由来。CURRENT r23→r32の対応する`D_Decisions.priority_rank`には一切変更がない。
- 旧公開優先順位の更新日時と変更理由は、CURRENTの現在の意思決定年月日と必ずしも一致しない。「どちらかが正しい」と機械的に決定せず、評価と資源別優先順位（R-012）の概念を分離したままレビューする。
- 今回の `P_RoleCoverage` 同期は既存確定事実による訂正であり、Species Tier16件・priority13件・RoleSlot候補Tier9件の採否には何ら影響しない。

**公開は引き続き保留：** Tierとpriority、および不足候補14役割の正式な判断は未承認。最新SSOT・RoleSlot・既存PR・アプリData Sufficiency Gateは保持。mainのマージとGitHub Pages公開はユーザー承認が必要。

### M_Species の不足も確認（2026-10-21）

- `M_SpeciesAssessment`にない**26候補レコード**を`M_Species`とも照合したところ、**18件は種族基本マスターにもキーがない**（18ユニーク種族キー）。残り8件は基本種族キーがあるものの役割別評価が未登録。
- これは役割別候補の空配列を埋めるだけでは解消しない。データ復旧は段階を分け、まず「種族の固定事実が出典で確認できるか」、次に「役割別Tierとして承認されているか」を判断する。公開r23の候補リストを使って基本事実・評価を自動生成することは禁止。
- 対象18キーと26件の個別差分は、非公開 `DB01_r32_release_review.xlsx` 内の「種族Master欠落18件」「候補14役割」に記録。レビュー状態は未承認で、r32 CURRENTの`M_Species`・`M_SpeciesAssessment`には書き込んでいない。

## 2026-10-21 r33｜種族の固定事実18件とSA-003参照キーの修復

- CURRENT SSOTを非公開ライブラリの `pokemon_sleep_decision_system_CURRENT_r33.xlsx`（`2026-10-21-r33`）へ**新規保存**。r32原本を保持し、r32→r33の全セル論理差分は**189件**：`M_Species`18形態×10フィールド=180、`M_SpeciesAssessment!C7`の1、`M_Rules`のrevision2、`LOG-109`の6。既存全シートの数式は前後とも0件、シート構造14枚は保持。
- 過去に旧公開r23の候補種にだけ存在していた**18ユニークspecies_key**について、固定コミット [`pokesle-simulator` 733701b (2026-09-29)](https://github.com/reimer0204/pokesle-simulator/blob/733701bbe6a625241c7701e76d830e0d8ff68c64/src/data/pokemon.ts) を用い、名称・family_key・進化段階・最終形キー・とくい・メインスキル・きのみと出典URLを種族マスターへ追記。**基礎率・FP等の未確認数値やTier・RoleSlot・優先順位は追加しない**。特定のバケッチャサイズには別family_keyを使用し、無関係な進化関係を混在させない。種族基本マスターは80→98件。
- `SA-003`（カメックス、S、active）だけは既存評価内容が`ROLE-002`の「ミルク/カカオ混合枠」と同じなのに、`role_key` が `milk_cacao`／`milk_cacao_mixed` に分かれていた。参照先を`milk_cacao_mixed`へ整合し、**Grade S・根拠・対象種族は一切変更しない**。未使用の別評価`oil_leek`は油専任`oil_specialist`とは非同義なので未変更。
- データ生成時に`ROLE-002`のカメックスS候補が復旧、`IND-0003`の既存S評価表示も未算出→Sに復旧。`IND-0037`の進化先ライチュウの表示名・メインスキルが種族事実として補完された。r32→r33の公開派生データの変更パスは**合計6つ**だけ（詳細は非公開限定差分manifest）。
- 複数の進化先だけがマスターに登録されているイーブイ系などで、同段階の別進化形を`サンダース→エーフィ`のように誤表示しないよう、`species_display_label`のstage判定を最小限修正。正しい実祖先を登録した分岐は`ラルトス→サーナイト`などを維持。
- 2026-10-21-r33実生成プレビューを2回再生成してバイト一致。**41有効個体・36件PR表示・33 RoleSlot・47 Coverage・18資源・2イベント**。r32→r33の正確な変更6パスのみを許すmanifestでfail-closedゲート**PASS**、manifestなしは**BLOCKED**。この判定は過去公開r23→r33の全差分を許可するものではない。
- 解消後もTier/候補の意味的差分が残るRoleSlotは**13件**、旧公開にあって評価マスターにない候補は**25件**、既存候補同士のTier不一致は**9件**。候補一覧が空になるのは`ROLE-015/018/033`の**3件**。個体種族Tier表示の旧公開差分は16→15件、育成優先順位の差分は13件のまま。
- CIの合成テストを**29件**へ拡張。今回の参照キーずれと修正後に既存Sが復元されること、事実マスターに種族を追加しただけでは新しいTier候補が生成されないことを回帰検証。
- **Public mainは変更禁止**。このPRに私的CURRENTや未承認`data.js`をコミットせず、PRはDraftを維持。mainマージ・GitHub Pages公開はユーザーによる別途承認が必要。
