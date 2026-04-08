import { UserSettings, Command, SettingsType } from "@/types"
import {
  VERSION,
  OPEN_MODE,
  SIDE,
  ALIGN,
  DRAG_OPEN_MODE,
  STARTUP_METHOD,
  STYLE,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  KEYBOARD,
  SPACE_ENCODING,
  SHORTCUT_PLACEHOLDER,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
  STYLE_VARIABLE,
  FOLDER_STYLE,
} from "@/const"
import { getAiServicesFallback } from "@/services/aiPrompt"

// Derive icon URLs from ai-services.json (single source of truth)
const _aiServices = getAiServicesFallback()
const GEMINI_ICON_URL =
  _aiServices.find((s) => s.id === "gemini")?.faviconUrl ?? ""

export const PopupPlacement = {
  side: SIDE.top,
  align: ALIGN.start,
  sideOffset: 0,
  alignOffset: 0,
}

// Empty settings for loading state
export const emptySettings: SettingsType = {
  settingVersion: "0.0.0",
  commands: [],
  folders: [],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  popupPlacement: {
    side: SIDE.top,
    align: ALIGN.start,
    alignOffset: 0,
    sideOffset: 0,
  },
  linkCommand: {
    enabled: LINK_COMMAND_ENABLED.ENABLE,
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    showIndicator: true,
    sidePanelAutoHide: false,
    startupMethod: {
      method: LINK_COMMAND_STARTUP_METHOD.KEYBOARD,
      keyboardParam: KEYBOARD.SHIFT,
      threshold: 150,
      leftClickHoldParam: 200,
    },
  },
  userStyles: [],
  startupMethod: { method: STARTUP_METHOD.TEXT_SELECTION },
  stars: [],
  commandExecutionCount: 0,
  hasShownReviewRequest: false,
  hasDismissedPromptHistoryBanner: false,
  shortcuts: { shortcuts: [] },
  windowOption: {
    sidePanelAutoHide: false,
    popupAutoCloseDelay: 0,
  },
}

export const POPUP_DELAY_DEFAULT = 250
export const POPUP_DULATION_DEFAULT = 150

// Folder IDs from the default settings
const FOLDER_SEARCH = "222d6489-4eca-48fd-8590-fceb30545bab"
const FOLDER_ACTION = "0f2167ab-2e1b-4972-954c-71eec058ab14"
const FOLDER_AI = "e4994c63-cfa7-4e49-9dfe-a79e6120a1ae"
const FOLDER_MEDIA = "a3495269-0a4d-4866-a519-bca75ed1c246"
const FOLDER_WORK = "01710cf1-ec8b-497f-8d1f-9cb716567bc4"

export default {
  settingVersion: VERSION,
  popupPlacement: PopupPlacement,
  commands: [],
  linkCommand: {
    enabled: LINK_COMMAND_ENABLED.ENABLE,
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    showIndicator: true,
    sidePanelAutoHide: false,
    startupMethod: {
      method: LINK_COMMAND_STARTUP_METHOD.KEYBOARD,
      keyboardParam: KEYBOARD.SHIFT,
      threshold: 150,
      leftClickHoldParam: 200,
    },
  },
  folders: [
    {
      title: "Search",
      iconUrl:
        "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png",
      id: FOLDER_SEARCH,
      onlyIcon: true,
    },
    {
      title: "Action",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
      id: FOLDER_ACTION,
      onlyIcon: true,
    },
    {
      title: "AI",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wand-sparkles-icon lucide-wand-sparkles"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>',
      id: FOLDER_AI,
      onlyIcon: true,
      style: FOLDER_STYLE.VERTICAL,
    },
    {
      title: "Media",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-play-icon lucide-monitor-play"><path d="M10 7.75a.75.75 0 0 1 1.142-.638l3.664 2.249a.75.75 0 0 1 0 1.278l-3.664 2.25a.75.75 0 0 1-1.142-.64z"/><path d="M12 17v4"/><path d="M8 21h8"/><rect x="2" y="3" width="20" height="14" rx="2"/></svg>',
      id: FOLDER_MEDIA,
      onlyIcon: true,
    },
    {
      title: "Work",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
      id: FOLDER_WORK,
    },
  ],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  startupMethod: {
    method: STARTUP_METHOD.TEXT_SELECTION,
  },
  userStyles: [
    {
      name: STYLE_VARIABLE.POPUP_DELAY,
      value: POPUP_DELAY_DEFAULT,
    },
    {
      name: STYLE_VARIABLE.POPUP_DURATION,
      value: POPUP_DULATION_DEFAULT,
    },
    {
      name: STYLE_VARIABLE.PADDING_SCALE,
      value: "1.5",
    },
    {
      name: STYLE_VARIABLE.IMAGE_SCALE,
      value: "1.1",
    },
    {
      name: STYLE_VARIABLE.FONT_SCALE,
      value: "1.1",
    },
  ],
  stars: [],
  shortcuts: {
    shortcuts: [
      {
        id: "slot_1",
        commandId: SHORTCUT_PLACEHOLDER,
        noSelectionBehavior: SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD,
      },
      {
        id: "slot_2",
        commandId: SHORTCUT_PLACEHOLDER,
        noSelectionBehavior: SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD,
      },
      {
        id: "slot_3",
        commandId: SHORTCUT_PLACEHOLDER,
        noSelectionBehavior: SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD,
      },
    ],
  },
  windowOption: {
    sidePanelAutoHide: false,
    popupAutoCloseDelay: 0,
  },
} as UserSettings

