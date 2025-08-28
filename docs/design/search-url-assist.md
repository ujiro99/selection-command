# 検索URLの作成アシスト機能の設計

## 概要

検索URLは、Webに関する知識が無い作成が難しい。
検索URLアシスト機能により、ユーザーが簡単に検索URLを作成できるようにする。
このドキュメントでは、この検索URLアシスト機能の設計について説明する。

## 機能要件

- CommandEditDialogに「AIアシスト」ボタンを追加する。
  - このボタンを押すと、検索URLアシストダイアログが表示される。
  - ボタンの位置は、検索URLの入力欄の右側に配置する。
- 検索URLアシストダイアログには、以下の要素を含む。
  - 入力した検索キーワード
  - 検索結果ページのURL
  - Geminiで実行ボタン
- ユーザーの操作フロー
  1. ユーザーがCommandEditDialogで「AIアシスト」ボタンをクリックする。
  2. 検索URLアシストダイアログが表示される。
  3. ユーザーが検索キーワードと、検索結果ページのURLを入力する。
  4. 「Geminiで実行」ボタンをクリックする。
  5. Geminiが検索URLを生成し、ダイアログに表示する。
  6. ユーザーが生成された検索URLをコピーして、CommandEditDialogの検索URL欄に貼り付ける。

### Geminiで実行ボタンの動作

- 「Geminiで実行」ボタンをクリックすると、以下の処理が行われる。
  1. PageAction機能を使って、Geminiをポップアップで起動する
  2. 入力された検索キーワードと検索結果ページのURLをUserVariablesに設定する。
  3. 以下のプロンプトテンプレートへ、UserVariablesを展開し、プロンプトを作成
  4. プロンプトをGeminiのチャット欄へ入力、送信する。
  5. Gemini上で生成された検索URLが表示される。

### プロンプトテンプレート

```
User Input: Given a search result URL and the entered search keyword, generate a search URL template.

# Generation steps
1. Replace the value of the search keyword parameter with %s.
2. Remove unnecessary query parameters that are unrelated to the search itself (e.g., ad tracking IDs, session IDs). Keep parameters required for functionality such as language or search settings.

# User Input
* Search keyword: {{search_keyword}}
* Search result URL: {{search_result_url}}

# Example of generation
* Search keyword: test
* Search result URL: https://www.google.com/search?q=test&rlz=1C5CHFA_enJP1116JP1116&oq=test&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgYIARBFGDwyBggCEEUYPTIGCAMQRRhBMgYIBBBFGDzSAQgxOTE0ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8
* Search URL template: https://google.com/search?q=%s

# Output format
Output only the search URL template in plain text. Do not include anything else.
Example of valid output:
https://google.com/search?q=%s
```

### CommandEditDialogの検索URLについて

- Geminiからコピーされた検索URLは、マークダウンの形式で貼り付けられる。
- CommandEditDialogの検索URL欄に貼り付けた際に、マークダウン形式を解析し、純粋なURL部分のみを抽出して保存する。
