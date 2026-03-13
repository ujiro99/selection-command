# Plan: `generateUUIDFromObject` と `cmd2uuid` を shared パッケージへ移植

## Context

`generateUUIDFromObject` と `cmd2uuid` が3箇所で重複実装されている:

- `packages/hub/src/lib/utils.ts` — sync版 (Node.js `crypto`)
- `packages/extension/src/services/uuid.ts` — async版 (Web Crypto API)
- `packages/extension/scripts/check-command-ids.mjs` — sync版の手動複製

共通ロジックを `packages/shared/src/utils/uuid.ts` に集約し、hub とスクリプトから共有版を利用する。

## 設計方針

### 環境制約

- **Hub (Next.js)**: Node.js 環境 → sync OK
- **check-command-ids.mjs**: Node.js スクリプト → sync OK、`.ts` ファイルを直接 import 済み
- **Extension**: ブラウザ環境 → Node.js `crypto` は使用不可、Web Crypto API (async) が必要

### 方針

- shared に **sync 版** (`crypto.createHash`) を実装する
- `utils/index.ts` のバレルエクスポートには **追加しない** (extension が `@shared` 経由で自動的にバンドルしないように)
- Hub とスクリプトは `@shared/utils/uuid` から直接 import する
- Extension は既存の async 版を維持する（ブラウザ環境で Node.js crypto は使えないため）

## 変更内容

### 1. shared パッケージに `uuid` 依存を追加

**File: `packages/shared/package.json`**

- `dependencies` に `"uuid": "^11.0.3"` を追加

### 2. `packages/shared/src/utils/uuid.ts` を実装

```typescript
import { normalizeObject } from "./common";
import { isSearchCommand, isPageActionCommand } from "./type-guards";
import { v5 as uuidv5 } from "uuid";
import { createHash } from "crypto";
import type { SelectionCommand } from "../types";

// UUID namespace from https://ujiro99.github.io/selection-command/
const UUID_NAMESPACE = "fe352db3-6a8e-5d07-9aaf-c45a2e9d9f5c";

/**
 * Generate UUID from object, using UUIDv5.
 * Property order independent - same content produces same UUID regardless of key order.
 * NOTE: Uses Node.js crypto - not available in browser. For browser, use async version.
 */
export function generateUUIDFromObject(obj: object): string {
  const normalizedObj = normalizeObject(obj);
  const objString = JSON.stringify(normalizedObj);
  const hash = createHash("sha1").update(objString).digest("hex");
  return uuidv5(hash, UUID_NAMESPACE);
}

type CommandContent = Omit<
  SelectionCommand,
  "id" | "tags" | "addedAt" | "description"
>;

/**
 * Generate UUID from command content.
 * Extracts relevant fields based on command type before generating UUID.
 */
export function cmd2uuid(cmd: CommandContent): string {
  if (isSearchCommand(cmd)) {
    return generateUUIDFromObject({
      title: cmd.title,
      searchUrl: cmd.searchUrl,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      openModeSecondary: cmd.openModeSecondary,
      spaceEncoding: cmd.spaceEncoding,
    });
  } else if (isPageActionCommand(cmd)) {
    return generateUUIDFromObject({
      title: cmd.title,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      pageActionOption: cmd.pageActionOption,
    });
  } else {
    throw new Error("Invalid command");
  }
}
```

**注意**: `utils/index.ts` には `export * from "./uuid"` を **追加しない**。

### 3. Hub パッケージの更新

**File: `packages/hub/src/lib/utils.ts`**

- `generateUUIDFromObject` の実装を削除
- `import { generateUUIDFromObject } from "@shared/utils/uuid"` として re-export

**File: `packages/hub/src/features/command.ts`**

- `cmd2uuid` のローカル実装を削除
- `import { cmd2uuid } from "@shared/utils/uuid"` に変更
- `generateUUIDFromObject` の import 元を `@shared/utils/uuid` に変更（tag ID 生成で使用）

### 4. check-command-ids.mjs の更新

**File: `packages/extension/scripts/check-command-ids.mjs`**

- ローカルの `generateUUIDFromObject` 関数を削除
- `import { generateUUIDFromObject } from "../../shared/src/utils/uuid.ts"` に変更
  (スクリプトは既に `../../shared/src/utils/common.ts` を同様に import 済み)

### 5. Extension は変更なし

- `packages/extension/src/services/uuid.ts` はそのまま維持
- ブラウザ環境では Web Crypto API (async) が必要なため、shared の sync 版は使えない

## 既存の再利用可能リソース

| リソース               | パス                                       | 状態           |
| ---------------------- | ------------------------------------------ | -------------- |
| `normalizeObject`      | `packages/shared/src/utils/common.ts`      | ✅ 既に shared |
| `isSearchCommand`      | `packages/shared/src/utils/type-guards.ts` | ✅ 既に shared |
| `isPageActionCommand`  | `packages/shared/src/utils/type-guards.ts` | ✅ 既に shared |
| `SelectionCommand` 型  | `packages/shared/src/types/command.ts`     | ✅ 既に shared |
| `SearchCommand` 型     | `packages/shared/src/types/command.ts`     | ✅ 既に shared |
| `PageActionCommand` 型 | `packages/shared/src/types/command.ts`     | ✅ 既に shared |

## 検証方法

1. **ID 整合性テスト**: `node packages/extension/scripts/check-command-ids.mjs` を実行し、既存の全コマンド ID が MISMATCH にならないことを確認
2. **Hub ビルド**: `cd packages/hub && yarn build` が成功することを確認
3. **Hub の既存テスト**: uuid 関連のテストがあれば実行
4. **Extension ビルド**: `cd packages/extension && yarn build` が成功することを確認（shared の変更が extension に影響しないこと）
