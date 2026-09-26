# このリポジトリのルール（公開ページ共通）

本番: https://mm738966m-boop.github.io/ai-aibou-shindan/
正本フォルダ: ~/Desktop/金融AIカレッジ/集客/診断サイト/

## 1. 計測は必ず入れる（例外なし）

**新しく公開ページを作るときは、計測タグを入れてから公開する。**
`_analytics.html` の中身を `</head>` の直前に貼るだけ。

- Meta Pixel `1510200123755162`（fulfull共通）。PageView は自動で飛ぶ。
- 流入元は URL の `?ref=` で分ける。`?ref=ig` `?ref=note` `?ref=line` `?ref=voicy` `?ref=yuko` など。
  `utm_source=` でも拾う。sessionStorage に保存するので、ページを移っても引き継がれる。
- 節目には必ずカスタムイベントを入れる:
  `fxTrack('イベント名',{任意のパラメータ})`
  すべてのイベントに `ref`（流入元）と `page`（タイトル）が自動で付く。

いま入っているイベント:

| ページ | イベント | 意味 |
|---|---|---|
| LP | `ToShindan` | 診断ページへ進んだ |
| LP | `LineTap` / `MailTap` | LINE・メールを押した |
| 診断 | `ShindanStart` | 診断を始めた |
| 診断 | `ShindanResult` | 結果まで到達（タイプ・金額つき） |
| 診断 | `LineTap` / `MailTap` | 結果からLINE・メールへ |

確認は Meta Events Manager の「テストイベント」「イベント」画面。

### Google広告の計測（2026-09-26〜・fulfull AW-763380159）

- 法人LP `hojin/` と受付完了 `hojin/thanks/` にGoogleタグ（gtag.js）を設置済み。
- 成果は2つ。`法人LP_LINEボタン押下`（send_to `AW-763380159/JCbaCJaK6IUdEL-DgewC`・LPのLineTapで送信）と、`法人LP_メール登録完了`（send_to `AW-763380159/rJgGCJOK6IUdEL-DgewC`・受付完了ページの表示で送信）。
- UTAGE法人シナリオ（3AguqHadI5TO）のメール登録フォームの登録後URL＝`hojin/thanks/`。空欄に戻すと登録完了が0件になる（勉強会で9/15〜起きた事故と同じ）。
- 表示確認は `hojin/thanks/?test=1`（成果を送らない）。
- LINEボタン押下は登録そのものではない。実際の登録はUTAGEの登録経路 hojin_lp / hojin_lp_mail で数える。

## 2. 公開前のチェック

- 計測タグが入っているか
- スマホ幅（375px）で崩れないか
- 料金・助成金の表記は、断定しない／保証しない（`集客/Voicyコラボ0916_LP/引き継ぎ指示_企業向けAI研修LP.md` の禁止事項に従う）
- `?ref=` 付きのURLを媒体ごとに用意してから配る

## 3. ディレクトリ

- `index.html` お金のプロのAI相棒診断（5タイプ・5問）
- `seminar/` AI仕事術勉強会LP（常設・日程はJSのSEMINAR設定）
- `seminar/kit/` 参加者向け設定文の配布ページ
- `voicy/` 企業向けAI研修LP（Voicyコラボ由来）
- `voicy/shindan/` 会社のAI度診断（業務別に時間・単価を調整→年間金額と費用対効果）
- `hojin/thanks/` 法人のメール登録 受付完了（Google・Metaの登録完了計測）
- `hojin/` 保険代理店・営業組織向けLP「おじいちゃんでもできる、保険営業のAI完全自動化」（法人・紺×金の勉強会LPと同系。CTA=fulfull.jpの換算診断フォーム ?ref=hojin_lp。イベント ToShindan/MailTap/BossCopy/ToSeminar・ボタン押下でLead）
- `kiyaku/` 受講規約　`tokusho/` 特商法
