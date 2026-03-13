#!/usr/bin/env node
/**
 * Extracts search URLs from defaultSettings.ts and generates
 * e2e/generated-command-urls.ts for the URL status e2e test.
 *
 * Invoked automatically as part of "yarn build:e2e".
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_PATH = path.resolve(
  __dirname,
  "../src/services/option/defaultSettings.ts",
)
const OUT_PATH = path.resolve(__dirname, "../e2e/generated-command-urls.ts")
const IGNORE_PATH = path.resolve(__dirname, "e2e-ignore-urls.txt")

// Load ignored URLs from the ignore list
const ignoreUrls = new Set(
  fs
    .readFileSync(IGNORE_PATH, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#")),
)

const src = fs.readFileSync(SRC_PATH, "utf-8")

// -------------------------------------------------------------------
// Helper: find the index of the matching closing brace for an opening
// brace at `openIdx`.
// NOTE: Braces inside string literals and comments are ignored.
// -------------------------------------------------------------------
function findMatchingBrace(text, openIdx) {
  let depth = 0
  let inSingleQuote = false
  let inDoubleQuote = false
  let inTemplateLiteral = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    const prev = text[i - 1]

    // 行コメントの終了判定
    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false
      }
      continue
    }

    // ブロックコメントの終了判定
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false
        i++ // "*/" を飛ばす
      }
      continue
    }

    // いずれの文字列リテラル内でもない場合のみコメント開始を判定
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
      if (ch === "/" && next === "/") {
        inLineComment = true
        i++ // "//" を飛ばす
        continue
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true
        i++ // "/*" を飛ばす
        continue
      }
    }

    // コメント外でのみ文字列リテラルの開始/終了を判定
    if (!inLineComment && !inBlockComment) {
      if (!inDoubleQuote && !inTemplateLiteral && ch === "'" && prev !== "\\") {
        inSingleQuote = !inSingleQuote
        continue
      }
      if (!inSingleQuote && !inTemplateLiteral && ch === '"' && prev !== "\\") {
        inDoubleQuote = !inDoubleQuote
        continue
      }
      if (!inSingleQuote && !inDoubleQuote && ch === "`" && prev !== "\\") {
        inTemplateLiteral = !inTemplateLiteral
        continue
      }
    }

    // いずれかの文字列リテラル内では波括弧を無視
    if (inSingleQuote || inDoubleQuote || inTemplateLiteral) {
      continue
    }

    // コード本体のみで波括弧のネストをカウント
    if (ch === "{") {
      depth++
    } else if (ch === "}") {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }

  return -1
}

// -------------------------------------------------------------------
// Helper: extract title and searchUrl from an object body string.
// Returns null if searchUrl is missing or empty.
// -------------------------------------------------------------------
function extractTitleAndUrl(body) {
  const titleMatch = body.match(/title:\s*"([^"]*)"/)
  const urlMatch = body.match(/searchUrl:\s*\n?\s*"([^"]*)"/)
  if (titleMatch && urlMatch && urlMatch[1]) {
    return { title: titleMatch[1], searchUrl: urlMatch[1] }
  }
  return null
}

