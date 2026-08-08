import {
  PAGE_ACTION_OPEN_MODE,
  OPEN_MODE,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_EVENT,
  SelectorType,
} from "@/const"
import type { AiService } from "@/types"

/** id of the Gemini entry in ai-services.json, used to look up its selectors. */
export const SEARCH_URL_ASSIST_SERVICE_ID = "gemini"

const PROMPT_TEMPLATE =
  "User Input: Given a search result URL and the entered search keyword, generate a search URL template.\n\n# Generation steps\n1. Replace the value of the search keyword parameter with %s.\n2. Remove unnecessary query parameters that are unrelated to the search itself (e.g., ad tracking IDs, session IDs). Keep parameters required for functionality such as language or search settings.\n\n# User Input\n* Search keyword: {{search_keyword}}\n* Search result URL: {{search_result_url}}\n\n# Example of generation\n* Search keyword: test\n* Search result URL: https://www.google.com/search?q=test&rlz=1C5CHFA_enJP1116JP1116&oq=test&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgYIARBFGDwyBggCEEUYPTIGCAMQRRhBMgYIBBBFGDzSAQgxOTE0ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8\n* Search URL template: https://google.com/search?q=%s\n\n# Output format\nOutput only the search URL template in plain text. Do not include anything else.\nExample of valid output:\nhttps://google.com/search?q=%s"

// Used when `service.copySelectors` is missing (e.g. a same-day cached
// AiService fetched before this field was introduced), so the step never
// ends up with an empty selector.
const FALLBACK_COPY_SELECTOR = "copy-button button"

/**
 * Build the Search URL Assist PageAction command for Gemini.
 * Input/submit selectors are taken from `service` (sourced from
 * ai-services.json) instead of being hardcoded, so this stays working
 * across Gemini UI changes as long as ai-services.json is kept up to date.
 */
export const createSearchUrlAssistAction = (service: AiService) => {
  const inputSelector = service.inputSelectors.join(", ")
  const submitSelector = service.submitSelectors.join(", ")

  const copySelectors = service.copySelectors ?? []
  const copySelector =
    copySelectors.length > 0 ? copySelectors.join(", ") : FALLBACK_COPY_SELECTOR

  return {
    title: "Search Assist AI",
    id: "0bf16427-ff9d-456c-b505-67b468c781a7",
    revision: 0,
    iconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg",
    openMode: OPEN_MODE.PAGE_ACTION,
    popupOption: {
      height: 600,
      width: 1000,
    },
    pageActionOption: {
      openMode: PAGE_ACTION_OPEN_MODE.POPUP,
      startUrl: service.url,
      steps: [
        {
          delayMs: 0,
          id: "iiaew61ok",
          param: {
            label: "Start",
            type: PAGE_ACTION_CONTROL.start,
          },
          skipRenderWait: false,
        },
        {
          delayMs: 0,
          id: "hbbcdmvz3",
          param: {
            label: "Focus textarea",
            selector: inputSelector,
            selectorType: SelectorType.css,
            type: PAGE_ACTION_EVENT.click,
          },
          skipRenderWait: false,
        },
        {
          delayMs: 0,
          id: "5f9h14pq1",
          param: {
            label: "Input prompt",
            selector: inputSelector,
            selectorType: SelectorType.css,
            type: PAGE_ACTION_EVENT.input,
            value: PROMPT_TEMPLATE,
          },
          skipRenderWait: false,
        },
        {
          delayMs: 0,
          id: "cnkcck292",
          param: {
            label: "Submit",
            selector: submitSelector,
            selectorType: SelectorType.css,
            type: PAGE_ACTION_EVENT.click,
          },
          skipRenderWait: false,
        },
        {
          delayMs: 0,
          id: "2c30nv8o2",
          param: {
            label: "Copy to clipboard",
            selector: copySelector,
            selectorType: SelectorType.css,
            type: PAGE_ACTION_EVENT.click,
          },
          skipRenderWait: false,
        },
        {
          delayMs: 0,
          id: "f7nb0ge9b",
          param: {
            label: "End",
            type: PAGE_ACTION_CONTROL.end,
          },
          skipRenderWait: false,
        },
      ],
    },
  }
}
