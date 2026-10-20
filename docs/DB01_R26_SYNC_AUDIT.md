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