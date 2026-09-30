/**
 * Page state classification with the Gemini API.
 * The request format follows selection-command-hub
 * (src/infrastructure/gemini/content-classifier.ts).
 */
import {
  detectPageStateByRules,
  PAGE_STATE,
  type PageClassification,
  type PageSnapshot,
  type PageState,
} from "./pageState"
import { decideVerdict, type ServiceCheckResult } from "./result"

export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

const SYSTEM_PROMPT = `You are a classifier used by a browser extension that automates AI chat services (ChatGPT, Gemini, Claude, Perplexity, ...).

The extension opened the top page of an AI chat service, but could not find the prompt input box with its configured CSS selectors.
Decide why, from the final URL, the page title, the visible text and (if given) a screenshot of the page.

Return one of:
- "blocked": a bot / security check or an access denial is shown instead of the service (e.g. Cloudflare "Verify you are human", captcha, "unusual traffic", HTTP 403 / 429 error pages).
- "login_required": the page asks the user to sign in / sign up before the chat can be used, or it is a login page of the service or its identity provider.
- "ok": the normal chat UI of the service is shown (a prompt input box is visible, even if a banner or a "log in" button is also shown). In this case the selectors are considered broken.

Rules:
- A "Log in" button in the header alone does not mean "login_required" if the chat input is usable.
- If the page is empty or still loading, prefer "ok" so that the problem is reported to the developer.
- Do not invent facts beyond the given input.`

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    state: {
      type: "STRING",
      enum: [PAGE_STATE.OK, PAGE_STATE.BLOCKED, PAGE_STATE.LOGIN_REQUIRED],
      description: "State of the page",
      nullable: false,
    },
    confidence: {
      type: "NUMBER",
      description: "Confidence score between 0 and 1",
      nullable: false,
    },
    reason: {
      type: "STRING",
      description: "Short reason for the classification",
      nullable: false,
    },
  },
  required: ["state", "confidence", "reason"],
}

export type Screenshot = {
  mimeType: "image/png" | "image/jpeg"
  /** Base64 encoded image data. */
  data: string
}

const buildUserPrompt = (snapshot: PageSnapshot): string =>
  [
    "Input:",
    `- url: ${snapshot.url}`,
    `- title: ${snapshot.title}`,
    `- has_known_challenge_element: ${snapshot.hasChallengeElement}`,
    `- visible_text: ${snapshot.text}`,
  ].join("\n")

const isPageState = (value: unknown): value is PageState =>
  Object.values(PAGE_STATE).includes(value as PageState)

export const classifyPageWithGemini = async (
  apiKey: string,
  snapshot: PageSnapshot,
  screenshot?: Screenshot,
): Promise<PageClassification> => {
  const parts: Array<Record<string, unknown>> = [
    { text: buildUserPrompt(snapshot) },
  ]
  if (screenshot) {
    parts.push({
      inline_data: { mime_type: screenshot.mimeType, data: screenshot.data },
    })
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  })
  if (!response.ok) {
    throw new Error(
      `Gemini API error ${response.status}: ${await response.text()}`,
    )
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini API returned no content")

  const raw = JSON.parse(text) as {
    state: unknown
    confidence: number
    reason: string
  }
  if (!isPageState(raw.state)) {
    throw new Error(`Gemini API returned an unknown state: ${raw.state}`)
  }
  return {
    state: raw.state,
    reason: raw.reason,
    confidence: raw.confidence,
    classifiedBy: "gemini",
  }
}

/**
 * Classify the page with Gemini when an API key is given, falling back to
 * the rule-based classification otherwise or on API errors.
 */
export const classifyPage = async (
  snapshot: PageSnapshot,
  options: { apiKey?: string; screenshot?: Screenshot } = {},
): Promise<PageClassification> => {
  if (options.apiKey) {
    try {
      return await classifyPageWithGemini(
        options.apiKey,
        snapshot,
        options.screenshot,
      )
    } catch (e) {
      console.warn("Gemini classification failed, using rules instead:", e)
    }
  }
  return {
    state: detectPageStateByRules(snapshot),
    reason: options.apiKey ? "Gemini API failed" : "no Gemini API key",
    classifiedBy: "rules",
  }
}

/**
 * Re-classify the page of a result whose input was not found, and update
 * its verdict accordingly. Results without a snapshot are returned as is.
 */
export const classifyResult = async (
  result: ServiceCheckResult,
  options: { apiKey?: string; screenshot?: Screenshot } = {},
): Promise<ServiceCheckResult> => {
  if (!result.snapshot) return result
  const classification = await classifyPage(result.snapshot, options)
  return {
    ...result,
    pageState: classification.state,
    classification,
    verdict: decideVerdict(classification.state, result.groups),
  }
}
