# Settings.get から EnhancedSettings.get への移行設計書

## 概要

`src/services/settings/settings.ts` の `Settings.get()` メソッドを `src/services/settings/enhancedSettings.ts` の `EnhancedSettings.get()` に置き換えるための移行計画を策定する。

## 背景

- **現在**: `Settings.get()` - レガシーな設定取得システム、キャッシュなし
- **移行先**: `EnhancedSettings.get()` - キャッシュ機能付きの新しい設定取得システム

## 影響箇所の分析

### 直接使用箇所（計5ファイル）

| ファイル                                 | 行番号             | 使用方法                                       | 影響度 |
| ---------------------------------------- | ------------------ | ---------------------------------------------- | ------ |
| `src/services/commandMetrics.ts`         | 12                 | `const settings = await Settings.get()`        | 中     |
| `src/services/contextMenus.ts`           | 21                 | `const settings = await Settings.get()`        | 中     |
| `src/background_script.ts`               | 77, 272, 358, 552  | `const settings = await Settings.get()`        | 高     |
| `src/components/option/SettingForm.tsx`  | 138, 193           | `const settings = await Settings.get(true)`    | 中     |
| `src/components/option/ImportExport.tsx` | 271, 303, 317, 332 | `const currentSettings = await Settings.get()` | 中     |

### 既に移行済み

| ファイル                   | 状況                               |
| -------------------------- | ---------------------------------- |
| `src/hooks/useSettings.ts` | 既に `enhancedSettings` を使用済み |

## インターフェース互換性の分析

### Settings.get() のシグネチャ

```typescript
get: async (excludeOptions = false): Promise<SettingsType>
```

### EnhancedSettings.get() のシグネチャ

```typescript
async get(options: GetSettingsOptions = {}): Promise<SettingsType>

interface GetSettingsOptions {
  sections?: CacheSection[]
  forceFresh?: boolean
  excludeOptions?: boolean
}
```

### 互換性の問題

1. **パラメータ構造の違い**: `boolean` → `オブジェクト`
2. **追加オプション**: `sections`, `forceFresh` が新しく追加
3. **戻り値**: 同一の `SettingsType` で互換性あり

## 移行戦略

### 直接置換による段階的移行

#### 移行方針

複雑なオーバーロードや後方互換性メソッドは追加せず、各使用箇所を直接的に置き換える方式を採用。

#### 優先順位付き移行

1. **高優先度**: `src/background_script.ts` （4箇所）
2. **中優先度**: `src/services/contextMenus.ts`, `src/services/commandMetrics.ts`
3. **中優先度**: `src/components/option/SettingForm.tsx` （2箇所）
4. **中優先度**: `src/components/option/ImportExport.tsx` （4箇所）

#### 移行手順（ファイル毎）

1. `Settings` インポートを `enhancedSettings` に変更
2. `Settings.get()` 呼び出しを `enhancedSettings.get()` に変更
3. パラメータ調整：
   - `Settings.get()` → `enhancedSettings.get()`
   - `Settings.get(true)` → `enhancedSettings.get({ excludeOptions: true })`
   - `Settings.get(false)` → `enhancedSettings.get({ excludeOptions: false })`
4. 動作テストの実行
5. 関連テストファイルの更新

#### 最終クリーンアップ

移行完了後、不要になった`Settings.get()`の削除を検討（別タスクとして）

## リスク分析と対策

### 高リスク

| リスク                            | 影響                   | 対策                                      |
| --------------------------------- | ---------------------- | ----------------------------------------- |
| background_script.ts での動作不良 | 拡張機能全体の機能停止 | 段階的移行、十分なテスト                  |
| キャッシュによる予期しない動作    | データ不整合           | `forceFresh: true` オプションの適切な使用 |

### 中リスク

| リスク                 | 影響                 | 対策                       |
| ---------------------- | -------------------- | -------------------------- |
| パフォーマンス変化     | レスポンス時間の変動 | パフォーマンステストの実施 |
| 移行漏れによる併用状態 | データ不整合のリスク | 移行チェックリストの作成   |

### 低リスク

| リスク                 | 影響       | 対策                   |
| ---------------------- | ---------- | ---------------------- |
| テストコードの更新漏れ | テスト失敗 | 自動テストでのチェック |

## テスト戦略

### 既存テストの確認

- `src/services/settings/settings.test.ts` - Settings.get() のテスト
- `src/services/settings/enhancedSettings.test.ts` - EnhancedSettings.get() のテスト
- `src/hooks/useSettings.test.tsx` - useSettings フックのテスト

### 移行テスト項目

#### 機能テスト

- [ ] MG-01: 基本的な設定取得の正常動作
- [ ] MG-02: excludeOptions パラメータの動作確認
- [ ] MG-03: キャッシュ機能の動作確認
- [ ] MG-04: マイグレーション処理の継続動作
- [ ] MG-05: オプション設定のフィルタリング動作

#### 統合テスト

- [ ] MG-06: background_script.ts での全体動作
- [ ] MG-07: contextMenus での設定反映
- [ ] MG-08: commandMetrics でのカウント処理

#### パフォーマンステスト

- [ ] MG-09: 初回取得時間の測定
- [ ] MG-10: キャッシュ使用時の取得時間測定

## スケジュール提案

| Phase   | 期間  | 作業内容                             |
| ------- | ----- | ------------------------------------ |
| Phase 1 | 1日   | インターフェース統一・後方互換性確保 |
| Phase 2 | 2-3日 | 段階的移行（ファイル毎テスト含む）   |
| Phase 3 | 1日   | 完全移行・クリーンアップ             |
| 総計    | 4-5日 | 全体テスト・ドキュメント更新含む     |

## 成功基準

1. **機能継続性**: 既存機能が全て正常動作すること
2. **パフォーマンス**: レスポンス時間が改善または同等であること
3. **テストパス**: 全ての既存テストが成功すること
4. **エラー0件**: 移行後のエラーログが発生しないこと

## ロールバック計画

1. **即座のロールバック**: Git でのコミット取り消し
2. **データ整合性確保**: キャッシュクリアによるデータ再取得
3. **テスト再実行**: ロールバック後の動作確認

## 承認と実行

- [ ] 設計書レビュー完了
- [ ] テスト戦略承認
- [ ] 移行実行承認
- [ ] 完了確認
