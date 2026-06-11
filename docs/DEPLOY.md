# デプロイ手順 — garakuta.mu-k.net

`garakuta-gp` を **S3 + CloudFront + Route 53 + ACM** で `https://garakuta.mu-k.net` に配信するための手順書。

- インフラ初期構築（このページ）は **1 回だけ** 実施
- 通常のデプロイは `make deploy` 一発（[使い方は最後](#日常運用)）

---

## 構築済みリソース（2026-06-12 時点）

初期構築は **AWS CLI で実施済み**。以下が実際に作成されたリソース。
再構築や調査のときの参照用。

| リソース | 値 |
|---|---|
| ACM 証明書 (us-east-1) | `arn:aws:acm:us-east-1:659807509935:certificate/b67abaae-2bcd-429b-8c48-7cec655aac57` |
| S3 バケット | `garakuta.mu-k.net`（リージョン **us-east-1**） |
| CloudFront ディストリビューション | `E263RS05YUXNHX` (`d12c9q7ub7cep6.cloudfront.net`) |
| Origin Access Control | `EYIJXY15E8RDR` |
| Route 53 ホストゾーン | `Z04088612OF3DM1KHJUPS` (`mu-k.net`) |

> ⚠️ S3 バケットは前例 tsururin に合わせて **us-east-1** に作成した
> （tsururin の実バケットも us-east-1。以下のコンソール手順の「東京リージョン」記述より、こちらが実態）。

---

## 前提

- AWS アカウントにアクセスできる（`mu-k.net` は Route 53 ホストゾーンで管理済み）
- AWS CLI v2 がインストール済み（`aws --version`）
- AWS 認証が有効（`aws sts get-caller-identity` でアカウントが返る）
  - セッションが切れていたら `aws login`（または SSO 環境なら `aws sso login`）で再認証

---

## 構成図

```
ユーザー
  ↓ HTTPS
Route 53 ── A(Alias) ──→ CloudFront ──(OAC)──→ S3 バケット
  (mu-k.net)              + ACM(SSL)              garakuta.mu-k.net
                          + 代替ドメイン
                            garakuta.mu-k.net
```

---

## 手順

### 1. ACM 証明書を発行（**リージョン: us-east-1 必須**）

CloudFront に紐付ける証明書は **必ず バージニア北部 (us-east-1)** で作る。

1. AWS コンソールで **リージョンを「米国東部（バージニア北部）us-east-1」に切り替える**
2. **Certificate Manager → 証明書をリクエスト → パブリック証明書**
3. ドメイン名: `garakuta.mu-k.net`
4. 検証方法: **DNS 検証** を選択 → リクエスト
5. 発行された証明書を開き、**「Route 53 でレコードを作成」** ボタンを押すと自動で CNAME が追加される
6. **ステータスが「発行済み」になるまで数分待つ**（通常 1〜5 分）

---

### 2. S3 バケットを作成（リージョン: us-east-1）

1. **米国東部（バージニア北部）us-east-1 に切り替える**（前例 tsururin と同じ）
2. **S3 → バケットを作成**
3. バケット名: **`garakuta.mu-k.net`**（ドメインと同名にしておくと管理しやすい）
4. **「パブリックアクセスをすべてブロック」をオンのまま**（OAC 経由でしかアクセスさせない）
5. バケットバージョニング: 任意（オフでも OK）
6. 作成

> このあと CloudFront 側で OAC を作るときに、必要なバケットポリシーが自動で生成されるので、ここでは何も追加設定しない。

---

### 3. CloudFront ディストリビューションを作成

1. AWS コンソールで **CloudFront → ディストリビューションを作成**
2. **オリジン**:
   - オリジンドメイン: **`garakuta.mu-k.net.s3.us-east-1.amazonaws.com`** を選択
     - ⚠️ プルダウンに「ウェブサイトエンドポイント」と「REST API エンドポイント」の両方が出る場合は **REST API エンドポイント**（`*.s3.us-east-1.amazonaws.com`）を選ぶ
   - 名前: 自動入力でよい
   - **オリジンアクセス**: **「Origin access control settings (recommended)」** を選択
     - 「Create new OAC」→ デフォルト設定でOK
3. **デフォルトのキャッシュ動作**:
   - ビューワープロトコルポリシー: **Redirect HTTP to HTTPS**
   - 許可された HTTP メソッド: GET, HEAD
   - キャッシュキーとオリジンリクエスト: **CachingOptimized** ポリシー
4. **設定**:
   - 価格クラス: 「すべてのエッジロケーションを使用」または「北米・欧州・アジアのみ」
   - **代替ドメイン名 (CNAME)**: `garakuta.mu-k.net`
   - **カスタム SSL 証明書**: 先ほど発行した `garakuta.mu-k.net` の証明書を選択
   - **デフォルトルートオブジェクト**: `index.html`
5. **作成**
6. 作成後、CloudFront の画面に **「S3 バケットポリシーを更新する必要があります」** のバナーが出るので、**「ポリシーをコピー」→ S3 バケットの「アクセス許可」タブで貼り付け** て保存
7. 配信ステータスが **「有効」** になるまで待つ（5〜15 分）
8. ディストリビューションの **ID（例: `E1A2B3C4D5E6F7`）** と **ドメイン名（例: `d1234abcd.cloudfront.net`）** をメモ

---

### 4. Route 53 にレコードを追加

1. Route 53 → ホストゾーン → `mu-k.net`
2. **レコードを作成**
3. レコード名: **`garakuta`**（フルだと `garakuta.mu-k.net`）
4. レコードタイプ: **A**
5. **エイリアス: オン**
6. ルーティング先: **CloudFront ディストリビューションへのエイリアス** → 先ほど作った distribution を選択
7. 作成
8. （任意）IPv6 用に **AAAA レコード** も同じ要領で追加

DNS 伝播後、`https://garakuta.mu-k.net` でアクセス可能になる（通常 1 分以内、長くて TTL 分）。

---

### 5. ローカルに `.env` を作成

```bash
cp .env.example .env
```

`.env` を開いて以下を設定:

```env
S3_BUCKET=garakuta.mu-k.net
CF_DISTRIBUTION_ID=E1A2B3C4D5E6F7   # 手順 3 で控えた ID
```

---

### 6. 初回デプロイ

```bash
make deploy
```

数分後、`https://garakuta.mu-k.net` で表示されれば完了。

---

## 日常運用

```bash
# コード変更 → 動作確認 → コミット → デプロイ
make dev        # ローカル確認 (http://localhost:8000)
git commit ...
make deploy     # S3 アップロード + CloudFront キャッシュ無効化
```

### `make deploy` の中身

1. `aws s3 sync . s3://$S3_BUCKET --delete --exclude "*" --include ...`
   - 配信に必要なファイル（`index.html` / `css` / `js` / 画像 / `robots.txt` / `sitemap.xml`）だけアップロードし、不要なファイルはバケットから削除
   - `node_modules/`, `tools/`, `docs/`, `README.txt`, `Makefile`, `.git/` などは含まれない
2. `index.html` だけ短めの Cache-Control (60 秒) で上書き（即反映のため）
3. `aws cloudfront create-invalidation --paths "/*"` でエッジキャッシュを破棄

### 部分操作

```bash
make sync         # S3 同期のみ
make invalidate   # CloudFront キャッシュ無効化のみ
```

---

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| `403 Forbidden` | バケットポリシーが反映されていない／OAC がディストリビューションに紐付いていない。CloudFront コンソールから「ポリシーをコピー」して S3 に貼り直す |
| `https://` がブラウザで赤い警告 | ACM の証明書が us-east-1 にない／CloudFront に紐付いていない／代替ドメイン名が設定されていない |
| デプロイしたのに変わらない | CloudFront のキャッシュ。`make invalidate` を実行、または数分待つ |
| `make deploy` で `S3_BUCKET が未設定` エラー | `.env` を作成していない、または値が空 |
| `aws: error: Your session has expired` | `aws login`（または SSO 環境なら `aws sso login`）で再認証 |

---

## 参考

- 同じ構成の前例: `tsururin` → `https://tsururin.mu-k.net`
- [AWS Static website hosting (S3 + CloudFront)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/website-hosting-cloudfront-walkthrough.html)
- [Restricting access to an Amazon S3 origin (OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
