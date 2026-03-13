import { normalizeObject } from "./common";
import { isSearchCommand, isPageActionCommand } from "./type-guards";
import { v5 as uuidv5 } from "uuid";
import { createHash } from "crypto";
import type { SearchCommand, PageActionCommand } from "../types/command";

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
 * Accepts any object with an openMode property - type guards narrow internally.
 */
export function cmd2uuid(cmd: Record<string, unknown>): string {
  if (isSearchCommand(cmd)) {
    const searchCmd = cmd as SearchCommand;
    return generateUUIDFromObject({
      title: searchCmd.title,
      searchUrl: searchCmd.searchUrl,
      iconUrl: searchCmd.iconUrl,
      openMode: searchCmd.openMode,
      openModeSecondary: searchCmd.openModeSecondary,
      spaceEncoding: searchCmd.spaceEncoding,
    });
  } else if (isPageActionCommand(cmd)) {
    const pageActionCmd = cmd as PageActionCommand;
    return generateUUIDFromObject({
      title: pageActionCmd.title,
      iconUrl: pageActionCmd.iconUrl,
      openMode: pageActionCmd.openMode,
      pageActionOption: pageActionCmd.pageActionOption,
    });
  } else {
    throw new Error("Invalid command");
  }
}
