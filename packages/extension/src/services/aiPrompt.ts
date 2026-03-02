import { SelectorType } from "@/const"

/**
 * Defines selectors and configuration for a supported AI service.
 */
export type AiService = {
  id: string
  name: string
  url: string
  inputSelectors: string[]
  submitSelectors: string[]
  selectorType: SelectorType
}

/**
 * List of supported AI services with their DOM selectors.
 * Selector arrays are tried in order, using the first one that matches.
 */
export const AI_SERVICES: AiService[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com",
    inputSelectors: [
      "#prompt-textarea",
      "[data-testid='prompt-textarea']",
      "#main form textarea",
    ],
    submitSelectors: [
      "form button.composer-submit-button-color",
      "button#composer-submit-button",
      "button[data-testid='composer-speech-button']",
    ],
    selectorType: SelectorType.css,
  },
  {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google.com/app",
    inputSelectors: [".ql-editor[contenteditable='true']"],
    submitSelectors: [
      "button.send-button",
      "button mat-icon[fonticon='send']",
    ],
    selectorType: SelectorType.css,
  },
  {
    id: "claude",
    name: "Claude",
    url: "https://claude.ai/new",
    inputSelectors: [
      "div[contenteditable='true'][aria-label]",
      "div[contenteditable='true'].ProseMirror",
    ],
    submitSelectors: [
      "button.bg-accent-main-000",
      "button[type=button][aria-label][disabled]",
    ],
    selectorType: SelectorType.css,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    url: "https://perplexity.ai",
    inputSelectors: [
      "div#ask-input",
      "div[contenteditable='true'][role='textbox']",
    ],
    submitSelectors: [
      "button[type='button']:has(use[*|href='#pplx-icon-arrow-up'])",
      "button[aria-label='Submit']",
    ],
    selectorType: SelectorType.css,
  },
]

/**
 * Find an AI service by its ID.
 */
export function findAiService(id: string): AiService | undefined {
  return AI_SERVICES.find((s) => s.id === id)
}
