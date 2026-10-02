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
1. 新規リポジトリを作成
2. このフォルダの中身をリポジトリ直下へアップロード
3. Settings → Pages
4. Source: Deploy from a branch
5. Branch: `main`, Folder: `/(root)`
6. Save
7. 発行されたURLをAndroid Chromeで開き、ホーム画面へ追加 / アプリをインストール

## データ更新
現時点では `CURRENT.xlsx → data.js` はChatGPT側で生成します。
`data.js` を差し替えてpushするとPWAも更新されます。

## SSOT
CURRENT.xlsx が正本です。Web側からの編集はまだ行いません。
