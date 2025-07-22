# 設定管理システムの単体テスト設計

## 設計概要

- @src/services/settings/CLAUDE.md を参照

### 4. `src/hooks/useSetting.ts`

- **役割**: React用の設定フック
- **特徴**:
  - 非同期データフェッチのReactフック
  - ページルールの自動適用
  - セクション別データ取得
  - 画像キャッシュ適用

## 単体テストの設計

### `src/services/settings/settings.ts` のテスト項目

#### Settings.get のテスト

- [ ] ST-01: 正常系: 基本的な設定データの取得
- [ ] ST-02: 正常系: excludeOptions=trueの場合、オプション設定が除外される
- [ ] ST-03: 正常系: excludeOptions=falseの場合、オプション設定が含まれる
- [ ] ST-04: 正常系: 空のフォルダーがフィルタリングされる
- [ ] ST-05: 正常系: UserSettings, Commands, Stars、Shortcuts、UserStatsが適切に追加される
- [ ] ST-06: 正常系: マイグレーションが実行される
- [ ] ST-07: 異常系: ストレージからのデータ取得に失敗した場合

#### Settings.set のテスト

- [ ] ST-08: 正常系: 設定データの保存
- [ ] ST-09: 正常系: serviceWorker=trueの場合、画像キャッシュ処理がスキップされる
- [ ] ST-10: 正常系: 未使用キャッシュが削除される
- [ ] ST-11: 正常系: 新しい画像URLがキャッシュに追加される
- [ ] ST-12: 正常系: リンクコマンドが存在しない場合、デフォルトが追加される
- [ ] ST-13: 正常系: UserStats、Stars、Shortcutsが適切に分離される
- [ ] ST-14: 異常系: ストレージへの保存に失敗した場合

#### Settings.update のテスト

- [ ] ST-15: 正常系: 特定のキーの値を更新
- [ ] ST-16: 正常系: updater関数が正しく実行される
- [ ] ST-17: 異常系: 不正なキーでの更新

#### Settings.addCommands のテスト

- [ ] ST-18: 正常系: 既存コマンドに新しいコマンドを追加
- [ ] ST-19: 正常系: 空配列の追加
- [ ] ST-20: 異常系: 重複コマンドの処理

#### Settings.updateCommands のテスト

- [ ] ST-21: 正常系: コマンドの更新
- [ ] ST-22: 異常系: 不正なコマンドデータでの更新

#### Settings.reset のテスト

- [ ] ST-23: 正常系: 設定のリセット(デフォルト設定、コマンド、ショートカット)
- [ ] ST-24: 正常系: リセット対象以外のデータは保持される

#### コールバック機能のテスト

- [ ] ST-25: 正常系: addChangedListenerでコールバックが登録される
- [ ] ST-26: 正常系: removeChangedListenerでコールバックが削除される
- [ ] ST-27: 正常系: 設定変更時にコールバックが実行される

#### キャッシュ機能のテスト

- [ ] ST-28: 正常系: getCachesでキャッシュデータを取得
- [ ] ST-29: 正常系: getUrlsで全URLを取得
- [ ] ST-30: 正常系: 重複URLの除去

#### マイグレーション機能のテスト

- [ ] ST-31: 正常系: バージョン0.11.9からのマイグレーション
- [ ] ST-32: 正常系: 最新バージョンの場合、マイグレーション不要

### `src/services/settings/enhancedSettings.ts` のテスト項目

#### EnhancedSettings.get のテスト

- [ ] ES-01: 正常系: デフォルトセクションでの設定取得
- [ ] ES-02: 正常系: 特定セクションのみでの設定取得
- [ ] ES-03: 正常系: forceFresh=trueでキャッシュを無視
- [ ] ES-04: 正常系: excludeOptions=trueでオプション除外
- [ ] ES-05: 正常系: excludeOptions=falseの場合、オプション設定が含まれる
- [ ] ES-06: 正常系: 並列データ取得の成功
- [ ] ES-07: 正常系: 空のフォルダーがフィルタリングされる
- [ ] ES-08: 正常系: UserSettings, Commands, Stars、Shortcuts、UserStatsが適切に追加される
- [ ] ES-09: 正常系: 一部のセクション取得に失敗してもデフォルト値を使用
- [ ] ES-10: 異常系: 全セクションの取得に失敗した場合

