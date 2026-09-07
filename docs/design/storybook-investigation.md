# Storybook導入 調査記録

## 目的

`packages/extension` へ Storybook を導入し、`OnboardingPage.tsx` の各ステップ
（`OnboardingStep` × `StepPhase` の組み合わせ）を個別に確認できるようにする
試みを行った。作業時間の制約により完了に至らなかったため、原因と得られた
知見を記録する。

## 採用した方針（概要）

- `OnboardingPage` は自身の状態を `useOnboardingState` フックで管理しており、
  Props を受け取らない。そのため、各ステップ用の Story を個別に自作する
  のではなく、`useOnboardingState.ts` に既に存在する e2e 用の URL 上書き
  機構（`?step=SEARCH&phase=value_shown`、`e2e/onboarding-shots.spec.ts` が
  スクリーンショット撮影に使用しているもの）を Storybook からも流用する
  方針を取った。
- `chrome.*` API は Storybook のプレビュー用に独自モック（`chrome.storage`
  のメモリ実装、`chrome.i18n.getMessage` の実メッセージ引き当て等）を用意
  し、`Storage.setCommands(getDefaultCommands(locale))` を Story 読み込み時
  に実行して、本番の初回インストール時と同じ状態を再現する設計とした。

## 遭遇した問題と原因

### 1. Storybook の Vite ビルダーが、拡張機能用の `vite.config.ts` を自動で読み込んでしまう

- `@storybook/react-vite` は既定で `.storybook` の親ディレクトリにある
  `vite.config.ts` を自動検出し、Storybook 用の設定にマージする仕様になっ
  ている（`@storybook/builder-vite` 内部の `getBuilderOptions()` /
  `loadConfigFromFile()`）。
- 本プロジェクトの `vite.config.ts` は Chrome 拡張機能のビルド専用で、
  `@crxjs/vite-plugin`（manifest.json の解釈やコンテンツスクリプトの特別
  なバンドリング）や、Shadow DOM 環境向けにカスタムした
  `vite-plugin-css-injected-by-js` の `injectCodeFunction`
  （`document.getElementById("selection-command")?.shadowRoot ?? document.head`
  への注入）を含んでいる。
- これが Storybook のプレビュー（通常の DOM ページ）に対しても適用されて
  しまい、
  - `@crxjs/vite-plugin` の HMR ハンドラがエラーを送出してオーバーレイ
    表示になる
  - CSS が期待通り `<style>` タグとして注入されない（Tailwind の生成物
    自体は正しいのに、実際のDOMには反映されない）
    という2つの不具合を引き起こしていた。
- **対策**: `.storybook/main.ts` の `core.builder.options.viteConfigPath`
  に、拡張機能とは無関係の空の `vite.config.ts` を指定し、本来の
  `vite.config.ts` が読み込まれないようにすることで、HMR エラーと
  Shadow DOM 向け CSS 注入コードの混入は解消した。

### 2. `chrome` グローバルのモック順序・カバレッジ不足によるハング

- `commandStorage.ts` など一部のモジュールは、**import された時点**（トッ
  プレベル）で `chrome.storage.onChanged.addListener(...)` を呼び出す。
  そのため、Storybook のプレビュー側で `chrome` のモックを設定するコード
  は、アプリ本体のどのモジュールよりも先に評価される必要があった
  （ESM の import 文はファイル内の他の文より先に評価されるため、モック
  用モジュールは import 文の先頭に置く、かつ本体コードを import しない
  独立したファイルにする、という工夫が必要だった）。
- `services/storage/index.ts` の `debouncedSyncSet()` は、
  `chrome.storage.sync.set(items, callback)` という**コールバック形式**
  で呼び出している。Storybook 用のモックを Promise ベースのみで実装して
  いたためコールバックが一切呼ばれず、`Storage.setCommands()` の
  Promise が永久に解決しない（＝ Story の初期化処理がハングする）という、
  原因の特定が難しい不具合が発生した。
  - 症状としては「Storybook のプレビューがローディングスピナーのまま
    止まる」だけで、コンソールにもエラーが出ないため、`chrome.storage`
    まわりの実装差異に気づくまでに時間を要した。
- **対策**: モックの `set`/`remove`/`clear` を、Promise を返しつつ
  コールバック引数が渡された場合はそれも呼び出す形に修正し、解消した。

### 3. 自動化ブラウザに実機の拡張機能がインストールされていたことによるノイズ

- 動作確認に使用したブラウザ（claude-in-chrome）に、この拡張機能自体の
  開発ビルドと思われる拡張機能が既にインストールされており、あらゆる
  ページ（Storybook のプレビュー含む）に content script や Vite の
  HMR クライアントを注入していた。
- これにより、コンソールログやネットワークログに無関係な
  `chrome-extension://...` 由来のログが大量に混入し、問題の切り分け
  （どこまでが自分たちの Storybook 由来で、どこからが無関係な拡張機能
  由来か）が難しくなった。

## 未解決だった点

- 上記 1, 2 を解消した直後の時点で、Tailwind のユーティリティクラス自体
  は正しく生成されるようになっていたが、実際にブラウザへ注入された
  `<style>` タグには反映されておらず、`@/components/App.css` の Vite
  モジュールを直接 `import()` しても `<style data-vite-dev-id="...">`
  が生成されない事象が残っていた。原因（Vite のモジュールキャッシュ、
  もしくは項番3のノイズの影響）を切り分けている途中で作業を打ち切った。

## 次回への申し送り

- `.storybook/main.ts` で `viteConfigPath` を明示的に空の設定に差し替え
  る対策は有効だったので、再挑戦する場合はこの対策を先に適用した状態
  から始めるとよい。
- `chrome.storage.*` のモックは、コールバック形式・Promise形式の両方を
  サポートする実装にしておく（`src/test/setup.ts` の Vitest 用モックも
  同様の考慮がされているため、参考にできる）。
- 動作確認は、他の拡張機能がインストールされていないクリーンなブラウザ
  プロファイルで行うことを推奨する。