export const PopupOption = {
  width: 600,
  height: 700,
}

export const DefaultCommands = [
  {
    id: "$$drag-1",
    revision: 0,
    title: "Link Preview",
    searchUrl: "",
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "0cb9dbbc-c0cf-53c6-93e5-016363705216",
    revision: 0,
    iconUrl: "https://www.google.com/favicon.ico",
    openMode: OPEN_MODE.POPUP,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://google.com/search?q=%s",
    title: "Google",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "26c47b36-c3c8-528c-9ad2-c972dfc6f4df",
    revision: 0,
    iconUrl: "https://www.google.com/favicon.ico",
    openMode: OPEN_MODE.POPUP,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://google.com/search?q=%s&tbm=isch",
    title: "Google Image",
    parentFolderId: FOLDER_SEARCH,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "c0d05ae1-f007-5bd0-8fa6-e3bc0b79ca97",
    revision: 0,
    iconUrl: "https://www.amazon.com/favicon.ico",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.amazon.com/s?k=%s",
    title: "Amazon",
    parentFolderId: FOLDER_SEARCH,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "2b6fee1e-6500-5421-af79-6fa53ddc25c1",
    revision: 0,
    iconUrl: "https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.youtube.com/results?search_query=%s",
    title: "Youtube",
    parentFolderId: FOLDER_MEDIA,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "fb9cb6ad-76e3-5aa8-82a7-ade233edcec0",
    revision: 0,
    iconUrl:
      "https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.netflix.com/search?q=%s",
    title: "Netflix",
    parentFolderId: FOLDER_MEDIA,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "30797fb1-5bc7-585a-ba53-fa5420e417d9",
    revision: 0,
    iconUrl: "https://s.pinimg.com/webapp/favicon-22eb868c.png",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.pinterest.com/search/pins/?q=%s",
    title: "Pinterest",
    parentFolderId: FOLDER_MEDIA,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "dd05d527-92db-5102-9a88-4a5b31fa7512",
    revision: 0,
    iconUrl:
      "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://drive.google.com/drive/search?q=%s",
    title: "Drive",
    parentFolderId: FOLDER_WORK,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "69179b92-b6f1-5265-b4e4-e4d8443eabac",
    revision: 0,
    title: "Page Summary",
    iconUrl: GEMINI_ICON_URL,
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt: "Please summarize the content of the following page.\n{{Url}}",
      openMode: OPEN_MODE.SIDE_PANEL,
    },
    parentFolderId: FOLDER_AI,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "4d0666a4-3c4f-5ebc-8da4-36fc876e9dd9",
    revision: 0,
    title: "YouTube Summary",
    iconUrl: GEMINI_ICON_URL,
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt:
        "Please summarize the content of the following YouTube video.\n{{Url}}",
      openMode: OPEN_MODE.SIDE_PANEL,
    },
    parentFolderId: FOLDER_AI,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "9ce6febc-3d60-5e34-bc1e-0499bde34f77",
    revision: 0,
    title: "Translation",
    iconUrl: GEMINI_ICON_URL,
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt:
        "Please translate the following text between English and the detected language.\n{{SelectedText}}",
      openMode: OPEN_MODE.SIDE_PANEL,
    },
    parentFolderId: FOLDER_AI,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "a26b4c84-b56a-5e56-bf7d-2dde3998a756",
    revision: 0,
    title: "Gemini",
    iconUrl: GEMINI_ICON_URL,
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt: "Please explain the following.\n{{SelectedText}}",
      openMode: OPEN_MODE.POPUP,
    },
    parentFolderId: FOLDER_AI,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
] as Command[]

