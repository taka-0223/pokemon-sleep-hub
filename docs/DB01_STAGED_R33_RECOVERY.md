# DB更新01｜先行復旧：CURRENT r33 の確定事実だけを表示するPWA

## 目的と制限
アプリを利用できないほど公開r23が古くなったため、評価の承認が完了する前に**手持ち・PR・資源・Coverageの閲覧を回復**する。公開r23にある不整合な種族Tier・育成優先順位・厳選Role候補は**現時点の判断として採用せず、旧公開値を参考表示**する。

これは全データの正式同期ではない。新規個体の評価や博士送り、料理Phase6の統合は行わない。

## 構造
```
private CURRENT r33.xlsx
  -> existing scripts/build_data.py -> private intermediate data.js
  -> scripts/build_current_facts.py [allowlisted fact fields only]
  -> current-facts.js [public, no decisions / species grade / role candidates]
legacy data.js r23 [unchanged] + current-facts.js
  -> current-facts-merge.js [revision + count + ID validation, fail-safe]
  -> existing app.js + PWA UI [41 active / 36 measured]
```

### 絶対に公開しない情報
CURRENT原本（xlsx）、完全な中間data.js、評価承認・推定スコア、裏付けのないRoleSlot候補。公開するのは`current-facts.js`のallowlistだけ。

### 保存し続ける歴史的情報
`data.js` r23の既存38個体の品質・Tier・優先順位・評価理由・RoleSlotと、33役割の候補データは**変更しない**。ただし現在の方針とは限らない。画面に`手持ち r33 / 評価・役割 r23（参考）`と明示。新規3個体の判断・Tier・役割はすべてnull、PR未測定はnull。

### CURRENT r33に切替える情報
全41個体の名称/レベル/食材/性格/スキル/サブスキル/PR履歴/主PR、資源18件（不明はnull、推定と概数は確定数値にしない）、RoleCoverage47件（r32で根拠を確認した2件を含む）。

### 安全弁
- `compatibleLegacyRevision` と旧data.jsのrevisionが異なれば全overlayを拒否。
- 個体の消失/重複、Coverage欠落、PR件数ずれ、PRが0〜100を逸脱なら拒否。
- 公開用data.jsは上書きせず、ロードに失敗しても旧r23で起動。誤った新規判断を自動設定しない。
- 資源の生データにはcertainty/observedAtを保持。
- service-worker cache v0.25を作り、overlay2ファイルをoffline COREへ追加。
- 「更新確認」はdata.jsだけでなくcurrent-facts.jsのrevisionも確認する。
- Data Sufficiency Gateを保持し、博士送りの許可機能は追加しない。

## 再生成
非公開環境で：`python3 scripts/build_current_facts.py /private/pokemon_sleep_decision_system_CURRENT_r33.xlsx current-facts.js`

その後 `node --test tests/current-facts.test.cjs`。生成器を含む回帰とJS構文、既存PWA・SRP生成はCIの`Validate PWA`で確認する。

## 照合した事実
- CURRENT r33の監査SHA-256：`c1d8e4c341bfb3f5cd85db54fd9dc9fb1e638d2040466b266d7dca8c18f7b765`
- 監査済み完全中間data_r33.js SHA-256：`c3122fcc9e34c55eb068bafd89325a511f1e85ca2e13b5de6ec04208d610d3f0`
- 公開側data.jsは依然`2026-10-15-r23`、38個体、PR表示36個体。
- 本PRはCURRENT・完全中間snapshotを一切含まず、既存`data.js`を変更しない。
- 旧r23評価は読み取り専用参考情報。Tier16・優先順位13・Role候補の有意な不一致13件についての正式な再評価は継続。

## 公開
**Draft・マージ禁止。** 正規アプリの公開反映は事前レビューとユーザー承認が必要。PRが通っただけでは本番公開・端末実機検証まで完了した扱いにしない。
