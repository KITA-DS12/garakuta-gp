# ガラクタGP

ひろったガラクタでマシンを組んで、10本勝負。日替わりコースを物理で駆けぬけるブラウザゲーム。

**プレイ:** https://garakuta.mu-k.net

## あそびかた

- カードをひいて、ボディ・タイヤ・エンジン・補助パーツを組み合わせる
- 10ラウンドぶん走って、距離を稼ぐ
- コースは日替わり（同じ日なら世界中で同じコース）
- リザルト画面の URL をシェアすると、相手が自分のマシンを引き継いで走れる

## 特徴

- インストール不要・サーバー不要、`index.html` をブラウザで開くだけで動く
- スマホとデスクトップに対応
- 効果音は WebAudio で合成（外部音源なし）
- 物理演算は [matter-js](https://brm.io/matter-js/) を CDN から読み込み

## ファイル構成

```
index.html        エントリ
css/style.css     スタイル
js/core.js        乱数・パラメータ定義
js/cards.js       カード・呪い・命名・称号
js/terrain.js     コース生成
js/machine.js     マシン組み立て(剛体・拘束)
js/audio.js       効果音(WebAudio合成)
js/race.js        レース進行・ゴースト録画
js/render.js      描画・カメラ・ミニマップ
js/ui.js          UI・URLリレー・リザルト・起動

Makefile          dev/deploy のコマンド集
docs/DEPLOY.md    S3+CloudFront+Route53+ACM のインフラ初期構築手順
tools/            favicon・OGP 画像生成スクリプト(node+sharp)
```

ES Modules ではなく素の `<script>` を順番に読む方式なので、`file://` 直開きでも動く。読み込み順に依存があるため `index.html` の script タグ順は変更しない。

## 開発

```sh
make dev      # ローカルサーバー起動 (http://localhost:8000)
make favicon  # favicon.svg から PNG を再生成 (要 npm install)
make ogp      # OGP 画像を再生成 (要 npm install)
```

## デプロイ

`garakuta.mu-k.net` 向けの S3 + CloudFront 構成で配信している。

```sh
make deploy   # S3 同期 + CloudFront キャッシュ無効化
make sync     # S3 同期のみ
make invalidate  # CloudFront キャッシュ無効化のみ
```

初回はインフラ構築が必要。手順は [docs/DEPLOY.md](docs/DEPLOY.md) を参照。デプロイ設定は `.env.example` をコピーして `.env` を作成。

## ライセンス

[MIT License](LICENSE)

外部依存（CDN から読み込み）:
- [matter-js](https://github.com/liabru/matter-js) — MIT License
- [poly-decomp](https://github.com/schteppe/poly-decomp.js) — MIT License
