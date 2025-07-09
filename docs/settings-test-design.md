# 設定管理システムの単体テスト設計

## 設計概要

### 1. `src/services/settings.ts`

- **役割**: 設定の CRUD 操作を行う低レベルサービス
- **特徴**:
  - Chrome拡張機能のストレージとの直接的なやり取り
  - マイグレーション機能
  - 画像キャッシュ管理
  - コールバック機能による変更通知

### 2. `src/services/enhancedSettings.ts`

- **役割**: 設定の高レベルサービス（キャッシュ機能付き）
- **特徴**:
  - settingsCacheを使用した効率的なデータ取得
  - セクション別の部分取得
  - 並列データ取得
  - legacyリスナーとの互換性

### 3. `src/services/settingsCache.ts`

- **役割**: 設定データのキャッシュ管理システム
- **特徴**:
  - メモリベースのキャッシュでパフォーマンス向上
  - TTL（Time To Live）による自動期限切れ
  - セクション別のデータ管理とバージョン管理
  - Chrome拡張機能ストレージの変更監視
  - リスナー機能によるリアルタイム更新通知

### 4. `src/hooks/useSetting.ts`

- **役割**: React用の設定フック
- **特徴**:
  - 非同期データフェッチのReactフック
  - ページルールの自動適用
  - セクション別データ取得
  - 画像キャッシュ適用

## 単体テストの設計

### `src/services/settings.ts` のテスト項目

#### Settings.get のテスト

- [ ] 正常系: 基本的な設定データの取得
- [ ] 正常系: excludeOptions=trueの場合、オプション設定が除外される
- [ ] 正常系: excludeOptions=falseの場合、オプション設定が含まれる
- [ ] 正常系: 空のフォルダーがフィルタリングされる
- [ ] 正常系: UserSettings, Commands, Stars、Shortcuts、UserStatsが適切に追加される
- [ ] 正常系: マイグレーションが実行される
- [ ] 異常系: ストレージからのデータ取得に失敗した場合

#### Settings.set のテスト

- [ ] 正常系: 設定データの保存
- [ ] 正常系: serviceWorker=trueの場合、画像キャッシュ処理がスキップされる
- [ ] 正常系: 未使用キャッシュが削除される
- [ ] 正常系: 新しい画像URLがキャッシュに追加される
- [ ] 正常系: リンクコマンドが存在しない場合、デフォルトが追加される
- [ ] 正常系: UserStats、Stars、Shortcutsが適切に分離される
- [ ] 異常系: ストレージへの保存に失敗した場合

#### Settings.update のテスト

- [ ] 正常系: 特定のキーの値を更新
- [ ] 正常系: updater関数が正しく実行される
- [ ] 異常系: 不正なキーでの更新

#### Settings.addCommands のテスト

- [ ] 正常系: 既存コマンドに新しいコマンドを追加
- [ ] 正常系: 空配列の追加
- [ ] 異常系: 重複コマンドの処理

#### Settings.updateCommands のテスト

- [ ] 正常系: コマンドの更新
- [ ] 異常系: 不正なコマンドデータでの更新

#### Settings.reset のテスト

- [ ] 正常系: 設定のリセット(デフォルト設定、コマンド、ショートカット)
- [ ] 正常系: リセット対象以外のデータは保持される

#### コールバック機能のテスト

- [ ] 正常系: addChangedListenerでコールバックが登録される
- [ ] 正常系: removeChangedListenerでコールバックが削除される
- [ ] 正常系: 設定変更時にコールバックが実行される

#### キャッシュ機能のテスト

- [ ] 正常系: getCachesでキャッシュデータを取得
- [ ] 正常系: getUrlsで全URLを取得
- [ ] 正常系: 重複URLの除去

#### マイグレーション機能のテスト

- [ ] 正常系: バージョン0.11.9からのマイグレーション
- [ ] 正常系: 最新バージョンの場合、マイグレーション不要

### `src/services/enhancedSettings.ts` のテスト項目

#### EnhancedSettings.get のテスト

