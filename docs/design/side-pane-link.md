## 1. 対象範囲

- selection command から開かれた **side panel 内の画面遷移** を、実際のブラウザナビゲーションではなく「side panel の URL 差し替え」として扱う。
- 実装対象:
  - side panel 内で動作する content script
  - service worker（background）
  - side panel 表示状態を持つ BgData（状態管理層）

---

## 2. side panel 上かどうかの判定要件

- 「この content script が side panel 上で動いているか」を判定するための条件:
  - BgData が保持する「side panel を表示中の tabId リスト」に、現在のタブ ID が含まれていること。
  - かつ、以下のいずれかを満たすこと:
    - 現在の URL が「side panel 用 URL」であると判定できる。
    - side panel とメインコンテンツが同じ URL を表示している場合は、ウィンドウ位置やレイアウト情報から「side panel 側」であることを判定すること。

---

## 3. side panel 内でのページ遷移フック要件（content script）

- side panel 上で動作していると判定できた場合のみ、遷移フックを有効化する。
- フック対象:
  - ユーザーのリンククリックなど、ページ遷移を引き起こす操作。
  - ただし、`target="_blank"` など、意図的に別タブ・ウィンドウで開くことを指定されている場合はフックを無効化する
- フック時の挙動:
  - ブラウザ標準のページ遷移は発生させない（キャンセルする）。
  - 遷移先 URL を取得し、service worker に「side panel の URL 更新要求」として通知する。

---

## 4. service worker による side panel URL 更新要件

- content script からの「side panel の URL 更新要求」を受け取ったら、以下を行う:
  - 対象 tabId が「side panel 表示中タブリスト」に含まれていることを確認する。
  - 対象の side panel の URL を更新するための API を呼び出し、side panel の表示内容を遷移先 URL に切り替える。
- URL 更新後の状態管理:
  - BgData 上で、その tabId の side panel に紐づく「現在 URL」を更新する。
  - 必要に応じて、履歴やその他の管理情報も更新できるようにしておく。

---

## 5. 状態管理要件（BgData）

- 少なくとも以下の情報を持つ:
  - side panel を表示中の tabId の集合（リストまたはセット）。
  - 各 tabId ごとの side panel の現在 URL（＋必要に応じて追加情報）。
- 更新タイミング（例）:
  - side panel オープン／クローズ時。
  - service worker が URL 更新 API を呼び出したタイミング。
  - タブクローズ時など、不要になった状態のクリア。
