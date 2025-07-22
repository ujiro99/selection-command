# Settings.get 移行実装ガイド

## 移行戦略の詳細実装手順

### Phase 1: 後方互換性の確保

#### 1.1 EnhancedSettings.get() のオーバーロード実装

```typescript
// src/services/settings/enhancedSettings.ts
export class EnhancedSettings {
  // 既存のget()メソッドに加えて、後方互換性のためのオーバーロードを追加

  // レガシー互換性のためのオーバーロード
  async get(excludeOptions: boolean): Promise<SettingsType>
  // 新しいインターフェース
  async get(options: GetSettingsOptions): Promise<SettingsType>
  // 実装
  async get(
    optionsOrExcludeOptions?: GetSettingsOptions | boolean,
  ): Promise<SettingsType> {
    // boolean の場合（レガシー）
    if (typeof optionsOrExcludeOptions === "boolean") {
      return this.get({ excludeOptions: optionsOrExcludeOptions })
    }

    // オブジェクトまたは undefined の場合（新しいインターフェース）
    const options = optionsOrExcludeOptions || {}

    // 既存の実装を呼び出し
    return this.getImpl(options)
  }

  // 既存のget実装をgetImplに名前変更
  private async getImpl(
    options: GetSettingsOptions = {},
  ): Promise<SettingsType> {
    // 現在のget()の実装をここに移動
    // ...
  }
}
```

#### 1.2 Settings.get() への段階的警告追加

```typescript
// src/services/settings/settings.ts
export const Settings = {
  get: async (excludeOptions = false): Promise<SettingsType> => {
    // 移行期間中の警告ログ
    console.warn(
      "[DEPRECATED] Settings.get() is deprecated. " +
        "Use enhancedSettings.get() instead. " +
        "This method will be removed in a future version.",
    )

    // 既存の実装...
    // ...
  },

  // その他の既存メソッド...
}
```

### Phase 2: 段階的移行実装

#### 2.1 高優先度: background_script.ts の移行

**現在の使用箇所:**

1. Line 77: `addPageRule` 関数内
2. Line 272: `toggleStar` 関数内
3. Line 358: `executeCommand` 関数内
4. Line 552: `onCommand` 関数内

**移行後のコード:**

```typescript
// src/background_script.ts

// インポート変更
import { enhancedSettings } from "@/services/settings/enhancedSettings"

// 各使用箇所の変更

// Line 77: addPageRule 関数
[BgCommand.addPageRule]: (param: addPageRuleProps): boolean => {
  const add = async () => {
    // 変更前: const settings = await Settings.get()
    const settings = await enhancedSettings.get()
    // 以下既存ロジック...
  }
}

// Line 272: toggleStar 関数
[BgCommand.toggleStar]: (param: toggleStarProps): boolean => {
  const toggle = async () => {
    // 変更前: const settings = await Settings.get()
    const settings = await enhancedSettings.get()
    // 以下既存ロジック...
  }
}

// Line 358: executeCommand 関数
const executeCommand = async (
  commandId: string,
  width: number,
  height: number,
) => {
  // 変更前: const obj = await Settings.get()
  const obj = await enhancedSettings.get()
  // 以下既存ロジック...
}

// Line 552: onCommand 関数
chrome.commands.onCommand.addListener(async (commandName, tab) => {
  try {
    // 変更前: const settings = await Settings.get()
    const settings = await enhancedSettings.get()
    // 以下既存ロジック...
  }
})
```

#### 2.2 中優先度: その他のサービス移行

**commandMetrics.ts の移行:**

```typescript
// src/services/commandMetrics.ts

// インポート変更
import { enhancedSettings } from "@/services/settings/enhancedSettings"

export const incrementCommandExecutionCount = async (
  tabId?: number,
): Promise<void> => {
  try {
    // 変更前: const settings = await Settings.get()
    const settings = await enhancedSettings.get()

    // 以下既存ロジック...
  }
}
```

**contextMenus.ts の移行:**

```typescript
// src/services/contextMenus.ts

// インポート変更
import { enhancedSettings } from "@/services/settings/enhancedSettings"

export const ContextMenu = {
  init: () => {
    // 既存ロジック...
    chrome.contextMenus.removeAll(async () => {
      chrome.contextMenus.onClicked.removeListener(ContextMenu.onClicked)
      // 変更前: const settings = await Settings.get()
      const settings = await enhancedSettings.get()

      // 以下既存ロジック...
    })
  },
  // ...
}
```

### Phase 3: 完全移行とクリーンアップ

