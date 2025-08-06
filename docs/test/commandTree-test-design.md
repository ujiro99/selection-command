# CommandTreeサービスの単体テスト設計

## 設計概要

`src/services/option/commandTree.ts`は、コマンドとフォルダーの階層構造を操作するためのユーティリティ関数群です。コマンドとフォルダーの配列から木構造を構築し、平坦化や検索、レベル計算などの操作を提供します。

### 主要機能

1. **木構造の構築**: `toCommandTree()` - コマンドとフォルダーから階層構造を構築
2. **平坦化**: `toFlatten()` - 木構造を一次元配列に変換（インデックスとフラグ付与）
3. **検索機能**: `findNodeInTree()`, `findFirstCommand()` - 木構造からのノード検索
4. **レベル計算**: `calcLevel()` - ノードの階層レベル計算
5. **コレクション取得**: `getAllCommandsFromFolder()`, `getAllFoldersFromNode()` - 子要素の収集

### テスト対象の型

```typescript
export type CommandTreeNode = {
  type: "command" | "folder"
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

export type FlattenNode = {
  id: string
  index: number
  content: Command | CommandFolder
  firstChild?: boolean
  lastChild?: boolean
}
```

## 単体テストの設計

### `toCommandTree()` 関数のテスト

#### 基本機能のテスト

- **CT-01**: 正常系: 空の配列から空の木構造を作成
- **CT-02**: 正常系: ルートレベルのコマンドのみの木構造作成
- **CT-03**: 正常系: ルートレベルのフォルダーのみの木構造作成
- **CT-04**: 正常系: 親子関係のあるフォルダー構造の作成
- **CT-05**: 正常系: フォルダー内のコマンドを含む木構造作成
- **CT-06**: 正常系: 複数階層のネストした構造の作成

#### エラーハンドリングのテスト

- **CT-07**: 異常系: 存在しない親フォルダーIDを持つコマンドの処理（ルートレベルに配置される）
- **CT-08**: 異常系: 循環参照のあるフォルダー構造の処理（循環を検出し警告ログを出力）
- **CT-09**: 境界値: null/undefined入力の処理（空の木構造を返却）

#### 複雑なケースのテスト

- **CT-10**: 正常系: 親フォルダーが後から追加される場合の処理
- **CT-11**: 正常系: コマンドより先にフォルダーが処理される場合
- **CT-12**: 正常系: 同一フォルダーに複数のコマンドとサブフォルダーが存在する場合

### `toFlatten()` 関数のテスト

#### 基本機能のテスト

- **CT-13**: 正常系: 単純な木構造の平坦化（コマンドのみ）
- **CT-14**: 正常系: フォルダーのみの木構造の平坦化
- **CT-15**: 正常系: ネストした構造の平坦化とインデックス付与
- **CT-16**: 正常系: firstChild/lastChildフラグの正確な設定

#### エッジケースのテスト

- **CT-17**: 境界値: 空の木構造の平坦化
- **CT-18**: 正常系: 子要素のないフォルダーの平坦化
- **CT-19**: 正常系: 深くネストした構造（5層以上）の平坦化
- **CT-20**: 正常系: firstChild/lastChildフラグが正しい位置に設定される

### `findNodeInTree()` 関数のテスト

#### 基本機能のテスト

- **CT-21**: 正常系: ルートレベルのノード検索（コマンド）
- **CT-22**: 正常系: ルートレベルのノード検索（フォルダー）
- **CT-23**: 正常系: ネストしたノードの検索（深度2）
- **CT-24**: 正常系: 深くネストしたノードの検索（深度3以上）

#### エラーケースのテスト

- **CT-25**: 異常系: 存在しないIDでの検索（null返却）
- **CT-26**: 境界値: 空の木構造での検索（null返却）
- **CT-27**: 境界値: 空文字のIDでの検索

### `findFirstCommand()` 関数のテスト

#### 基本機能のテスト

- **CT-28**: 正常系: フォルダー直下の最初のコマンド検索
- **CT-29**: 正常系: ネストしたフォルダー内の最初のコマンド検索
- **CT-30**: 正常系: フォルダーとコマンドが混在する場合の最初のコマンド検索

#### エラーケースのテスト

- **CT-31**: 異常系: コマンドが存在しないフォルダーでの検索（null返却）
- **CT-32**: 境界値: 子要素のないノードでの検索（null返却）
- **CT-33**: 異常系: フォルダーのみで構成された階層での検索

### `calcLevel()` 関数のテスト

#### 基本機能のテスト

- **CT-34**: 正常系: ルートレベル（レベル0）の計算
- **CT-35**: 正常系: 1階層目（レベル1）の計算
- **CT-36**: 正常系: 多階層ネスト（レベル3以上）のレベル計算
- **CT-37**: 正常系: FlattenNode型の入力でのレベル計算
- **CT-38**: 正常系: Command型の入力でのレベル計算
- **CT-39**: 正常系: CommandFolder型の入力でのレベル計算