- [ ] 正常系: デフォルトセクションでの設定取得
- [ ] 正常系: 特定セクションのみでの設定取得
- [ ] 正常系: forceFresh=trueでキャッシュを無視
- [ ] 正常系: excludeOptions=trueでオプション除外
- [ ] 正常系: excludeOptions=falseの場合、オプション設定が含まれる
- [ ] 正常系: 並列データ取得の成功
- [ ] 正常系: 空のフォルダーがフィルタリングされる
- [ ] 正常系: UserSettings, Commands, Stars、Shortcuts、UserStatsが適切に追加される
- [ ] 正常系: 一部のセクション取得に失敗してもデフォルト値を使用
- [ ] 異常系: 全セクションの取得に失敗した場合

#### EnhancedSettings.getSection のテスト

- [ ] 正常系: コマンドセクションの取得
- [ ] 正常系: ユーザー設定セクションの取得
- [ ] 正常系: スターセクションの取得
- [ ] 正常系: ショートカットセクションの取得
- [ ] 正常系: ユーザー統計セクションの取得
- [ ] 異常系: 不正なセクションの指定

#### キャッシュ機能のテスト

- [ ] 正常系: invalidateCacheでキャッシュの無効化
- [ ] 正常系: invalidateAllCacheで全キャッシュの無効化
- [ ] 正常系: getCacheStatusでキャッシュ状態の取得

#### プライベートメソッドのテスト

- [ ] 正常系: mergeSettingsで設定のマージ
- [ ] 正常系: removeOptionSettingsでオプション設定の除去
- [ ] 正常系: setupLegacyListenersでレガシーリスナーの設定

### `src/services/settingsCache.ts` のテスト項目

#### DataVersionManager のテスト

- [ ] 正常系: generateVersionでセクションとデータからバージョンを生成
- [ ] 正常系: setVersionとgetVersionでバージョンの設定と取得
- [ ] 正常系: validateVersionでバージョンの妥当性検証
- [ ] 正常系: hashDataで同じデータに対して同じハッシュを生成
- [ ] 正常系: hashDataで異なるデータに対して異なるハッシュを生成
- [ ] 正常系: hashDataでオブジェクトのキー順序に関係なく同じハッシュを生成

#### SettingsCacheManager.get のテスト

- [ ] 正常系: キャッシュヒット時にキャッシュからデータを返却
- [ ] 正常系: キャッシュミス時にストレージからデータを取得
- [ ] 正常系: forceFresh=trueでキャッシュを無視してストレージから取得
- [ ] 正常系: TTL期限切れの場合にストレージから再取得
- [ ] 正常系: 各セクション（COMMANDS, USER_SETTINGS, STARS, SHORTCUTS, USER_STATS, CACHES）のデータ取得
- [ ] 異常系: 不正なセクション指定でエラーを投げる
- [ ] 異常系: ストレージからのデータ取得に失敗した場合

#### キャッシュ管理のテスト

- [ ] 正常系: setCacheでデータとメタデータを正しく設定
- [ ] 正常系: isValidでキャッシュの有効性を正しく判定
- [ ] 正常系: カスタムTTLの設定と検証
- [ ] 正常系: デフォルトTTL（5分）の適用

#### キャッシュ無効化のテスト

- [ ] 正常系: invalidateで指定セクションのキャッシュを無効化
- [ ] 正常系: invalidateAllで全セクションのキャッシュを無効化
- [ ] 正常系: キャッシュ無効化時にリスナーが呼び出される
- [ ] 正常系: 無効化時にバージョンがリセットされる

#### リスナー機能のテスト

- [ ] 正常系: subscribeでリスナーを登録
- [ ] 正常系: unsubscribeでリスナーを削除
- [ ] 正常系: notifyListenersで登録されたリスナーが呼び出される
- [ ] 正常系: リスナーでエラーが発生しても他のリスナーに影響しない
- [ ] 正常系: セクション別のリスナー管理
- [ ] 正常系: 最後のリスナーが削除された時にセクションエントリも削除

#### ストレージ変更監視のテスト