#### EnhancedSettings.getSection のテスト

- [ ] ES-11: 正常系: コマンドセクションの取得
- [ ] ES-12: 正常系: ユーザー設定セクションの取得
- [ ] ES-13: 正常系: スターセクションの取得
- [ ] ES-14: 正常系: ショートカットセクションの取得
- [ ] ES-15: 正常系: ユーザー統計セクションの取得
- [ ] ES-16: 異常系: 不正なセクションの指定

#### キャッシュ機能のテスト

- [ ] ES-17: 正常系: invalidateCacheでキャッシュの無効化
- [ ] ES-18: 正常系: invalidateAllCacheで全キャッシュの無効化
- [ ] ES-19: 正常系: getCacheStatusでキャッシュ状態の取得

#### プライベートメソッドのテスト

- [ ] ES-20: 正常系: mergeSettingsで設定のマージ
- [ ] ES-21: 正常系: removeOptionSettingsでオプション設定の除去
- [ ] ES-22: 正常系: setupLegacyListenersでレガシーリスナーの設定

### `src/services/settings/settingsCache.ts` のテスト項目

#### DataVersionManager のテスト

- [ ] SC-01: 正常系: generateVersionでセクションとデータからバージョンを生成
- [ ] SC-02: 正常系: setVersionとgetVersionでバージョンの設定と取得
- [ ] SC-03: 正常系: validateVersionでバージョンの妥当性検証
- [ ] SC-04: 正常系: hashDataで同じデータに対して同じハッシュを生成
- [ ] SC-05: 正常系: hashDataで異なるデータに対して異なるハッシュを生成
- [ ] SC-06: 正常系: hashDataでオブジェクトのキー順序に関係なく同じハッシュを生成

#### SettingsCacheManager.get のテスト

- [ ] SC-07: 正常系: キャッシュヒット時にキャッシュからデータを返却
- [ ] SC-08: 正常系: キャッシュミス時にストレージからデータを取得
- [ ] SC-09: 正常系: forceFresh=trueでキャッシュを無視してストレージから取得
- [ ] SC-10: 正常系: TTL期限切れの場合にストレージから再取得
- [ ] SC-11: 正常系: 各セクション（COMMANDS, USER_SETTINGS, STARS, SHORTCUTS, USER_STATS, CACHES）のデータ取得
- [ ] SC-12: 異常系: 不正なセクション指定でエラーを投げる
- [ ] SC-13: 異常系: ストレージからのデータ取得に失敗した場合

#### キャッシュ管理のテスト

- [ ] SC-14: 正常系: setCacheでデータとメタデータを正しく設定
- [ ] SC-15: 正常系: isValidでキャッシュの有効性を正しく判定
- [ ] SC-16: 正常系: カスタムTTLの設定と検証
- [ ] SC-17: 正常系: デフォルトTTL（5分）の適用

#### キャッシュ無効化のテスト

- [ ] SC-18: 正常系: invalidateで指定セクションのキャッシュを無効化
- [ ] SC-19: 正常系: invalidateAllで全セクションのキャッシュを無効化
- [ ] SC-20: 正常系: キャッシュ無効化時にリスナーが呼び出される
- [ ] SC-21: 正常系: 無効化時にバージョンがリセットされる

#### リスナー機能のテスト

- [ ] SC-22: 正常系: subscribeでリスナーを登録
- [ ] SC-23: 正常系: unsubscribeでリスナーを削除
- [ ] SC-24: 正常系: notifyListenersで登録されたリスナーが呼び出される
- [ ] SC-25: 正常系: リスナーでエラーが発生しても他のリスナーに影響しない
- [ ] SC-26: 正常系: セクション別のリスナー管理
- [ ] SC-27: 正常系: 最後のリスナーが削除された時にセクションエントリも削除

#### ストレージ変更監視のテスト

