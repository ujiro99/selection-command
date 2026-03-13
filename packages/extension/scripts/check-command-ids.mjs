#!/usr/bin/env node

import { generateUUIDFromObject } from "../../shared/src/utils/uuid.ts"

/**
 * Generates UUIDs for each CMD_* command in defaultSettings.ts using the same
 * logic as cmd2uuid (uuid.ts), then compares with the currently set id.
 *
 * Output format (per line):
 *   <const名> <生成id> <check結果>
 *
 * Usage:
 *   node scripts/check-command-ids.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_PATH = path.resolve(
  __dirname,
  "../src/services/option/defaultSettings.ts",
)

const src = fs.readFileSync(SRC_PATH, "utf-8")

// ---- Constants (mirroring the TypeScript enums) ----
const OPEN_MODE = {
  POPUP: "popup",
  WINDOW: "window",
  TAB: "tab",
  BACKGROUND_TAB: "backgroundTab",
  SIDE_PANEL: "sidePanel",
  API: "api",
  PAGE_ACTION: "pageAction",
  AI_PROMPT: "aiPrompt",
}

const SEARCH_MODES = new Set([
  OPEN_MODE.POPUP,
  OPEN_MODE.TAB,
  OPEN_MODE.WINDOW,
  OPEN_MODE.BACKGROUND_TAB,
  OPEN_MODE.SIDE_PANEL,
  OPEN_MODE.AI_PROMPT,
  OPEN_MODE.PAGE_ACTION,
])

const DRAG_OPEN_MODE = {
  PREVIEW_POPUP: "previewPopup",
  PREVIEW_WINDOW: "previewWindow",
  PREVIEW_SIDE_PANEL: "previewSidePanel",
}

const SPACE_ENCODING = {
  PLUS: "plus",
  PERCENT: "percent",
  DASH: "dash",
  UNDERSCORE: "underscore",
}

// ---- Resolve enum references in a value string ----

function resolveValue(raw) {
  const trimmed = raw.trim().replace(/,\s*$/, "")

  // String literal
  const strMatch = trimmed.match(/^"([^"]*)"$/)
  if (strMatch) return strMatch[1]

  // OPEN_MODE.*
  const omMatch = trimmed.match(/^OPEN_MODE\.(\w+)$/)
  if (omMatch) return OPEN_MODE[omMatch[1]] ?? trimmed

  // DRAG_OPEN_MODE.*
  const domMatch = trimmed.match(/^DRAG_OPEN_MODE\.(\w+)$/)
  if (domMatch) return DRAG_OPEN_MODE[domMatch[1]] ?? trimmed

  // SPACE_ENCODING.*
  const seMatch = trimmed.match(/^SPACE_ENCODING\.(\w+)$/)
  if (seMatch) return SPACE_ENCODING[seMatch[1]] ?? trimmed

  return trimmed
}

// ---- Parse object body into key-value pairs (top-level only) ----

function parseObjectBody(body) {
  const result = {}
  let depth = 0
  const lines = body.split("\n")
  for (const line of lines) {
    // Track brace/bracket depth to skip nested structures
    for (const ch of line) {
      if (ch === "{" || ch === "[") depth++
      else if (ch === "}" || ch === "]") depth--
    }
    // Only parse top-level key: value pairs (depth === 0 before this line)
    if (depth > 0) continue
    const m = line.match(/^\s*(\w+)\s*:\s*(.+)/)
    if (m) {
      const key = m[1]
      const val = m[2].trim().replace(/,\s*$/, "")
      // Skip nested objects/arrays
      if (val.startsWith("{") || val.startsWith("[")) continue
      result[key] = resolveValue(val)
    }
  }
  return result
}

// ---- Find matching brace ----

function findMatchingBrace(text, openIdx) {
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

// ---- Extract CMD_* definitions ----

const cmdStartRegex = /^const (CMD_\w+)\s*=\s*\{/gm
const commands = []
let m

while ((m = cmdStartRegex.exec(src)) !== null) {
  const name = m[1]
  const openIdx = src.indexOf("{", m.index + m[0].length - 1)
  const closeIdx = findMatchingBrace(src, openIdx)
  if (closeIdx < 0) continue

  const body = src.slice(openIdx + 1, closeIdx)
  const parsed = parseObjectBody(body)
  commands.push({ name, parsed, body })
}

// ---- Generate UUID and compare ----

const PAD_NAME = 28
const PAD_ID = 38

console.log(
  `${"CONST".padEnd(PAD_NAME)} ${"GENERATED_ID".padEnd(PAD_ID)} CHECK`,
)
console.log("-".repeat(PAD_NAME + PAD_ID + 10))

for (const { name, parsed } of commands) {
  const currentId = parsed.id
  const openMode = parsed.openMode

  // Determine command type
  if (SEARCH_MODES.has(openMode)) {
    // Search command: use {title, searchUrl, iconUrl, openMode, openModeSecondary, spaceEncoding}
    const obj = {
      title: parsed.title,
      searchUrl: parsed.searchUrl,
      iconUrl: parsed.iconUrl,
      openMode: parsed.openMode,
      openModeSecondary: parsed.openModeSecondary,
      spaceEncoding: parsed.spaceEncoding,
    }
    const generatedId = generateUUIDFromObject(obj)
    const check = currentId === generatedId ? "OK" : "MISMATCH"
    console.log(
      `${name.padEnd(PAD_NAME)} ${generatedId.padEnd(PAD_ID)} ${check}${check === "MISMATCH" ? ` (current: ${currentId})` : ""}`,
    )
  } else {
    // Drag commands or other special types
    console.log(
      `${name.padEnd(PAD_NAME)} ${"(special - N/A)".padEnd(PAD_ID)} SKIP`,
    )
  }
}
