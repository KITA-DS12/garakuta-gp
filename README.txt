ガラクタGP — ファイル構成

index.html        エントリ(これをブラウザで開くだけで動く)
css/style.css     見た目ぜんぶ(ピット小屋デザイン+スマホ対応)
js/core.js        乱数・48パラメータ設計図
js/cards.js       カード定義・手描きアイコン・呪い・命名・称号
js/terrain.js     コース生成(日替わりセットピース・難度帯域)
js/machine.js     マシン組み立て(Matter.jsの剛体・拘束)
js/audio.js       効果音(WebAudio合成、外部音源なし)
js/race.js        レース進行・ゴースト録画・激突ダメージ
js/render.js      描画・カメラ・ミニマップ・画面バナー
js/ui.js          カードUI・呪い開封・URLリレー・リザルト・起動

メモ:
- ES modulesではなく素のscriptを順番に読む方式(file://直開きでも動く)。
  読み込み順に依存があるので index.html のscriptタグの順は変えないこと。
- 外部依存は matter-js と poly-decomp(cdnjs)のみ。サーバー不要。
- 1ファイル版が必要なときは、style.cssを<style>に、jsを上記の順で
  ひとつの<script>に連結すれば元に戻る。
