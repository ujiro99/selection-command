import { PAGE_ACTION_OPEN_MODE, OPEN_MODE } from "@/const"

export const searchUrlAssistAction = {
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
    startUrl: "https://gemini.google.com/app",
    steps: [
      {
        delayMs: 0,
        id: "iiaew61ok",
        param: {
          label: "Start",
          type: "start",
        },
        skipRenderWait: false,
      },
      {
        delayMs: 0,
        id: "hbbcdmvz3",
        param: {
          label: "Focus textarea",
          selector: "//*[@role='textbox']/*",
          selectorType: "xpath",
          type: "click",
        },
        skipRenderWait: false,
      },
      {
        delayMs: 0,
        id: "5f9h14pq1",
        param: {
          label: "Input prompt",
          selector: "//*[@role='textbox']/*",
          selectorType: "xpath",
          type: "input",
          value:
            "User Input: Given a search result URL and the entered search keyword, generate a search URL template.\n\n# Generation steps\n1. Replace the value of the search keyword parameter with %s.\n2. Remove unnecessary query parameters that are unrelated to the search itself (e.g., ad tracking IDs, session IDs). Keep parameters required for functionality such as language or search settings.\n\n# User Input\n* Search keyword: {{search_keyword}}\n* Search result URL: {{search_result_url}}\n\n# Example of generation\n* Search keyword: test\n* Search result URL: https://www.google.com/search?q=test&rlz=1C5CHFA_enJP1116JP1116&oq=test&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgYIARBFGDwyBggCEEUYPTIGCAMQRRhBMgYIBBBFGDzSAQgxOTE0ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8\n* Search URL template: https://google.com/search?q=%s\n\n# Output format\nOutput only the search URL template in plain text. Do not include anything else.\nExample of valid output:\nhttps://google.com/search?q=%s",
        },
        skipRenderWait: false,
      },
      {
        delayMs: 0,
        id: "cnkcck292",
        param: {
          label: "Submit",
          selector: "//*[@data-mat-icon-name='send']",
          selectorType: "xpath",
          type: "click",
        },
        skipRenderWait: false,
      },
      {
        delayMs: 0,
        id: "2c30nv8o2",
        param: {
          label: "Copy to clipboard",
          selector: "//*[@data-mat-icon-name='content_copy']",
          selectorType: "xpath",
          type: "click",
        },
        skipRenderWait: false,
      },
      {
        delayMs: 0,
        id: "f7nb0ge9b",
        param: {
          label: "End",
          type: "end",
        },
        skipRenderWait: false,
      },
    ],
  },
}
