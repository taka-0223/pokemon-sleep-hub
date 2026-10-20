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


## 追加監査｜2026-10-20：当時の一次測定原本を回収

- [GitHub Actions #37199678249](https://github.com/taka-0223/pokemon-sleep-hub/actions/runs/37199678249) の成功実行を特定し、成果物 `pr-results.zip`（artifact ID 11302453018）を実際に回収。
- ZIP SHA-256: `cb61e5785ced43c582ec9bd46cde199b12aa6a69ba36ab3f06bb4201ed7a9d9c`（GitHub記載のartifact digestと一致）。
- 原本 `pr-results.json` は2026-10-04T11:45:30.244Z、`source: pokesle-simulator tmp-evaluate`、`silverSeed: false` と記録。
- 当時の[測定スクリプト（固定SHAのコミット）](https://github.com/taka-0223/pokemon-sleep-hub/blob/fee5cd64ada23189427d0c58a9ce385608bb26c8/scripts/measure_missing_pr.cjs)を取得。食材3枠・性格・サブスキル5枠は現行CURRENT r28の9個体と完全一致。原本の9×6＝54測定値は既存公開r23 `data.js` の該当54値と完全一致。
- **確認の限界**：測定スクリプトは設定の存在時に`silverSeed`をOFFへ書き換え、原本にもOFFと記録した。しかしWeb版シミュレータを再読込した後の有効設定の読み戻しログはなく、上流のWeb版デプロイコミットも固定していない。したがって「当時の正式測定記録は存在した」「OFFを意図して測定した」ことは確認できるが、実行時効果までは独立検証済みと扱わない。
- 個別レビュー用の54行追加候補JSONを生成済み。**このPRへの数値混入・CURRENTへの自動復元は行わない。** 正式な再採録は監査原本と承認を照合して別途実施する。

### r27/r28へ正本が進んだことによる新たな公開阻害

- 最新ライブラリの正本は `pokemon_sleep_decision_system_CURRENT_r28.xlsx`。r27でミュウツー1体目 `IND-0042` を追加し、イベント2体目 `IND-0005` はLv30へ。r28でタマゲタケ `IND-0034` Lv25、サナギラス `IND-0018` Lv26・おひるね島滞在を記録。どちらも既存測定165件は維持。
- **revisionの内部矛盾**：r27/r28の `H_ChangeLog` はそれぞれ r27/r28への更新を記録するが、`M_Rules.DATA_REVISION` は`2026-10-20-r26`のまま。既存`build_data.py`はこの欄で `data.js.meta.revision` を生成するため、r28から生成してもr26表示となる。
- `scripts/check_data_sync.py` の追加ガードは、CURRENTファイル名とM_Rulesのrevision不一致、またはH_ChangeLogとM_Rulesのrevision不一致を検知して `source_revision_conflict` でBLOCKEDにする。合成ファイルによる3テストを追加。
- r28の実ファイル修正は行っていない。CURRENT修復前にmain公開へ進まないこと。