// Common commands shared across locales
const CMD_LINK_PREVIEW = {
  id: "$$drag-1",
  revision: 0,
  title: "Link Preview",
  openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_GOOGLE = {
  id: "0cb9dbbc-c0cf-53c6-93e5-016363705216",
  revision: 0,
  iconUrl: "https://www.google.com/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://google.com/search?q=%s",
  title: "Google",
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GOOGLE_IMAGE = {
  id: "26c47b36-c3c8-528c-9ad2-c972dfc6f4df",
  revision: 0,
  iconUrl: "https://www.google.com/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://google.com/search?q=%s&tbm=isch",
  title: "Google Image",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_JA = {
  id: "1d320825-1e78-5f98-b73c-1bb48412e98c",
  revision: 0,
  title: "Gemini - 日本語",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "以下について解説してください。\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE = {
  id: "2b6fee1e-6500-5421-af79-6fa53ddc25c1",
  revision: 0,
  iconUrl: "https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.youtube.com/results?search_query=%s",
  title: "Youtube",
  parentFolderId: FOLDER_MEDIA,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_NETFLIX = {
  id: "fb9cb6ad-76e3-5aa8-82a7-ade233edcec0",
  revision: 0,
  iconUrl: "https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.netflix.com/search?q=%s",
  title: "Netflix",
  parentFolderId: FOLDER_MEDIA,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_DRIVE = {
  id: "dd05d527-92db-5102-9a88-4a5b31fa7512",
  revision: 0,
  iconUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://drive.google.com/drive/search?q=%s",
  title: "Drive",
  parentFolderId: FOLDER_WORK,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_EN_TO_JA = {
  id: "9a3fca67-e618-5dd3-9ecd-9eb2d088041a",
  revision: 0,
  iconUrl: "https://ssl.gstatic.com/translate/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl:
    "https://translate.google.co.jp/?hl=ja&sl=auto&text=%s&op=translate",
  title: "en to ja",
  parentFolderId: FOLDER_WORK,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_CHARACTER_COUNTER = {
  id: "03646140-c83f-5ee6-87ba-8feb12030af0",
  revision: 0,
  title: "Character Counter",
  iconUrl: "https://web-toolbox.dev/favicon.svg",
  parentFolderId: FOLDER_ACTION,
  openMode: OPEN_MODE.PAGE_ACTION,
  pageActionOption: {
    startUrl: "https://web-toolbox.dev/tools/character-counter",
    openMode: "popup",
    steps: [
      {
        id: "b28aqptaq",
        param: {
          type: "start",
          label: "Start",
          url: "https://web-toolbox.dev/tools/character-counter",
        },
      },
      {
        id: "xswttnk5r",
        param: {
          type: "click",
          label: "textarea",
          selector: "//textarea",
          selectorType: "xpath",
        },
        delayMs: 100,
      },
      {
        id: "pycqdt0ap",
        param: {
          type: "input",
          label: "文字入力",
          selector: "//textarea",
          selectorType: "xpath",
          value: "{{SelectedText}}",
        },
      },
      {
        id: "8tsr1lz9m",
        param: {
          type: "scroll",
          label: "表示位置までスクロール",
          x: 0,
          y: 812,
        },
      },
      {
        id: "erkxkfph0",
        param: {
          type: "end",
          label: "End",
        },
      },
    ],
  },
}

// ---- Locale-specific command definitions ----

// ja: Japan
const CMD_YAHOO_JAPAN = {
  id: "2bcb5d3a-15b6-5e3f-b59d-94b0fdc68ea9",
  revision: 0,
  iconUrl: "https://s.yimg.jp/c/icon/s/bsc/2.0/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://search.yahoo.co.jp/search?p=%s",
  title: "Yahoo! Japan",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_AMAZON_JP = {
  id: "9d61d45c-36ab-5ebf-ad42-d3f3a42810bf",
  revision: 0,
  iconUrl: "https://www.amazon.co.jp/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.co.jp/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

// zh_CN: China
const CMD_BAIDU = {
  id: "f004f082-f4e5-5ba7-af0a-2db1f8a55d37",
  revision: 0,
  iconUrl: "https://www.baidu.com/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.baidu.com/s?wd=%s",
  title: "百度",
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_BILIBILI = {
  id: "b2f4c26c-ae12-5261-b7ed-5c24b2b9fb56",
  revision: 0,
  iconUrl: "https://www.bilibili.com/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://search.bilibili.com/all?keyword=%s",
  title: "哔哩哔哩",
  parentFolderId: FOLDER_MEDIA,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_JD = {
  id: "8ce5625c-e9f9-5b13-93ba-23ac954fe6ba",
  revision: 0,
  iconUrl: "https://www.jd.com/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://search.jd.com/Search?keyword=%s",
  title: "京东",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_ZHIHU = {
  id: "0458f7cd-4e84-5b9e-a3ee-fd35d3f84a41",
  revision: 0,
  iconUrl: "https://static.zhihu.com/static/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.zhihu.com/search?q=%s",
  title: "知乎",
  parentFolderId: FOLDER_WORK,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_ZH = {
  id: "7a97ca1a-00da-536c-a77f-09b6ca2840b6",
  revision: 0,
  title: "Gemini - 中文",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请解释以下内容。\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ko: Korea
const CMD_NAVER = {
  id: "31887e39-e3fa-5799-9094-0ac03dd30508",
  revision: 0,
  iconUrl: "https://www.naver.com/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://search.naver.com/search.naver?query=%s",
  title: "네이버",
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  parentFolderId: FOLDER_SEARCH,
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_COUPANG = {
  id: "6b2d5167-1253-5a14-8b72-0b9679c38474",
  revision: 0,
  iconUrl: "https://www.coupang.com/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.coupang.com/np/search?q=%s",
  title: "쿠팡",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_KO = {
  id: "02cff7da-117c-589d-9b32-0c3946180257",
  revision: 0,
  title: "Gemini - 한국어",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "다음에 대해 설명해 주세요.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ru: Russia
const CMD_YANDEX = {
  id: "7b8ef164-c070-5112-820e-f4d1b6a22ff3",
  revision: 0,
  iconUrl: "https://yandex.ru/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://yandex.ru/search/?text=%s",
  title: "Яндекс",
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_VK = {
  id: "9897e8ae-2940-5eea-b4ac-8a55648d3dff",
  revision: 0,
  iconUrl: "https://vk.com/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://vk.com/search?c%5Bq%5D=%s",
  title: "ВКонтакте",
  parentFolderId: FOLDER_MEDIA,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_OZON = {
  id: "c9524f7d-1ae0-5600-a455-9b29e8286a33",
  revision: 0,
  iconUrl: "https://www.ozon.ru/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.ozon.ru/search/?text=%s",
  title: "Ozon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_RU = {
  id: "ae036565-4b06-5820-8132-d05f21327c2e",
  revision: 0,
  title: "Gemini - Русский",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Пожалуйста, объясните следующее.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_WILDBERRIES = {
  id: "95146f74-3436-54b8-9019-0facc146d9ac",
  revision: 0,
  iconUrl: "https://www.wildberries.ru/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.wildberries.ru/catalog/0/search.aspx?search=%s",
  title: "Wildberries",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

// de: Germany
const CMD_AMAZON_DE = {
  id: "e7f7a81e-fc01-55f7-b692-139d3183d27c",
  revision: 0,
  iconUrl: "https://www.amazon.de/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.de/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_EBAY_DE = {
  id: "6cbac506-1ef4-514e-a830-66e182fc9903",
  revision: 0,
  iconUrl: "https://www.ebay.de/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.ebay.de/sch/i.html?_nkw=%s",
  title: "eBay",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_DE = {
  id: "de4e4860-e81b-5d39-bbf5-b85516d99bdf",
  revision: 0,
  title: "Gemini - Deutsch",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Bitte erkläre Folgendes.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// fr: France
const CMD_AMAZON_FR = {
  id: "4d48cb20-92be-5745-affc-5efa8946884f",
  revision: 0,
  iconUrl: "https://www.amazon.fr/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.fr/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_LEBONCOIN = {
  id: "6f046a4c-1567-5b90-bef5-9ed79dfad6d7",
  revision: 0,
  iconUrl: "https://www.leboncoin.fr/_next/static/media/favicon.6fd07af6.svg",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.leboncoin.fr/recherche?text=%s",
  title: "leboncoin",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_FR = {
  id: "db893fd8-80f3-5f15-9d76-dcd0e202c8c9",
  revision: 0,
  title: "Gemini - Français",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Veuillez expliquer ce qui suit.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// es: Spanish
const CMD_AMAZON_ES = {
  id: "f78091a8-142b-586c-b29c-63fad083cba1",
  revision: 0,
  iconUrl: "https://www.amazon.es/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.es/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_EBAY_ES = {
  id: "57cc9467-178b-5a83-81ce-0d913a662637",
  revision: 0,
  iconUrl: "https://www.ebay.es/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.ebay.es/sch/i.html?_nkw=%s",
  title: "eBay",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_EL_CORTE_INGLES = {
  id: "8e6d9feb-c7fc-5a9b-b441-1cdba5ffbd10",
  revision: 0,
  iconUrl:
    "https://cdn.grupoelcorteingles.es/statics/front-msh3-eci-es/assets//stylesheets/favicons/vuestore/favicon.ico?_MTI6MDMtMDI6MjQ6MDA",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.elcorteingles.es/search-nwx/?s=%s",
  title: "El Corte Inglés",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_ALIEXPRESS_ES = {
  id: "3f5ed184-2a50-5f78-98e2-f4d7312141b4",
  revision: 0,
  iconUrl: "https://ae01.alicdn.com/kf/S05616f829f70427eb3389e1489f66613F.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://es.aliexpress.com/w/wholesale-%s.html",
  title: "AliExpress",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.DASH,
}

const CMD_GEMINI_ES = {
  id: "0e1b2488-fa94-5873-ac84-e0b5fd322a9e",
  revision: 0,
  title: "Gemini - Español",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Por favor, explica lo siguiente.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// pt-BR: Brazil
const CMD_AMAZON_BR = {
  id: "57f5d511-5102-5e15-8b5e-c54e1d29e65e",
  revision: 0,
  iconUrl: "https://www.amazon.com.br/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.com.br/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_MERCADO_LIVRE_BR = {
  id: "322a91ca-efc6-5a8d-9e00-3538b819665b",
  revision: 0,
  iconUrl:
    "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://lista.mercadolivre.com.br/%s",
  title: "Mercado Livre",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_PT = {
  id: "81ce215c-fabc-576f-a079-311e093c87b1",
  revision: 0,
  title: "Gemini - Português",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Por favor, explique o seguinte.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// pt-PT: Portugal
const CMD_OLX_PT = {
  id: "bec3f4b8-0929-53bb-adcb-cd68795cf360",
  revision: 0,
  iconUrl: "https://www.olx.pt/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.olx.pt/ads/?q=%s",
  title: "OLX",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

// hi: India
const CMD_AMAZON_IN = {
  id: "2dcbe879-de97-5099-b647-c70f56272b67",
  revision: 0,
  iconUrl: "https://www.amazon.in/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.in/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_FLIPKART = {
  id: "2483f07e-b860-5687-8db8-907c87020bc6",
  revision: 0,
  iconUrl:
    "https://static-assets-web.flixcart.com/www/promos/new/20150528-140547-favicon-retina.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.flipkart.com/search?q=%s",
  title: "Flipkart",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_HI = {
  id: "e2315dec-3b61-5857-ac49-e4dc1cbf23ab",
  revision: 0,
  title: "Gemini - हिन्दी",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "कृपया निम्नलिखित के बारे में बताएं।\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// id: Indonesia
const CMD_TOKOPEDIA = {
  id: "e09dbc37-f018-5444-8b0c-c10158a049b3",
  revision: 0,
  iconUrl:
    "https://p16-images-comn-sg.tokopedia-static.net/tos-alisg-i-zr7vqa5nfb-sg/assets-tokopedia-lite/prod/icon144.png~tplv-zr7vqa5nfb-image.image",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.tokopedia.com/search?st=product&q=%s",
  title: "Tokopedia",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_SHOPEE_ID = {
  id: "be521b5f-2d9c-5312-9001-6c1c83a79fa6",
  revision: 0,
  iconUrl: "https://shopee.co.id/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://shopee.co.id/search?keyword=%s",
  title: "Shopee",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_ID = {
  id: "4875bd38-150f-5fb5-899d-0ff59e918588",
  revision: 0,
  title: "Gemini - Indonesia",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Tolong jelaskan hal berikut.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ms: Malaysia
const CMD_SHOPEE_MY = {
  id: "d583ed37-a972-5f96-a927-ecbfaac9519f",
  revision: 0,
  iconUrl: "https://shopee.com.my/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://shopee.com.my/search?keyword=%s",
  title: "Shopee",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_LAZADA_MY = {
  id: "aefb2b74-0803-5a63-9abd-253c4bae3888",
  revision: 0,
  iconUrl: "https://www.lazada.com.my/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.lazada.com.my/catalog/?q=%s",
  title: "Lazada",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_MS = {
  id: "ba62af6d-e6ab-5573-aa86-f193f7cd5cdf",
  revision: 0,
  title: "Gemini - Melayu",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Sila terangkan perkara berikut.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// it: Italy
const CMD_AMAZON_IT = {
  id: "630aeda8-3baa-5a8d-a9ef-1a6d80dc48bc",
  revision: 0,
  iconUrl: "https://www.amazon.it/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.amazon.it/s?k=%s",
  title: "Amazon",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_EBAY_IT = {
  id: "5db2eb4a-8169-5141-8332-32440097a0f5",
  revision: 0,
  iconUrl: "https://www.ebay.it/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.ebay.it/sch/i.html?_nkw=%s",
  title: "eBay.it",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_ZALANDO_IT = {
  id: "433426f0-7817-58aa-bc21-4b030e6918f8",
  revision: 0,
  iconUrl: "https://www.zalando.it/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.zalando.it/catalogo/?q=%s",
  title: "Zalando.it",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_IT = {
  id: "9b6c7262-5fea-5fba-b682-12502b7f8c21",
  revision: 0,
  title: "Gemini - Italiano",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Si prega di spiegare quanto segue.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ---- AI Prompt: Page Summary commands ----

const CMD_PAGE_SUMMARY_JA = {
  id: "afe67f66-fc8d-555f-9e51-2d1491906faf",
  revision: 0,
  title: "ページの概要生成",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "以下のURLのページを日本語で要約してください。\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_ZH = {
  id: "2ae69b7e-be6e-515d-af88-996a26ab4509",
  revision: 0,
  title: "页面摘要",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请用中文总结以下网页的内容。\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_KO = {
  id: "9edd9c6c-f4e1-5afe-8e8c-50d5ad7d32df",
  revision: 0,
  title: "페이지 요약",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "다음 URL의 페이지 내용을 한국어로 요약해 주세요.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_RU = {
  id: "f0d38781-227b-5993-b32f-2d1fc2a5fb48",
  revision: 0,
  title: "Краткое содержание страницы",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Пожалуйста, кратко изложите содержание следующей страницы на русском языке.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_DE = {
  id: "aa8412b2-c5c0-5642-b978-c94dfb465aa5",
  revision: 0,
  title: "Seitenzusammenfassung",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Bitte fasse den Inhalt der folgenden Seite auf Deutsch zusammen.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_FR = {
  id: "b681aae6-7bee-5ef0-9602-e282eb6e8380",
  revision: 0,
  title: "Résumé de la page",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Veuillez résumer le contenu de la page suivante en français.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_ES = {
  id: "f84d29d0-9b1f-503e-ba17-3115c0299b37",
  revision: 0,
  title: "Resumen de página",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resume el contenido de la siguiente página en español.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_PT = {
  id: "27e66097-ee7a-5bc9-9b93-38bd7d78a003",
  revision: 0,
  title: "Resumo da página",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resuma o conteúdo da seguinte página em português.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_HI = {
  id: "03c3a86d-d80f-5092-b62a-bd8f8d9416e1",
  revision: 0,
  title: "पृष्ठ सारांश",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "कृपया निम्नलिखित पृष्ठ की सामग्री को हिंदी में सारांशित करें।\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_ID = {
  id: "d7e7b5e3-d502-5ee1-b27a-8b144ceef395",
  revision: 0,
  title: "Ringkasan halaman",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Tolong ringkas konten halaman berikut dalam bahasa Indonesia.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_MS = {
  id: "d73e6c46-5c98-563d-b572-b0f44f274ee1",
  revision: 0,
  title: "Ringkasan halaman",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Sila ringkaskan kandungan halaman berikut dalam Bahasa Melayu.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_IT = {
  id: "3f883a69-d5af-516c-8d2e-85470b83dae3",
  revision: 0,
  title: "Riepilogo pagina",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Si prega di riassumere il contenuto della pagina seguente in italiano.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ---- AI Prompt: YouTube Summary commands ----

const CMD_YOUTUBE_SUMMARY_JA = {
  id: "7afd0cb7-45a4-5943-a00d-b04d12317eb1",
  revision: 0,
  title: "YouTubeの概要生成",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "以下のYouTube動画の内容を日本語で要約してください。\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_ZH = {
  id: "35f2e8fc-653b-54bc-b7a5-e0a60c76af7c",
  revision: 0,
  title: "YouTube摘要",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请用中文总结以下YouTube视频的内容。\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_KO = {
  id: "07a072a4-c1f0-5e5a-9259-2a8467f52388",
  revision: 0,
  title: "YouTube 요약",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "다음 YouTube 동영상의 내용을 한국어로 요약해 주세요.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_RU = {
  id: "9f67ba1e-a8b0-5271-89a4-501a3d20bd08",
  revision: 0,
  title: "Краткое содержание YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Пожалуйста, кратко изложите содержание следующего видео на YouTube на русском языке.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_DE = {
  id: "075aaa5d-fb7c-5d41-b252-0be55dda3462",
  revision: 0,
  title: "YouTube-Zusammenfassung",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Bitte fasse den Inhalt des folgenden YouTube-Videos auf Deutsch zusammen.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_FR = {
  id: "8aa29111-e8f0-5374-8e6d-b2e410dfdca8",
  revision: 0,
  title: "Résumé YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Veuillez résumer le contenu de la vidéo YouTube suivante en français.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_ES = {
  id: "e1edae1f-e78c-5052-adfd-c39863ea613c",
  revision: 0,
  title: "Resumen de YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resume el contenido del siguiente video de YouTube en español.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_PT = {
  id: "2e21b51f-86a0-51ed-9231-116adb093b46",
  revision: 0,
  title: "Resumo do YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resuma o conteúdo do seguinte vídeo do YouTube em português.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_HI = {
  id: "1497d212-d290-5a11-9913-e15d9e68df7d",
  revision: 0,
  title: "YouTube सारांश",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "कृपया निम्नलिखित YouTube वीडियो की सामग्री को हिंदी में सारांशित करें।\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_ID = {
  id: "89a86b00-c71c-5505-9b95-a50723090a34",
  revision: 0,
  title: "Ringkasan YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Tolong ringkas konten video YouTube berikut dalam bahasa Indonesia.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_MS = {
  id: "6cd49bd1-0d99-5bb9-9af5-93ceddbdc7e7",
  revision: 0,
  title: "Ringkasan YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Sila ringkaskan kandungan video YouTube berikut dalam Bahasa Melayu.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_IT = {
  id: "9b53d9b0-6515-512c-a3a3-4ec03b4e25c8",
  revision: 0,
  title: "Riepilogo YouTube",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Si prega di riassumere il contenuto del seguente video di YouTube in italiano.\n{{Url}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ---- AI Prompt: Translation commands ----

const CMD_TRANSLATE_JA = {
  id: "a8d027bf-7926-56c4-ad4d-610ef10c22b3",
  revision: 0,
  title: "選択テキストの相互翻訳",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "以下のテキストを日本語と英語の間で翻訳してください。\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_ZH = {
  id: "e58f08e6-930d-5bff-a8d4-fd5247b30e57",
  revision: 0,
  title: "文本互译",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请将以下文本在中英文之间进行互译。\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_KO = {
  id: "96648587-9316-51d0-99cc-57344f83832c",
  revision: 0,
  title: "텍스트 번역",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "다음 텍스트를 한국어와 영어 사이에서 번역해 주세요.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_RU = {
  id: "73e7dfc0-6aa1-5102-9a00-bfcc612a8fdc",
  revision: 0,
  title: "Перевод текста",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Пожалуйста, переведите следующий текст между русским и английским языками.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_DE = {
  id: "247a65b1-7b38-5489-b6b2-27530a4d0e5b",
  revision: 0,
  title: "Textübersetzung",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Bitte übersetze den folgenden Text zwischen Deutsch und Englisch.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_FR = {
  id: "bd1c80ea-2362-5140-a93b-c2020012a61c",
  revision: 0,
  title: "Traduction de texte",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Veuillez traduire le texte suivant entre le français et l'anglais.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_ES = {
  id: "484fdcfc-5a74-51aa-8e84-885226911983",
  revision: 0,
  title: "Traducción de texto",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, traduce el siguiente texto entre español e inglés.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_PT = {
  id: "a470aca5-81bd-5c3b-bb66-a763d5d1030a",
  revision: 0,
  title: "Tradução de texto",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, traduza o seguinte texto entre português e inglês.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_HI = {
  id: "08f5b563-871b-57f7-9e2c-e7b86a99f0ec",
  revision: 0,
  title: "पाठ अनुवाद",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "कृपया निम्नलिखित पाठ को हिंदी और अंग्रेजी के बीच अनुवाद करें।\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_ID = {
  id: "981877d3-8d5c-5a0c-9f9d-d2308ab4b11e",
  revision: 0,
  title: "Terjemahan teks",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Tolong terjemahkan teks berikut antara bahasa Indonesia dan bahasa Inggris.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_MS = {
  id: "d5ad304a-41f2-5afd-b46d-7662a81fc194",
  revision: 0,
  title: "Terjemahan teks",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Sila terjemahkan teks berikut antara Bahasa Melayu dan Bahasa Inggeris.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_IT = {
  id: "cea27aac-3a5b-5010-9dcc-335d13f65958",
  revision: 0,
  title: "Traduzione testo",
  iconUrl: GEMINI_ICON_URL,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Si prega di tradurre il seguente testo tra italiano e inglese.\n{{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  parentFolderId: FOLDER_AI,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

/**
 * Returns locale-appropriate default commands.
 * Falls back to global English defaults for unknown locales.
 *
 * @param locale - BCP 47 locale string (e.g. "ja", "zh-CN", "pt-BR").
 *                 Typically obtained via chrome.i18n.getUILanguage().
 */
// Locale-specific command sets keyed by language code.
// Exact-match keys (e.g. "pt-br") take priority over prefix keys (e.g. "pt").
export const LOCALE_COMMANDS = {
  ja: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_JP,
    CMD_YAHOO_JAPAN,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_GEMINI_JA,
    CMD_CHARACTER_COUNTER,
    CMD_PAGE_SUMMARY_JA,
    CMD_YOUTUBE_SUMMARY_JA,
    CMD_TRANSLATE_JA,
    CMD_DRIVE,
    CMD_EN_TO_JA,
  ],
  zh: [
    CMD_LINK_PREVIEW,
    CMD_BAIDU,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_JD,
    CMD_GEMINI_ZH,
    CMD_PAGE_SUMMARY_ZH,
    CMD_YOUTUBE_SUMMARY_ZH,
    CMD_TRANSLATE_ZH,
    CMD_BILIBILI,
    CMD_DRIVE,
    CMD_ZHIHU,
    CMD_CHARACTER_COUNTER,
  ],
  ko: [
    CMD_LINK_PREVIEW,
    CMD_NAVER,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_COUPANG,
    CMD_GEMINI_KO,
    CMD_PAGE_SUMMARY_KO,
    CMD_YOUTUBE_SUMMARY_KO,
    CMD_TRANSLATE_KO,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  ru: [
    CMD_LINK_PREVIEW,
    CMD_YANDEX,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_OZON,
    CMD_WILDBERRIES,
    CMD_GEMINI_RU,
    CMD_PAGE_SUMMARY_RU,
    CMD_YOUTUBE_SUMMARY_RU,
    CMD_TRANSLATE_RU,
    CMD_YOUTUBE,
    CMD_VK,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  de: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_DE,
    CMD_EBAY_DE,
    CMD_GEMINI_DE,
    CMD_PAGE_SUMMARY_DE,
    CMD_YOUTUBE_SUMMARY_DE,
    CMD_TRANSLATE_DE,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  fr: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_FR,
    CMD_LEBONCOIN,
    CMD_GEMINI_FR,
    CMD_PAGE_SUMMARY_FR,
    CMD_YOUTUBE_SUMMARY_FR,
    CMD_TRANSLATE_FR,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  es: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_ES,
    CMD_EBAY_ES,
    CMD_EL_CORTE_INGLES,
    CMD_ALIEXPRESS_ES,
    CMD_GEMINI_ES,
    CMD_PAGE_SUMMARY_ES,
    CMD_YOUTUBE_SUMMARY_ES,
    CMD_TRANSLATE_ES,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  "pt-br": [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_BR,
    CMD_MERCADO_LIVRE_BR,
    CMD_GEMINI_PT,
    CMD_PAGE_SUMMARY_PT,
    CMD_YOUTUBE_SUMMARY_PT,
    CMD_TRANSLATE_PT,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  pt: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_ES,
    CMD_OLX_PT,
    CMD_GEMINI_PT,
    CMD_PAGE_SUMMARY_PT,
    CMD_YOUTUBE_SUMMARY_PT,
    CMD_TRANSLATE_PT,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  hi: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_IN,
    CMD_FLIPKART,
    CMD_GEMINI_HI,
    CMD_PAGE_SUMMARY_HI,
    CMD_YOUTUBE_SUMMARY_HI,
    CMD_TRANSLATE_HI,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  id: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_TOKOPEDIA,
    CMD_SHOPEE_ID,
    CMD_GEMINI_ID,
    CMD_PAGE_SUMMARY_ID,
    CMD_YOUTUBE_SUMMARY_ID,
    CMD_TRANSLATE_ID,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  ms: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_SHOPEE_MY,
    CMD_LAZADA_MY,
    CMD_GEMINI_MS,
    CMD_PAGE_SUMMARY_MS,
    CMD_YOUTUBE_SUMMARY_MS,
    CMD_TRANSLATE_MS,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
  it: [
    CMD_LINK_PREVIEW,
    CMD_GOOGLE,
    CMD_GOOGLE_IMAGE,
    CMD_AMAZON_IT,
    CMD_EBAY_IT,
    CMD_ZALANDO_IT,
    CMD_GEMINI_IT,
    CMD_PAGE_SUMMARY_IT,
    CMD_YOUTUBE_SUMMARY_IT,
    CMD_TRANSLATE_IT,
    CMD_YOUTUBE,
    CMD_NETFLIX,
    CMD_DRIVE,
    CMD_CHARACTER_COUNTER,
  ],
} as Record<string, Command[]>

export function getDefaultCommands(locale?: string): Command[] {
  const lang = (locale ?? "").toLowerCase().replace("_", "-")

  // Try exact match first (e.g. "pt-br"), then prefix match (e.g. "pt")
  const exactMatch = LOCALE_COMMANDS[lang]
  if (exactMatch) return exactMatch

  const prefixKey = Object.keys(LOCALE_COMMANDS).find((k) => lang.startsWith(k))
  return prefixKey ? LOCALE_COMMANDS[prefixKey] : DefaultCommands
}