#### エラーケースのテスト

- **CT-40**: 異常系: 存在しない親フォルダーIDの処理（レベル0を返却）
- **CT-41**: 境界値: parentFolderIdがROOT_FOLDERの場合（レベル0）
- **CT-42**: 境界値: parentFolderIdがundefinedの場合（レベル0）

### `getAllCommandsFromFolder()` 関数のテスト

#### 基本機能のテスト

- **CT-43**: 正常系: フォルダー直下のコマンド取得
- **CT-44**: 正常系: ネストしたフォルダー内の全コマンド取得
- **CT-45**: 正常系: 混在する構造（フォルダーとコマンド）からのコマンド取得

#### エッジケースのテスト

- **CT-46**: 境界値: コマンドが存在しないフォルダーでの処理（空配列返却）
- **CT-47**: 正常系: フォルダーのみで構成された階層での処理（空配列返却）
- **CT-48**: 正常系: 深くネストした構造でのコマンド取得

### `getAllFoldersFromNode()` 関数のテスト

#### 基本機能のテスト

- **CT-49**: 正常系: ノード内の直接の子フォルダー取得
- **CT-50**: 正常系: ネストした構造での全フォルダー取得
- **CT-51**: 正常系: フォルダーのみの構造での全フォルダー取得

#### エッジケースのテスト

- **CT-52**: 境界値: フォルダーが存在しないノードでの処理（空配列返却）
- **CT-53**: 正常系: コマンドのみのノードでの処理（空配列返却）
- **CT-54**: 正常系: ルートノードが実行対象の場合

### プライベート関数のテスト（間接的テスト）

#### `addParentFolderIfNeeded()` の間接テスト

- **CT-57**: 正常系: 親フォルダーが存在しない場合の自動追加
- **CT-58**: 正常系: ROOT_FOLDERの場合は追加されない
- **CT-59**: 正常系: 既に処理済みフォルダーは再追加されない

#### 循環参照検出の間接テスト

- **CT-60**: 異常系: 循環参照検出時の警告ログ出力
- **CT-61**: 異常系: 循環参照時のルートレベル配置
- **CT-62**: 正常系: 正常な親子関係での処理継続

## テスト用モックデータ設計

### 基本的なテストデータ

```typescript
// ルートレベルのコマンド
const rootCommand: Command = {
  id: "cmd-root-1",
  title: "Root Command",
  iconUrl: "icon1.png",
  searchUrl: "https://example.com",
  openMode: OPEN_MODE.NEW_TAB,
}

// ルートレベルのフォルダー
const rootFolder: CommandFolder = {
  id: "folder-root-1",
  title: "Root Folder",
  iconUrl: "folder-icon.png",
}

// ネストしたフォルダー構造
const parentFolder: CommandFolder = {
  id: "folder-parent",
  title: "Parent Folder",
  iconUrl: "parent-icon.png",
}

const childFolder: CommandFolder = {
  id: "folder-child",
  title: "Child Folder",
  iconUrl: "child-icon.png",
  parentFolderId: "folder-parent",
}

// フォルダー内のコマンド
const nestedCommand: Command = {
  id: "cmd-nested",
  title: "Nested Command",
  iconUrl: "nested-icon.png",
  searchUrl: "https://nested.com",
  openMode: OPEN_MODE.CURRENT_TAB,
  parentFolderId: "folder-child",
}
```

### 異常系テストデータ

```typescript
// 存在しない親フォルダーIDを持つコマンド
const orphanCommand: Command = {
  id: "cmd-orphan",
  title: "Orphan Command",
  iconUrl: "orphan-icon.png",
  searchUrl: "https://orphan.com",
  openMode: OPEN_MODE.NEW_TAB,
  parentFolderId: "non-existent-folder",
}

// 循環参照のフォルダー
const circularFolder1: CommandFolder = {
  id: "folder-circular-1",
  title: "Circular Folder 1",
  parentFolderId: "folder-circular-2",
}

const circularFolder2: CommandFolder = {
  id: "folder-circular-2",
  title: "Circular Folder 2",
  parentFolderId: "folder-circular-1",
}
```

## 実装方針

### テストの優先順位

1. **高優先度**: 基本的な木構造構築と平坦化機能（CT-01〜CT-20）
2. **中優先度**: 検索機能とレベル計算（CT-21〜CT-42）
3. **低優先度**: コレクション取得と異常系処理（CT-43〜CT-62）

### モック戦略

- `ROOT_FOLDER`定数のインポート
- Chrome拡張機能のAPIはsetup.tsでモック済み
- console.warnのモック化（循環参照警告テスト用）
- テストデータの再利用性を考慮したファクトリー関数の作成

### テストファイル構成

```
src/services/option/
└── commandTree.test.ts    # 全関数の単体テスト
```

### アサーション戦略

- 木構造の検証: ノードの型、内容、子要素の確認
- 平坦化結果の検証: インデックス、フラグ、順序の確認
- エラーケースの検証: 戻り値、警告ログの確認
