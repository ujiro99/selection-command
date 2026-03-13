import { normalizeObject } from "./common";
import {
  isSearchCommand,
  isPageActionCommand,
  isAiPromptType,
} from "./type-guards";
import { v5 as uuidv5 } from "uuid";
import { createHash } from "crypto";

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

/**
 * Generate UUID from command content.
 * Extracts relevant fields based on command type before generating UUID.
 * Accepts any value - type guards narrow internally to the correct command type.
 */
export function cmd2uuid(cmd: unknown): string {
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
  } else if (isAiPromptType(cmd)) {
    return generateUUIDFromObject({
      title: cmd.title,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      aiPromptOption: cmd.aiPromptOption,
    });
  } else {
    throw new Error("Invalid command");
  }
}
