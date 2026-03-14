#!/usr/bin/env vite-node
import { cmd2uuid } from "@shared/utils/uuid"
import { LOCALE_COMMANDS } from "@/services/option/defaultSettings"
import { OPEN_MODE } from "@/const"

/**
 * Generates UUIDs for each default command using cmd2uuid (uuid.ts),
 * then compares with the currently set id.
 *
 * Usage:
 *   yarn check-ids
 */

// Modes where cmd2uuid can generate a deterministic ID
const CHECKABLE_MODES = new Set<string>([
  OPEN_MODE.POPUP,
  OPEN_MODE.TAB,
  OPEN_MODE.WINDOW,
  OPEN_MODE.BACKGROUND_TAB,
  OPEN_MODE.SIDE_PANEL,
  OPEN_MODE.AI_PROMPT,
  OPEN_MODE.PAGE_ACTION,
])

// Collect all unique commands across locales
const seen = new Set<string>()
const commands: Array<{ title: string; parsed: Record<string, string> }> = []

for (const cmds of Object.values(LOCALE_COMMANDS)) {
  for (const cmd of cmds) {
    const c = cmd as Record<string, string>
    if (seen.has(c.id)) continue
    seen.add(c.id)
    commands.push({ title: c.title, parsed: c })
  }
}

// Generate UUID and compare
const PAD_NAME = 36
const PAD_ID = 38

console.log(
  `${"TITLE".padEnd(PAD_NAME)} ${"GENERATED_ID".padEnd(PAD_ID)} CHECK`,
)
console.log("-".repeat(PAD_NAME + PAD_ID + 10))

for (const { title, parsed } of commands) {
  const currentId = parsed.id
  const openMode = parsed.openMode

  if (CHECKABLE_MODES.has(openMode)) {
    const generatedId = cmd2uuid(parsed)
    const check = currentId === generatedId ? "OK" : "MISMATCH"
    console.log(
      `${title.padEnd(PAD_NAME)} ${generatedId.padEnd(PAD_ID)} ${check}${check === "MISMATCH" ? ` (current: ${currentId})` : ""}`,
    )
  } else {
    // Drag commands or other special types
    console.log(
      `${title.padEnd(PAD_NAME)} ${"(special - N/A)".padEnd(PAD_ID)} SKIP`,
    )
  }
}
