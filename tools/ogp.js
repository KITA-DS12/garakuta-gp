/* node tools/ogp.js — OGP画像(1200×630)を生成して ogp.png に出力 */
'use strict';
const sharp = require('sharp');
const path = require('path');

const W = 1200, H = 630;

// サイトと同じトーン(css/style.css の CSS 変数)
const INK = '#2e2a24', PAPER = '#d9c79d', PAPER2 = '#cdb98c',
      PLATE = '#39483f', PLATE_D = '#2a352e', CHALK = '#f0e8d4', RED = '#c2401c';

// フォント: ゲーム本体と同じヒラギノ(macOS 標準。MPLUSRounded1c は未導入のため)
const FONT = 'Hiragino Sans';

// ガラクタマシン: 板きれボディ + 不揃いタイヤ + 木箱 + 旗
function machine() {
  return `
  <!-- 砂ぼこり -->
  <circle cx="-130" cy="150" r="26" fill="${CHALK}" opacity=".5"/>
  <circle cx="-170" cy="120" r="17" fill="${CHALK}" opacity=".35"/>
  <circle cx="-105" cy="105" r="12" fill="${CHALK}" opacity=".3"/>
  <!-- 接地影 -->
  <ellipse cx="110" cy="208" rx="240" ry="22" fill="rgba(46,42,36,.22)"/>
  <!-- 板きれボディ(少し前のめり) -->
  <g transform="rotate(-5 110 80)">
    <rect x="-60" y="58" width="340" height="44" rx="8" fill="${PAPER2}" stroke="${INK}" stroke-width="6"/>
    <path d="M-30 80 H250" stroke="${INK}" stroke-width="3" stroke-dasharray="4 14" opacity=".4"/>
    <!-- 木箱(積み荷) -->
    <rect x="30" y="-32" width="96" height="90" rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="6"/>
    <path d="M30 13 H126 M78 -32 V58" stroke="${INK}" stroke-width="4" opacity=".5"/>
    <!-- バネ -->
    <path d="M160 58 q14 -16 0 -30 q-14 -14 0 -28" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="160" cy="-8" r="13" fill="${RED}" stroke="${INK}" stroke-width="5"/>
    <!-- 旗 -->
    <rect x="240" y="-66" width="9" height="128" rx="4.5" fill="${INK}"/>
    <path d="M249 -62 L330 -40 L249 -14 Z" fill="${RED}"/>
  </g>
  <!-- 後輪(大) -->
  <g transform="translate(-10 150)">
    <circle r="62" fill="${INK}"/>
    <circle r="48" fill="none" stroke="${CHALK}" stroke-width="6" stroke-dasharray="16 13" opacity=".45"/>
    <circle r="28" fill="${PAPER}"/>
    <circle r="9" fill="${INK}"/>
    <circle cx="0" cy="-18" r="4.5" fill="${INK}"/>
    <circle cx="-16" cy="9" r="4.5" fill="${INK}"/>
    <circle cx="16" cy="9" r="4.5" fill="${INK}"/>
  </g>
  <!-- 前輪(小・不揃い) -->
  <g transform="translate(235 168)">
    <circle r="44" fill="${INK}"/>
    <circle r="33" fill="none" stroke="${CHALK}" stroke-width="5" stroke-dasharray="11 9" opacity=".45"/>
    <circle r="19" fill="${PAPER2}"/>
    <circle r="7" fill="${INK}"/>
  </g>
  <!-- スピード線 -->
  <path d="M-250 60 H-150 M-270 95 H-160 M-255 130 H-175" stroke="${INK}" stroke-width="8" stroke-linecap="round" opacity=".35"/>`;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- 地: 紙(作業場の壁) -->
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="#c2b394" opacity=".45"/>
  <!-- 外枠 -->
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="10" fill="none" stroke="${INK}" stroke-width="5" opacity=".75"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="6" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="10 8" opacity=".35"/>

  <!-- 左: チョーク看板のタイトル -->
  <g transform="translate(70 80)">
    <rect x="0" y="0" width="600" height="220" rx="14" fill="${PLATE}" stroke="${PLATE_D}" stroke-width="8"/>
    <rect x="14" y="14" width="572" height="192" rx="8" fill="none" stroke="${CHALK}" stroke-width="2.5" stroke-dasharray="8 7" opacity=".4"/>
    <g transform="skewX(-4)">
      <text x="312" y="142" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="118" letter-spacing="2" fill="${RED}" opacity=".55">ガラクタGP</text>
      <text x="306" y="136" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="118" letter-spacing="2" fill="${CHALK}">ガラクタGP</text>
    </g>
    <text x="300" y="190" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="26" letter-spacing="12" fill="${CHALK}" opacity=".75">— PIT GARAGE —</text>
  </g>

  <!-- サブコピー -->
  <text x="80" y="408" font-family="${FONT}" font-weight="700" font-size="40" fill="${INK}">ひろったガラクタでマシンを組んで、10本勝負。</text>

  <!-- 特徴チップ -->
  <g font-family="${FONT}" font-weight="700" font-size="27" fill="${CHALK}">
    <rect x="76" y="460" width="246" height="58" rx="29" fill="${INK}"/>
    <text x="199" y="499" text-anchor="middle">日替わりコース</text>
    <rect x="338" y="460" width="216" height="58" rx="29" fill="${INK}"/>
    <text x="446" y="499" text-anchor="middle">ぜんぶ物理</text>
    <rect x="570" y="460" width="276" height="58" rx="29" fill="${RED}"/>
    <text x="708" y="499" text-anchor="middle">URLで対戦リレー</text>
  </g>

  <!-- 右: ガラクタマシン(タイトル看板の右、上段に配置) -->
  <g transform="translate(905 195) scale(0.7)">${machine()}</g>
</svg>`;

const out = path.join(__dirname, '..', 'ogp.png');
sharp(Buffer.from(svg), { density: 96 })
  .resize(W, H)
  .png({ compressionLevel: 9 })
  .toFile(out)
  .then(() => console.log('OK ' + out))
  .catch((e) => { console.error(e); process.exit(1); });
