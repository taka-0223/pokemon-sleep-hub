# Pokémon Sleep Decision Hub

個人のポケモンスリープアカウントを「何を持っていて、何が強く、どの役割が埋まっていて、どこを厳選中か」で俯瞰する読み取り専用PWAです。

## Architecture

```text
スクリーンショット
    ↓ Chat で情報抽出・厳選判定
CURRENT.xlsx (SSOT / 非公開)
    ↓ scripts/build_data.py
data.js (公開用スナップショット)
    ↓ GitHub Pages
PWA
```

種族の **SRP β (Species Role Percentile)** はデプロイ時に `reimer0204/pokesle-simulator` の最新公開データを取得して生成します。個体PRとは別指標です。

## UI v0.6

- 現状: アカウントKPI、役割充足、主な手持ち
- 手持ち: 高密度一覧、検索・品質・役割フィルタ
- 厳選: 厳選項目を優先度順の単一リストで表示し、各行に狙う種族を併記
- 役割: 全ロールの充足状況
- 育成: 資源、イベント、育成中個体
- 各画面は下部ナビまたは左右スワイプで移動。スワイプは指の移動量に追従して隣画面を引き込む

## CURRENT → data.js

```bash
python3 scripts/build_data.py /path/to/pokemon_sleep_decision_system_CURRENT.xlsx data.js
```

CURRENT.xlsxはPublic repoへコミットしません。生成済み `data.js` だけを公開します。

## Deployment

mainへのpushでGitHub ActionsがJS/Pythonを検証し、SRP βを再生成してGitHub Pagesへデプロイします。
