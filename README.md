# Pokémon Sleep Decision Hub

個人のポケモンスリープアカウントを「何を持っていて、何が強く、どの役割が埋まっていて、どこを厳選中か」で俯瞰する読み取り専用PWAです。

## Architecture — CURRENT r36

CURRENT r36（非公開SSOT、`2026-10-25-r36`）から`data.js`を生成し、単一の現行評価revisionとして公開します。手持ちの事実・PR・個体方針・種族役割Tier・33 RoleSlot・47 Coverage・料理Phase 6の条件付き判断を統合します。

生成手順：

```bash
python3 scripts/build_r36_snapshot.py /private/pokemon_sleep_decision_system_CURRENT_r36.xlsx data.js
python3 scripts/check_r36_public.py --candidate data.js --manifest config/r36-public-manifest.json --facts current-facts.js
```

元のCURRENT Excelはパブリックリポジトリへコミットしません。r35は非公開履歴として保持。旧r23の評価値へフォールバックしません。r36では料理定性判断を正式採用しましたが、物理的な料理エナジー増分はMODEL_GAPとして未算出です。SRPは個体PRと別指標です。

## UI v0.8

- 現状: アカウントKPI、役割充足、主な手持ち
- 手持ち: 高密度一覧、検索・品質・役割フィルタ。詳細ではサブスキルを公式アプリ準拠の金/青/白枠で表示
- 厳選: 全RoleSlotを単一リストで表示。厳選中/条件付き/未確認/完了を同一画面で示し、各行にS〜A候補種を併記
- 役割: 全ロールの充足状況
- 育成: 資源、イベント、育成中個体
- 各画面は下部ナビまたは左右スワイプで移動。スワイプは指の移動量に追従して隣画面を引き込む

## r36 public data

本番は`data.js`単一の評価正本を使います。`current-facts.js`/`current-decisions.js`はr35の測定保全テストの参照用として残していますが、本番HTMLからは読み込みません。

## Deployment

mainへのpushでGitHub ActionsがJS/Pythonを検証し、SRP βを再生成してGitHub Pagesへデプロイします。

## 判断前チェック（Data Sufficiency Gate v1.0 / UI v0.19）

- 「育成・イベント」または個体詳細から必要時だけ開く、読み取り専用の前提確認画面です。
- 方針の確認では全資源を要求しません。実行前に必要な値だけを選択して入力します。
- 判定は `data-gate.js` の純粋関数で、結果は READY / PROVISIONAL / VERIFY / HOLD / MODEL_GAP の5種類です。
- 博士送りは情報が揃ってもアプリから許可・実行できません。料理モデル未整備もユーザーの在庫不足と区別します。
- 入力値は画面内の一時情報で、`CURRENT.xlsx` や `data.js`、ブラウザ保存領域には書き込みません。
- 方針の正本は最新CURRENTの `C_DataPolicy` / `C_DecisionGate`。個体・PR・判断・種族Tier・RoleSlot・料理定性評価の公開revisionはすべてr36です。実数値が未測定のときは未算出として表示します。
- テスト: `node --test tests/data-gate.test.cjs`。CIはPRとmain pushでゲートを検証します。