#### 3.1 Settings.get() の削除

```typescript
// src/services/settings/settings.ts

export const Settings = {
  // get メソッドを削除
  // get: async (excludeOptions = false): Promise<SettingsType> => { ... },

  // 他のメソッドは維持
  set: async (data: SettingsType, serviceWorker = false): Promise<boolean> => {
    // 既存実装...
  },

  update: async <T extends keyof SettingsType>(...) => {
    // 既存実装...
  },

  // ...その他のメソッド
}
```

#### 3.2 EnhancedSettings.get() のオーバーロード削除

```typescript
// src/services/settings/enhancedSettings.ts

export class EnhancedSettings {
  // オーバーロードを削除し、元のシンプルな実装に戻す
  async get(options: GetSettingsOptions = {}): Promise<SettingsType> {
    // getImplの内容を元に戻す
    const {
      sections = [
        CACHE_SECTIONS.COMMANDS,
        CACHE_SECTIONS.USER_SETTINGS,
        CACHE_SECTIONS.STARS,
        CACHE_SECTIONS.SHORTCUTS,
        CACHE_SECTIONS.USER_STATS,
      ],
      forceFresh = false,
      excludeOptions = false,
    } = options

    // 既存実装...
  }
}
```

## 移行チェックリスト

### Phase 1 チェックリスト

- [ ] EnhancedSettings.get() のオーバーロード実装
- [ ] Settings.get() への警告ログ追加
- [ ] 単体テストでの後方互換性確認
- [ ] 既存テストが全て成功すること

### Phase 2 チェックリスト

#### background_script.ts

- [ ] Line 77: addPageRule 関数の移行
- [ ] Line 272: toggleStar 関数の移行
- [ ] Line 358: executeCommand 関数の移行
- [ ] Line 552: onCommand 関数の移行
- [ ] 拡張機能のビルドが成功すること
- [ ] Chrome拡張機能での動作テスト

#### commandMetrics.ts

- [ ] incrementCommandExecutionCount 関数の移行
- [ ] コマンド実行カウントの正常動作確認

#### contextMenus.ts

- [ ] ContextMenu.init 関数の移行
- [ ] コンテキストメニューの正常表示確認

### Phase 3 チェックリスト

- [ ] Settings.get() メソッドの削除
- [ ] EnhancedSettings.get() オーバーロードの削除
- [ ] 警告ログの削除
- [ ] 全テストの成功確認
- [ ] 本番環境での動作テスト

## テスト実行手順

### 各Phase後のテスト

```bash
# 単体テストの実行
yarn test

# TypeScriptのビルドチェック
yarn build

# ESLintでのコード品質チェック
yarn lint

# 拡張機能のビルドチェック
yarn zip
```

### 手動テスト項目

#### 機能テスト

1. **設定の読み込み**: オプションページでの設定表示
2. **コマンド実行**: 各種コマンドの正常動作
3. **コンテキストメニュー**: 右クリックメニューの表示
4. **ページルール**: URL別設定の適用
5. **ショートカット**: キーボードショートカットの動作

#### パフォーマンステスト

1. **初回読み込み時間**: ページ読み込み後の設定取得時間
2. **キャッシュ効果**: 2回目以降の設定取得時間
3. **メモリ使用量**: Chrome DevTools でのメモリ監視

## ロールバック手順

### 緊急時のロールバック

```bash
# 直前のコミットに戻す
git revert HEAD

# 特定のファイルのみロールバック
git checkout HEAD~1 -- src/services/settings/enhancedSettings.ts

# キャッシュのクリア（必要に応じて）
# Chrome拡張機能での storage.local.clear() 実行
```

### データ整合性の確認

```bash
# 拡張機能の再読み込み
# chrome://extensions/ でReloadボタンクリック

# 設定データの確認
# Chrome DevTools > Application > Storage で確認
```

## 注意事項

### Critical Points

1. **background_script.ts**: 最も重要なファイル、慎重に移行する
2. **キャッシュの影響**: `forceFresh: true` オプションを適切に使用
3. **マイグレーション**: 既存のデータマイグレーション処理を維持する
4. **テスト環境**: 本番環境と同じ条件でのテスト実施

### トラブルシューティング

1. **キャッシュ問題**: settingsCache.invalidateAll() でキャッシュクリア
2. **型エラー**: TypeScript の型定義確認
3. **動作不良**: Chrome DevTools でのエラーログ確認
4. **パフォーマンス劣化**: パフォーマンス計測とボトルネック特定