// -------------------------------------------------------------------
// 1. Extract CMD_* variable definitions → Map<name, {title, searchUrl}>
// -------------------------------------------------------------------
const cmdDefs = new Map()
const cmdStartRegex = /^const (CMD_\w+)\s*=\s*\{/gm
let m
while ((m = cmdStartRegex.exec(src)) !== null) {
  const name = m[1]
  const openIdx = src.indexOf("{", m.index + m[0].length - 1)
  const closeIdx = findMatchingBrace(src, openIdx)
  if (closeIdx < 0) continue

  const body = src.slice(openIdx + 1, closeIdx)
  const parsed = extractTitleAndUrl(body)
  cmdDefs.set(name, {
    title: parsed ? parsed.title : "",
    searchUrl: parsed ? parsed.searchUrl : "",
  })
}

// -------------------------------------------------------------------
// 2. Extract DefaultCommands literal array → en entries
// -------------------------------------------------------------------
const defaultEntries = []
const defaultArrayStart = src.indexOf("export const DefaultCommands = [")
if (defaultArrayStart >= 0) {
  const arrayOpenBracket = src.indexOf("[", defaultArrayStart)
  // Find the matching ] — simple bracket counting
  let depth = 0
  let arrayEnd = -1
  for (let i = arrayOpenBracket; i < src.length; i++) {
    if (src[i] === "[") depth++
    else if (src[i] === "]") {
      depth--
      if (depth === 0) {
        arrayEnd = i
        break
      }
    }
  }
  if (arrayEnd >= 0) {
    const arrBody = src.slice(arrayOpenBracket + 1, arrayEnd)
    // Extract each top-level { ... } object inside the array
    let braceDepth = 0
    let objStart = -1
    for (let i = 0; i < arrBody.length; i++) {
      if (arrBody[i] === "{") {
        if (braceDepth === 0) objStart = i
        braceDepth++
      } else if (arrBody[i] === "}") {
        braceDepth--
        if (braceDepth === 0 && objStart >= 0) {
          const objBody = arrBody.slice(objStart + 1, i)
          const parsed = extractTitleAndUrl(objBody)
          if (parsed) {
            defaultEntries.push({ ...parsed, locale: "en" })
          }
          objStart = -1
        }
      }
    }
  }
}

// -------------------------------------------------------------------
// 3. Extract getDefaultCommands locale blocks
// -------------------------------------------------------------------
const localeEntries = []
const funcStart = src.indexOf("export function getDefaultCommands")
if (funcStart >= 0) {
  const funcBody = src.slice(funcStart)

  // Match each locale block following this pattern:
  //   // ja: Japan
  //   if (lang.startsWith("ja")) {
  //     return [
  //       CMD_XXX,
  //       ...
  //     ] as Command[]
  //   }
  // Also handles exact match: if (lang === "pt-br") { ... }
  const blockRegex =
    /\/\/\s*([\w-]+):.*\n\s*if\s*\(.*\)\s*\{\s*\n\s*return\s*\[([\s\S]*?)\]\s*as\s*Command\[\]/g
  let blockMatch
  while ((blockMatch = blockRegex.exec(funcBody)) !== null) {
    const locale = blockMatch[1]
    const returnBody = blockMatch[2]

    const cmdRefRegex = /(CMD_\w+)/g
    let cmdRef
    while ((cmdRef = cmdRefRegex.exec(returnBody)) !== null) {
      const def = cmdDefs.get(cmdRef[1])
      if (def && def.searchUrl) {
        localeEntries.push({
          title: def.title,
          searchUrl: def.searchUrl,
          locale,
        })
      }
    }
  }
}

// -------------------------------------------------------------------
// 4. Combine and deduplicate by searchUrl
// -------------------------------------------------------------------
const allEntries = [...defaultEntries, ...localeEntries]
const seen = new Set()
const unique = []
for (const entry of allEntries) {
  if (!seen.has(entry.searchUrl) && !ignoreUrls.has(entry.searchUrl)) {
    seen.add(entry.searchUrl)
    unique.push(entry)
  }
}

// -------------------------------------------------------------------
// 5. Write generated TypeScript file
// -------------------------------------------------------------------
const lines = unique
  .map(
    (e) =>
      `  { title: ${JSON.stringify(e.title)}, locale: ${JSON.stringify(e.locale)}, searchUrl: ${JSON.stringify(e.searchUrl)} },`,
  )
  .join("\n")

const output = `/**
 * Auto-generated by scripts/generate-e2e-urls.mjs from defaultSettings.ts.
 * Do not edit manually. Run "yarn build:e2e" to regenerate.
 */

export type UrlEntry = { title: string; locale: string; searchUrl: string }

export const COMMAND_URLS: UrlEntry[] = [
${lines}
]
`

fs.writeFileSync(OUT_PATH, output, "utf-8")
console.log(`Generated ${OUT_PATH} with ${unique.length} URL entries.`)
