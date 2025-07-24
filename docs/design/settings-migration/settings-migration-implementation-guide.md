# Settings.get 移行実装ガイド

## 直接置換による移行実装手順

### 1. 高優先度: background_script.ts の移行

**現在の使用箇所:**

1. Line 77: `addPageRule` 関数内
2. Line 272: `toggleStar` 関数内
3. Line 358: `executeCommand` 関数内
4. Line 552: `onCommand` 関数内

**移行手順:**

1. **インポート変更:**

```typescript
// 変更前
import { Settings } from "@/services/settings/settings"

// 変更後
import { enhancedSettings } from "@/services/settings/enhancedSettings"
```

2. **メソッド呼び出し変更:**

```typescript
// Line 77, 272, 358, 552での変更
// 変更前: const settings = await Settings.get()
// 変更後: const settings = await enhancedSettings.get()
```

### 2. 中優先度: サービスファイルの移行

#### commandMetrics.ts

```typescript
// 変更前: const settings = await Settings.get()
// 変更後: const settings = await enhancedSettings.get()
```

#### contextMenus.ts

```typescript
// 変更前: const settings = await Settings.get()
// 変更後: const settings = await enhancedSettings.get()
```

### 3. 中優先度: オプションコンポーネントの移行

#### SettingForm.tsx

```typescript
// 変更前: const settings = await Settings.get(true)
// 変更後: const settings = await enhancedSettings.get({ excludeOptions: true })
```

#### ImportExport.tsx

```typescript
// 変更前: const currentSettings = await Settings.get()
// 変更後: const currentSettings = await enhancedSettings.get()
```

## 移行チェックリスト

### ファイル別移行チェック

#### background_script.ts

- [ ] Line 77: addPageRule 関数の移行
- [ ] Line 272: toggleStar 関数の移行
- [ ] Line 358: executeCommand 関数の移行
- [ ] Line 552: onCommand 関数の移行

#### commandMetrics.ts

- [ ] incrementCommandExecutionCount 関数の移行

#### contextMenus.ts

- [ ] ContextMenu.init 関数の移行

#### SettingForm.tsx

- [ ] Line 138: 設定取得処理の移行
- [ ] Line 193: 設定取得処理の移行

#### ImportExport.tsx

- [ ] Line 271, 303, 317, 332: 設定取得処理の移行

### 品質確認

- [ ] 全てのテストが成功すること
- [ ] TypeScriptビルドが成功すること
- [ ] ESLintチェックが成功すること
- [ ] Chrome拡張機能での動作テスト

## テスト実行手順

### 移行後の必須テスト

```bash
# 単体テストの実行
yarn test

# TypeScriptのビルドチェック
yarn build

# ESLintでのコード品質チェック
yarn lint
```

### 機能テスト項目

1. **設定の読み込み**: オプションページでの設定表示
2. **コマンド実行**: 各種コマンドの正常動作
3. **コンテキストメニュー**: 右クリックメニューの表示
4. **ページルール**: URL別設定の適用

## 移行時の注意点

### パラメータ変換

- `Settings.get()` → `enhancedSettings.get()`
- `Settings.get(true)` → `enhancedSettings.get({ excludeOptions: true })`
- `Settings.get(false)` → `enhancedSettings.get({ excludeOptions: false })`

### インポート文の変更

各ファイルで以下のインポート変更が必要：

```typescript
// 削除
import { Settings } from "@/services/settings/settings"

// 追加
import { enhancedSettings } from "@/services/settings/enhancedSettings"
```

### テストファイルの更新

関連するテストファイルも同様に更新が必要。特に：

- モック設定の変更
- テストケースでの呼び出し方法の変更