- [ ] SC-28: 正常系: setupStorageListenerでChrome storage変更リスナーを設定
- [ ] SC-29: 正常系: USER_SETTINGSキー変更時にUSER_SETTINGSセクションを無効化
- [ ] SC-30: 正常系: USER_STATSキー変更時にUSER_STATSセクションを無効化
- [ ] SC-31: 正常系: SHORTCUTSキー変更時にSHORTCUTSセクションを無効化
- [ ] SC-32: 正常系: STARSキー変更時にSTARSセクションを無効化
- [ ] SC-33: 正常系: CACHESキー変更時にCACHESセクションを無効化
- [ ] SC-34: 正常系: cmd-プリフィックスキー変更時にCOMMANDSセクションを無効化
- [ ] SC-35: 正常系: 複数キー変更時に重複排除して無効化
- [ ] SC-36: 正常系: 重複したリスナー設定の防止

#### loadFromStorage のテスト

- [ ] SC-37: 正常系: COMMANDSセクションでStorage.getCommands()を呼び出し
- [ ] SC-38: 正常系: USER_SETTINGSセクションでStorage.get(STORAGE_KEY.USER)を呼び出し
- [ ] SC-39: 正常系: STARSセクションでStorage.get(LOCAL_STORAGE_KEY.STARS)を呼び出し
- [ ] SC-40: 正常系: SHORTCUTSセクションでStorage.get(STORAGE_KEY.SHORTCUTS)を呼び出し
- [ ] SC-41: 正常系: USER_STATSセクションでStorage.get(STORAGE_KEY.USER_STATS)を呼び出し
- [ ] SC-42: 正常系: CACHESセクションでSettings.getCaches()を呼び出し
- [ ] SC-43: 異常系: 不明なセクションでエラーを投げる

#### デバッグ機能のテスト

- [ ] SC-44: 正常系: getCacheStatusで各セクションのキャッシュ状態を返却
- [ ] SC-45: 正常系: キャッシュの存在確認と経過時間の計算
- [ ] SC-46: 正常系: キャッシュされていないセクションは含まれない

### `src/hooks/useSetting.ts` のテスト項目

#### ユーティリティ関数のテスト

- [ ] US-01: 正常系: findMatchingPageRuleでマッチするルールを取得
- [ ] US-02: 正常系: マッチしないURLパターンの場合undefined
- [ ] US-03: 正常系: 不正な正規表現の場合false
- [ ] US-04: 正常系: applyPageRuleToSettingsでポップアップ配置の適用
- [ ] US-05: 正常系: INHERIT設定の場合、適用されない

#### useAsyncData のテスト

- [ ] US-06: 正常系: データの正常取得
- [ ] US-07: 正常系: ローディング状態の管理
- [ ] US-08: 正常系: エラー状態の管理
- [ ] US-09: 正常系: refetch機能
- [ ] US-10: 正常系: コンポーネントアンマウント時のクリーンアップ
- [ ] US-11: 正常系: サブスクリプション機能

#### useSection のテスト

- [ ] US-12: 正常系: 特定セクションのデータ取得
- [ ] US-13: 正常系: forceFreshでの強制更新
- [ ] US-14: 正常系: キャッシュ変更時の自動更新
- [ ] US-15: 異常系: セクション取得エラー

#### useUserSettings のテスト

- [ ] US-16: 正常系: ユーザー設定の取得
- [ ] US-17: 正常系: ページルールの適用
- [ ] US-18: 正常系: ページルールがない場合のデフォルト値
- [ ] US-19: 異常系: データ取得エラー

#### useSetting のテスト

- [ ] US-20: 正常系: 複数セクションの統合データ取得
- [ ] US-21: 正常系: デフォルトセクションでの取得
- [ ] US-22: 正常系: ページルールの自動適用
- [ ] US-23: 正常系: セクション変更時の再取得
- [ ] US-24: 異常系: データ取得エラー

#### useSettingsWithImageCache のテスト

- [ ] US-25: 正常系: 画像キャッシュ適用済みコマンドの取得
- [ ] US-26: 正常系: 画像キャッシュ適用済みフォルダーの取得
- [ ] US-27: 正常系: IconUrlsマップの生成
- [ ] US-28: 正常系: キャッシュが存在しない場合の元URL使用
- [ ] US-29: 正常系: ローディング中の空配列返却

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
│   └── settings/
│       ├── settings.test.ts
│       ├── enhancedSettings.test.ts
│       └── settingsCache.test.ts
└── hooks/
    └── useSetting.test.ts
```
