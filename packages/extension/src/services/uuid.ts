import {
  isSearchCommand,
  isPageActionCommand,
  normalizeObject,
} from "@/lib/utils"
import { v5 as uuidv5 } from "uuid"
import type { CommandContent } from "@/types/command"

/**
 * Generate UUID from object, using UUIDv5.
 * @param obj Object to generate UUID from.
 * @returns UUID.
 */
async function generateUUIDFromObject(obj: object): Promise<string> {
  const objString = JSON.stringify(normalizeObject(obj))
  const encoder = new TextEncoder()
  const data = encoder.encode(objString)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  // UUIDv5 from https://ujiro99.github.io/selection-command/
  const namespace = "fe352db3-6a8e-5d07-9aaf-c45a2e9d9f5c"
  return uuidv5(hash, namespace)
}

export async function cmd2uuid(cmd: CommandContent): Promise<string> {
  if (isSearchCommand(cmd)) {
    return await generateUUIDFromObject({
      title: cmd.title,
      searchUrl: cmd.searchUrl,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      openModeSecondary: cmd.openModeSecondary,
      spaceEncoding: cmd.spaceEncoding,
    })
  } else if (isPageActionCommand(cmd)) {
    return await generateUUIDFromObject({
      title: cmd.title,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      pageActionOption: cmd.pageActionOption,
    })
  } else {
    throw new Error("Invalid command")
  }
}
