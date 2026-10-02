# Pokémon Sleep Decision Hub v0.3

ポケモンスリープの育成・厳選・役割管理を、スマホから確認するためのPWAです。

## データ設計
- **CURRENT.xlsx**: 非公開のSSOT（正本）
- **data.js**: CURRENTから生成した公開用スナップショット
- **個体PR**: ポケスリシミュの同種・同食材構成内 percentile。Tool / 評価Lv / 指標 / PR を保持
- **SRP (Species Role Percentile)**: 同じ役割の最終進化種族間を、Lv30・性格/サブスキル/イベント補正なしで標準化比較
- **役割スロット**: アカウント上の充足 / 暫定 / 不足を個体品質と分離して管理

## SRP v0.1
GitHub Pagesのデプロイ時に `reimer0204/pokesle-simulator` の最新版を取得して再計算します。
出力には upstream commit SHA を記録します。

比較コホート:
- きのみ: 同じきのみを担当する、きのみ得意の最終進化
- 食材: Lv30で同じ対象食材を供給できる、食材得意の最終進化
- スキル: 同じメインスキルを持つ、スキル得意の最終進化

SRPは**個体PRとは別指標**です。

## 画面
- ホーム: KPI / 今見るべき個体 / 役割の穴
- 手持ち: 品質・役割フィルタ / 種族SRP / 個体PR
- 役割: アカウントの役割充足マップ
- 育成計画: イベント情報 / ミニアメブースト / アメ投入候補

## CURRENT → PWA
`scripts/build-data.py` はPython標準ライブラリだけでCURRENT.xlsxからdata.jsを生成します。

```bash
python scripts/build-data.py /path/to/pokemon_sleep_decision_system_CURRENT.xlsx ./data.js
```

CURRENT.xlsxそのものはPublic repoには置きません。

## Deploy
`main`へのpushでGitHub Actionsが:
1. PWA bundleを検証・展開
2. pokesle-simulator最新版をclone
3. SRPを生成
4. GitHub Pagesへ公開

Pages: https://taka-0223.github.io/pokemon-sleep-hub/
