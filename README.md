# Pokémon Sleep Decision Hub v0.2 (PWA)

スマホ向けの読み取り専用PWAです。GitHub Pagesにそのまま配置できます。

## ファイル
- `index.html` — 画面
- `style.css` — UI
- `app.js` — 表示・検索・PWA登録
- `data.js` — CURRENT.xlsxから生成したデータ
- `manifest.webmanifest` — PWA設定
- `service-worker.js` — オフラインキャッシュ＋オンライン優先更新
- `icons/` — PWAアイコン
- `.nojekyll` — GitHub Pagesで静的ファイルをそのまま配信

## GitHub Pages
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main`, Folder: `/(root)`
4. Save

## データ更新
`CURRENT.xlsx → data.js` の一方向同期を前提にします。

## SSOT
CURRENT.xlsx が正本です。Web側からの編集はまだ行いません。
