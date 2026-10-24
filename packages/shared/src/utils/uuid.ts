import { normalizeObject } from "./common";
import { v5 as uuidv5 } from "uuid";
import { createHash } from "crypto";

// UUID namespace from https://ujiro99.github.io/selection-command/
const UUID_NAMESPACE = "fe352db3-6a8e-5d07-9aaf-c45a2e9d9f5c";

/**
 * Generate UUID from object, using UUIDv5.
 * Property order independent - same content produces same UUID regardless of key order.
 * NOTE: Uses Node.js crypto - not available in browser.
 */
export function generateUUIDFromObject(obj: object): string {
  const normalizedObj = normalizeObject(obj);
  const objString = JSON.stringify(normalizedObj);
  const hash = createHash("sha1").update(objString).digest("hex");
  return uuidv5(hash, UUID_NAMESPACE);
}
