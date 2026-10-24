# DB更新01｜CURRENT r35 の個体方針・RoleSlot担当の実用同期（2026-10-25）

## 出典と公開境界

- 非公開の唯一の正本：`pokemon_sleep_decision_system_CURRENT_r35.xlsx`、内部revision `2026-10-23-r35`。
- 原本SHA-256：`9ecbe960c586e0349fb628e49b5b4fbf56d850e28aa95199efa6565f29f6e273`。
- 今回の生成物：`current-decisions.js`（SHA-256：`4455dc2a54c298b3d28618db7c58cc9735ac8b7b063549bfa6ff6673d7fd25bf`）。元のCURRENT xlsxと全量導出版data.jsはGitHubへ入れない。
- `current-facts.js`による有効35体・PR30体・非アクティブ8体の照合後に適用する。
- 旧 `data.js`（r23）を全量置換せず、元のTier・役割候補・個体品質・SRPなどの未解決部分を履歴として残す。

## 今回CURRENTへ更新した判断・担当

| 個体ID | CURRENTの方針日 | 状態 | 主な反映内容 |
| --- | --- | --- | --- |
| IND-0005 | 2026-10-20 | active | ミュウツーLv30到達。銀種・金種の追加投資は未承認。旧優先15→CURRENT14。 |
| IND-0016 | 2026-10-23 | active | 色違いポッチャマの博士送り候補を撤回し、「キープ（色違い）」とする。 |
| IND-0018 | 2026-10-20 | active | サナギラスをおひるね島Lv26の長期育成方針へ。旧優先7→CURRENT10。 |
| IND-0034 | 2026-10-20 | active | タマゲタケLv25達成、次のLv29進化・Lv30食材解放を記録。 |
| IND-0042 | 2026-10-20 | provisional | 固定ミュウツーはキープ、数値評価未確定・資源投入保留。ROLE-013の控え。 |
| IND-0043 | 2026-10-23 | provisional | ひかえめABAマダツボミをキープ、正式PR未測定・資源投入保留。ROLE-025暫定担当。 |

RoleSlotは33件すべての `incumbent / backup / need / search / priority` をCURRENTへ更新。全担当・控えIDがr35の有効35個体に属することを生成時および適用時に検証する。

特に画面上の実質変更は以下の4役割：

| RoleSlot | r23→r35での変更 |
| --- | --- |
| ROLE-013 | ミュウツーの控えをIND-0042に追加。 |
| ROLE-015 | ミルク専任枠の優先度を中→高。 |
| ROLE-025 | 博士送り済みIND-0039/0033を外し、IND-0043を暫定主担当に設定。 |
| ROLE-032 | 博士送り済みIND-0036を控えから除外。 |

RoleSlotの判断メモはreview_dateが2026-10-20以降の6件だけCURRENT文面を採用。それ以外の旧メモは「参考」と明記する。

## 残留する別課題

1. Species Tier・候補種リスト：r35の種族評価の多くは2026年9月のもので、公開r23と相違がある。自動的にr35へ置換しない。
2. 旧個体の品質・優先順位：今回の6体を除く判断は旧公開を参考表示。全員の再判定完了を装わない。
3. 油ROLE-018の比較は博士送り済みIND-0039を含む過去モデル。料理Phase6へ昇格する前に更新する。
4. IND-0043のPR/SRPは未測定のまま保持。RoleSlot充足も暫定で、投資承認ではない。

## 回帰条件

- 合成SSOTによるPython試験、新旧個体・役割の結合Node試験、旧facts-only試験、Data Gate試験を実行。
- アクティブ35・PR30・役割33・今回方針6、RoleSlotの対象IDと総件数、ソースrevisionと日付を検証。
- 生存する旧個体の品質・種族Tier・PR/測定、旧RoleSlotのTier候補配列は変えない。
- 失敗時は旧公開 + CURRENT事実レイヤーを維持し、画面を空にしない。
