# Pokémon Sleep Decision Hub

個人のポケモンスリープアカウントを「何を持っていて、何が強く、どの役割が埋まっていて、どこを厳選中か」で俯瞰する読み取り専用PWAです。

## Architecture

```text
スクリーンショット
    ↓ Chat で情報抽出・厳選判定
CURRENT_r35.xlsx (SSOT / 非公開)
    ↓ scripts/build_data.py （非公開の中間生成）
    ├─ scripts/build_current_facts.py → current-facts.js
    └─ scripts/build_current_decisions.py → current-decisions.js
旧公開 data.js (r23, Tierなど履歴用)
    ↓ facts merge → recent decisions / assignments merge
公開用 APP_DATA
    ↓ GitHub Pages
PWA
```

種族の **SRP (Species Role Percentile)** はデプロイ時に `reimer0204/pokesle-simulator` の最新公開データを取得して生成します。個体PRとは別指標です。

## UI v0.8

- 現状: アカウントKPI、役割充足、主な手持ち
- 手持ち: 高密度一覧、検索・品質・役割フィルタ。詳細ではサブスキルを公式アプリ準拠の金/青/白枠で表示
- 厳選: 全RoleSlotを単一リストで表示。厳選中/条件付き/未確認/完了を同一画面で示し、各行にS〜A候補種を併記
- 役割: 全ロールの充足状況
- 育成: 資源、イベント、育成中個体
- 各画面は下部ナビまたは左右スワイプで移動。スワイプは指の移動量に追従して隣画面を引き込む

## CURRENT → 公開用の限定同期

```bash
python3 scripts/build_current_facts.py /private/pokemon_sleep_decision_system_CURRENT_r35.xlsx current-facts.js
python3 scripts/build_current_decisions.py /private/pokemon_sleep_decision_system_CURRENT_r35.xlsx current-decisions.js 2026-10-20
```

CURRENT.xlsxはPublic repoへコミットしません。2026-10-25時点で、手持ち35体・PR30体、全33役割の担当・状態と直近6体の個体方針をr35に同期。旧公開r23のSpecies Tier・厳選候補は引き続き参考表示です。`data.js`をr35の完全な導出ファイルで上書きすると履歴評価や測定が欠落するため、現在の限定同期とは別の審査対象です。

## Deployment

mainへのpushでGitHub ActionsがJS/Pythonを検証し、SRP βを再生成してGitHub Pagesへデプロイします。

## 判断前チェック（Data Sufficiency Gate v1.0 / UI v0.19）

- 「育成・イベント」または個体詳細から必要時だけ開く、読み取り専用の前提確認画面です。
- 方針の確認では全資源を要求しません。実行前に必要な値だけを選択して入力します。
- 判定は `data-gate.js` の純粋関数で、結果は READY / PROVISIONAL / VERIFY / HOLD / MODEL_GAP の5種類です。
- 博士送りは情報が揃ってもアプリから許可・実行できません。料理モデル未整備もユーザーの在庫不足と区別します。
- 入力値は画面内の一時情報で、`CURRENT.xlsx` や `data.js`、ブラウザ保存領域には書き込みません。
- 方針の正本は最新CURRENTの `C_DataPolicy` / `C_DecisionGate`。公開個体の固定事実とPRはr35、直近個体方針6体と33役割の担当状態もr35、古い種族Tier・候補評価はr23の参考情報です。
- テスト: `node --test tests/data-gate.test.cjs`。CIはPRとmain pushでゲートを検証します。
