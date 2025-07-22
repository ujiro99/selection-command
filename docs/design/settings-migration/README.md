# Settings.get 移行プロジェクト

このディレクトリには、`Settings.get()` から `EnhancedSettings.get()` への移行に関する設計書と実装ガイドが含まれています。

## ドキュメント一覧

### [settings-migration-design.md](./settings-migration-design.md)

移行プロジェクトの基本設計書

- 移行背景と目的
- 影響箇所の分析
- 3段階の移行戦略
- リスク分析と対策
- スケジュール提案

### [settings-migration-implementation-guide.md](./settings-migration-implementation-guide.md)

具体的な実装手順と移行ガイド

- Phase別の詳細実装手順
- コード変更例
- 移行チェックリスト
- ロールバック手順

### [settings-migration-test-strategy.md](./settings-migration-test-strategy.md)

移行のための包括的なテスト戦略

- Phase別テスト計画
- パフォーマンステスト
- CI/CD設定
- 成功基準とKPI

## 移行の概要

**目的**: レガシーな`Settings.get()`をキャッシュ機能付きの`EnhancedSettings.get()`に置き換え、パフォーマンスを向上させる

**影響箇所**: 5ファイル、8箇所の使用箇所

- `src/background_script.ts` (4箇所) - 最重要
- `src/services/contextMenus.ts` (1箇所)
- `src/services/commandMetrics.ts` (1箇所)

**移行戦略**:

1. Phase 1: 後方互換性確保
2. Phase 2: 段階的移行
3. Phase 3: 完全移行とクリーンアップ

**想定期間**: 4-5日

## 注意事項

- このプロジェクトは一時的な移行作業のための設計書です
- 移行完了後、このドキュメントは参考資料として保管されます
- 実装中に設計変更が必要な場合は、対応する設計書を更新してください