- [ ] 正常系: setupStorageListenerでChrome storage変更リスナーを設定
- [ ] 正常系: USER_SETTINGSキー変更時にUSER_SETTINGSセクションを無効化
- [ ] 正常系: USER_STATSキー変更時にUSER_STATSセクションを無効化
- [ ] 正常系: SHORTCUTSキー変更時にSHORTCUTSセクションを無効化
- [ ] 正常系: STARSキー変更時にSTARSセクションを無効化
- [ ] 正常系: CACHESキー変更時にCACHESセクションを無効化
- [ ] 正常系: cmd-プリフィックスキー変更時にCOMMANDSセクションを無効化
- [ ] 正常系: 複数キー変更時に重複排除して無効化
- [ ] 正常系: 重複したリスナー設定の防止

#### loadFromStorage のテスト

- [ ] 正常系: COMMANDSセクションでStorage.getCommands()を呼び出し
- [ ] 正常系: USER_SETTINGSセクションでStorage.get(STORAGE_KEY.USER)を呼び出し
- [ ] 正常系: STARSセクションでStorage.get(LOCAL_STORAGE_KEY.STARS)を呼び出し
- [ ] 正常系: SHORTCUTSセクションでStorage.get(STORAGE_KEY.SHORTCUTS)を呼び出し
- [ ] 正常系: USER_STATSセクションでStorage.get(STORAGE_KEY.USER_STATS)を呼び出し
- [ ] 正常系: CACHESセクションでSettings.getCaches()を呼び出し
- [ ] 異常系: 不明なセクションでエラーを投げる

#### デバッグ機能のテスト

- [ ] 正常系: getCacheStatusで各セクションのキャッシュ状態を返却
- [ ] 正常系: キャッシュの存在確認と経過時間の計算
- [ ] 正常系: キャッシュされていないセクションは含まれない

### `src/hooks/useSetting.ts` のテスト項目

#### ユーティリティ関数のテスト

- [ ] 正常系: findMatchingPageRuleでマッチするルールを取得
- [ ] 正常系: マッチしないURLパターンの場合undefined
- [ ] 正常系: 不正な正規表現の場合false
- [ ] 正常系: applyPageRuleToSettingsでポップアップ配置の適用
- [ ] 正常系: INHERIT設定の場合、適用されない

#### useAsyncData のテスト

- [ ] 正常系: データの正常取得
- [ ] 正常系: ローディング状態の管理
- [ ] 正常系: エラー状態の管理
- [ ] 正常系: refetch機能
- [ ] 正常系: コンポーネントアンマウント時のクリーンアップ
- [ ] 正常系: サブスクリプション機能

#### useSection のテスト

- [ ] 正常系: 特定セクションのデータ取得
- [ ] 正常系: forceFreshでの強制更新
- [ ] 正常系: キャッシュ変更時の自動更新
- [ ] 異常系: セクション取得エラー

#### useUserSettings のテスト

- [ ] 正常系: ユーザー設定の取得
- [ ] 正常系: ページルールの適用
- [ ] 正常系: ページルールがない場合のデフォルト値
- [ ] 異常系: データ取得エラー

#### useSetting のテスト

- [ ] 正常系: 複数セクションの統合データ取得
- [ ] 正常系: デフォルトセクションでの取得
- [ ] 正常系: ページルールの自動適用
- [ ] 正常系: セクション変更時の再取得
- [ ] 異常系: データ取得エラー

#### useSettingsWithImageCache のテスト

- [ ] 正常系: 画像キャッシュ適用済みコマンドの取得
- [ ] 正常系: 画像キャッシュ適用済みフォルダーの取得
- [ ] 正常系: IconUrlsマップの生成
- [ ] 正常系: キャッシュが存在しない場合の元URL使用
- [ ] 正常系: ローディング中の空配列返却

## 実装方針

### テストの優先順位

1. **高優先度**: 基本的なCRUD操作とデータ取得
2. **中優先度**: エラーハンドリングとエッジケース
3. **低優先度**: パフォーマンス関連とキャッシュ機能

### モック戦略

- Chrome拡張機能のAPIはsetup.tsでモック済み
- Storageサービスのモック化
- settingsCacheのモック化
- 非同期処理のテスト

### テストファイル構成

```
src/
├── services/
│   ├── settings.test.ts
│   ├── enhancedSettings.test.ts
│   └── settingsCache.test.ts
└── hooks/
    └── useSetting.test.ts
```
