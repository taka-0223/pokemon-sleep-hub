# Pokémon Sleep Decision Hub

個人のポケモンスリープアカウントを「何を持っていて、何が強く、どの役割が埋まっていて、どこを厳選中か」で俯瞰する読み取り専用PWAです。

## Architecture — CURRENT r37 / seed-v1

CURRENT r37（非公開SSOT、`2026-11-01-r37`）から`data.js`と`seed-data.js`を生成します。両方のsource revision / SHA-256が同一でなければ金種評価は表示しません。手持ちの事実・PR・既存方針・33 RoleSlot・47 Coverage・料理Phase 6の記録はr36から保持し、金種専用の三層モデルを追加しました。

生成手順：

```bash
python3 scripts/build_r36_snapshot.py /private/pokemon_sleep_decision_system_CURRENT_r37.xlsx data.js
python3 scripts/build_seed_data.py /private/pokemon_sleep_decision_system_CURRENT_r37.xlsx seed-data.js
python3 scripts/check_r36_public.py --candidate data.js --manifest config/r37-public-manifest.json --facts current-facts.js
node --test tests/seed-model.test.cjs tests/seed-ui.test.cjs tests/seed-public.test.cjs
```

元のCURRENT Excelはパブリックリポジトリへコミットしません。旧r36以前は非公開履歴として保持。旧r23の評価値へフォールバックしません。料理定性判断は採用済みですが、物理的な料理エナジー増分はMODEL_GAPとして未算出です。SRPは個体PRと別指標です。

### 金種の三層評価

1. `M_SeedTier`の種族投資候補。初版8種は定性・暫定であり、等条件ROI順位でも公式Tierでもありません。
2. `D_Decisions.seed_*`の手持ち個体候補。初版はプクリンとデンリュウの暫定A、その他は未評価です。既存PR・育成優先順位・金種上限を流用しません。
3. `seed-model.js`による投入シナリオ。目標SLvは未選択から開始し、登録SLvからの必要個数と1回効果差のみ参考計算します。入力は永続保存せず、実行・資源予約・使用承認を行いません。

`seed-rules.js`は4スキルの資料に基づく効果表です。特殊・複合スキルは代用しません。`gameDataVersion`は収録した効果データの独自revisionで、公式ゲームの版番号ではありません。今使う案から将来の進化・サブスキルLvを先引きせず、概数在庫は確定残数にしません。旧`S_Scenarios`は当時の提案のまま保持し、自動推薦しません。詳しくは[データ契約](docs/SEED_MODEL_DATA_CONTRACT.md)を参照。

## UI v0.21

- 現状: アカウントKPI、役割充足、主な手持ち
- 手持ち: 高密度一覧、検索・品質・役割フィルタ。詳細ではサブスキルを公式アプリ準拠の金/青/白枠で表示
- 厳選: 全RoleSlotを単一リストで表示。厳選中/条件付き/未確認/完了を同一画面で示し、各行にS〜A候補種を併記
- 役割: 全ロールの充足状況
- 育成: 資源、金種三層評価・参考計算、イベント、育成中個体
- 各画面は下部ナビまたは左右スワイプで移動。スワイプは指の移動量に追従して隣画面を引き込む

## r37 public data

個体・既存評価は`data.js`、金種専用評価は同一CURRENTから生成した`seed-data.js`を使います。`current-facts.js`/`current-decisions.js`はr35の測定保全テストの参照用として残していますが、本番HTMLからは読み込みません。

## Deployment

PRとmainへのpushでGitHub ActionsがJS/Python・データ契約を検証します。SRP生成器の試験は一時ファイルへ出力し、公開用の`srp.js`は書き換えません。公開配信はリポジトリのGitHub Pages設定によります。`Live PWA smoke`は公開後のHTML・データ・描画を別途検査します。

## 判断前チェック（Data Sufficiency Gate v1.0 / UI v0.19）

- 「育成・イベント」または個体詳細から必要時だけ開く、読み取り専用の前提確認画面です。
- 方針の確認では全資源を要求しません。実行前に必要な値だけを選択して入力します。
- 判定は `data-gate.js` の純粋関数で、結果は READY / PROVISIONAL / VERIFY / HOLD / MODEL_GAP の5種類です。
- 博士送りは情報が揃ってもアプリから許可・実行できません。料理モデル未整備もユーザーの在庫不足と区別します。
- 入力値は画面内の一時情報で、`CURRENT.xlsx` や `data.js`、ブラウザ保存領域には書き込みません。
- 方針の正本は最新CURRENTの `C_DataPolicy` / `C_DecisionGate`。公開snapshotはr37、既存個体判断の審査日は2026-10-25のまま保持します。未測定値は未算出です。
- テスト: `node --test tests/data-gate.test.cjs`。CIはPRとmain pushでゲートを検証します。
