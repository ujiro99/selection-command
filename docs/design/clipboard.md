# クリップボード読み取り

Chrome 116相当以降を対象とし、Service Workerからの読み取りは
`readClipboard()` → `readOffscreenClipboard()` に統一する。
`clipboard.html` による表示タブ・ウィンドウでの読み取りは使用しない。

## 作成コストと再利用

- 最初の読み取りでOffscreen Documentを遅延作成する。
- 読み取り後もドキュメントを維持し、次回以降は同じドキュメントを再利用する。
- 読み取りは直列化し、同時要求による二重作成や結果の混在を防ぐ。
- Service Worker再起動時も `runtime.getContexts()` で既存ドキュメントを検出する。
- Chromeによってドキュメントが破棄された場合は、次の要求で再作成する。
- textareaの内容は読み取り直後に消去し、クリップボード本文を保持しない。

Offscreen Documentを表示先のタブ・ウィンドウへ転用するAPIはないため、
従来の「読み取り画面を表示先として転用する」最適化はそのまま移植できない。
代わりに、読み取り側のドキュメントを要求間で再利用する設計とする。

従来は、表示先タブ・ウィンドウで読み取った後、その画面を目的URLへ遷移させていた。
新方式では読み取り用のドキュメントを繰り返し再利用し、表示先は完成したURLで
一度だけ作成する。初回は非表示ドキュメントの作成待ちが必要だが、次回以降は
読み取りごとの作成・破棄と、表示先での中間ページの読み込みを避けられる。
ブラウザによるレンダラープロセスの割り当ては制御しないため、
初回を含めて常に高速になるとは保証しない。

## 読み取りAPI

Offscreen Documentはフォーカスできない。検証環境では
`navigator.clipboard.readText()` は存在するものの、
`Document is not focused` で失敗したため、`clipboardRead` 権限と
textareaへの `document.execCommand("paste")` を使用する。
APIを将来変更する際は、非フォーカス状態での読み取りが成立することを確認する。

- [Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
- [runtime.getContexts](https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getContexts)
