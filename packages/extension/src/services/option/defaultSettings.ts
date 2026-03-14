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
} from "@/const"

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
      id: "222d6489-4eca-48fd-8590-fceb30545bab",
      onlyIcon: true,
    },
    {
      title: "Action",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
      id: "0f2167ab-2e1b-4972-954c-71eec058ab14",
      onlyIcon: true,
    },
    {
      title: "Media",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-play-icon lucide-monitor-play"><path d="M10 7.75a.75.75 0 0 1 1.142-.638l3.664 2.249a.75.75 0 0 1 0 1.278l-3.664 2.25a.75.75 0 0 1-1.142-.64z"/><path d="M12 17v4"/><path d="M8 21h8"/><rect x="2" y="3" width="20" height="14" rx="2"/></svg>',
      id: "a3495269-0a4d-4866-a519-bca75ed1c246",
      onlyIcon: true,
    },
    {
      title: "Work",
      iconUrl: "",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
      id: "01710cf1-ec8b-497f-8d1f-9cb716567bc4",
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
    id: "723ee9f1-150b-54ad-aeac-5fbfd0ae3650",
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
    id: "18998bac-4e6c-503f-b3ea-b9198edef7c3",
    revision: 0,
    iconUrl: "https://www.google.com/favicon.ico",
    openMode: OPEN_MODE.POPUP,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://google.com/search?q=%s&tbm=isch",
    title: "Google Image",
    parentFolderId: "222d6489-4eca-48fd-8590-fceb30545bab",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "92f8f4e8-3cd8-4e01-9908-811d72448670",
    revision: 0,
    iconUrl: "https://www.amazon.com/favicon.ico",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.amazon.com/s?k=%s",
    title: "Amazon",
    parentFolderId: "222d6489-4eca-48fd-8590-fceb30545bab",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "06964cb6-019d-511f-b16f-18c7bbd2c785",
    revision: 0,
    title: "Gemini",
    iconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: {
      openMode: OPEN_MODE.POPUP,
      startUrl: "https://gemini.google.com/app",
      steps: [
        {
          id: "1clkfxbrr",
          param: {
            label: "Start",
            type: "start",
          },
        },
        {
          id: "gmavyqlj2",
          param: {
            label: "Ask Gemini",
            selector: "//*[@data-gramm='false']/*",
            selectorType: "xpath",
            type: "input",
            value: "Please explain the following.\n{{SelectedText}}",
          },
        },
        {
          id: "umb7r0prx",
          param: {
            label: "",
            selector: "//*[@data-mat-icon-name='send']",
            selectorType: "xpath",
            type: "click",
          },
        },
        {
          id: "stjwk2dnp",
          param: {
            label: "End",
            type: "end",
          },
        },
      ],
    },
    parentFolderId: "0f2167ab-2e1b-4972-954c-71eec058ab14",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "2e0cd6fe-a232-402e-846c-2104f0639995",
    revision: 0,
    iconUrl: "https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.youtube.com/results?search_query=%s",
    title: "Youtube",
    parentFolderId: "a3495269-0a4d-4866-a519-bca75ed1c246",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "409aba7d-c49e-5e81-b8a6-a862f2651b3e",
    revision: 0,
    iconUrl:
      "https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.netflix.com/search?q=%s",
    title: "Netflix",
    parentFolderId: "a3495269-0a4d-4866-a519-bca75ed1c246",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "54f3e785-960a-5a70-9c80-cfbf0357c4c7",
    revision: 0,
    iconUrl: "https://s.pinimg.com/webapp/favicon-22eb868c.png",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://www.pinterest.com/search/pins/?q=%s",
    title: "Pinterest",
    parentFolderId: "a3495269-0a4d-4866-a519-bca75ed1c246",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "125fdc5e-a97d-5f81-92c4-2a6cbfc3662f",
    revision: 0,
    iconUrl:
      "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: "https://drive.google.com/drive/search?q=%s",
    title: "Drive",
    parentFolderId: "01710cf1-ec8b-497f-8d1f-9cb716567bc4",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: "d509db9f-c67b-49ff-b8bb-cc690dde9bb3",
    revision: 0,
    title: "Page Summary",
    iconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt: "Please summarize the content of the following page.\n{{Url}}",
      openMode: OPEN_MODE.POPUP,
    },
    parentFolderId: "0f2167ab-2e1b-4972-954c-71eec058ab14",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "24b6c6ec-611a-475f-bd38-a66b2c63e940",
    revision: 0,
    title: "YouTube Summary",
    iconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt:
        "Please summarize the content of the following YouTube video.\n{{Url}}",
      openMode: OPEN_MODE.POPUP,
    },
    parentFolderId: "0f2167ab-2e1b-4972-954c-71eec058ab14",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "8002e7e4-93c1-4309-a27b-ac609fa8c938",
    revision: 0,
    title: "Translation",
    iconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt:
        "Please translate the following text between English and the detected language.\n{{SelectedText}}",
      openMode: OPEN_MODE.POPUP,
    },
    parentFolderId: "0f2167ab-2e1b-4972-954c-71eec058ab14",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: "28c07577-ca62-42e5-8673-3f512fd7233e",
    revision: 0,
    title: "Gemini",
    iconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt: "Please explain the following.\n{{SelectedText}}",
      openMode: OPEN_MODE.POPUP,
    },
    parentFolderId: "0f2167ab-2e1b-4972-954c-71eec058ab14",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
] as Command[]

// Folder IDs from the default settings
const FOLDER_SEARCH = "222d6489-4eca-48fd-8590-fceb30545bab"
const FOLDER_ACTION = "0f2167ab-2e1b-4972-954c-71eec058ab14"
const FOLDER_MEDIA = "a3495269-0a4d-4866-a519-bca75ed1c246"
const FOLDER_WORK = "01710cf1-ec8b-497f-8d1f-9cb716567bc4"

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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "以下について解説してください。\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请解释以下内容。\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "다음에 대해 설명해 주세요.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Пожалуйста, объясните следующее.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Bitte erkläre Folgendes.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Veuillez expliquer ce qui suit.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Por favor, explica lo siguiente.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Por favor, explique o seguinte.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "कृपया निम्नलिखित के बारे में बताएं।\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Tolong jelaskan hal berikut.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Sila terangkan perkara berikut.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Si prega di spiegare quanto segue.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ---- AI Prompt: Page Summary commands ----

const CMD_PAGE_SUMMARY_JA = {
  id: "8dae343a-7168-5fe1-81aa-53c00671ba80",
  revision: 0,
  title: "ページの概要生成",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "以下のURLのページを日本語で要約してください。\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_ZH = {
  id: "0b36cf0a-b9d6-5604-9532-e85302514c16",
  revision: 0,
  title: "页面摘要",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请用中文总结以下网页的内容。\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_KO = {
  id: "1acc8a29-59a8-5d22-8d3f-932acef5f333",
  revision: 0,
  title: "페이지 요약",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "다음 URL의 페이지 내용을 한국어로 요약해 주세요.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_RU = {
  id: "026ae75a-d24c-5d51-bf56-e1a9ce3e6132",
  revision: 0,
  title: "Краткое содержание страницы",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Пожалуйста, кратко изложите содержание следующей страницы на русском языке.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_DE = {
  id: "7d3c36fd-d697-5996-9834-f677014ba365",
  revision: 0,
  title: "Seitenzusammenfassung",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Bitte fasse den Inhalt der folgenden Seite auf Deutsch zusammen.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_FR = {
  id: "9d7c49c8-b9bb-580b-8a19-37d3d1eac2bf",
  revision: 0,
  title: "Résumé de la page",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Veuillez résumer le contenu de la page suivante en français.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_ES = {
  id: "9a0879c6-e21c-5da2-ac44-02580607560f",
  revision: 0,
  title: "Resumen de página",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resume el contenido de la siguiente página en español.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_PT = {
  id: "1b07e1bd-b73c-59c7-ae15-c4281b3f7f86",
  revision: 0,
  title: "Resumo da página",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resuma o conteúdo da seguinte página em português.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_HI = {
  id: "6943a6bb-0061-5f86-98b9-65b73cabc0b8",
  revision: 0,
  title: "पृष्ठ सारांश",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "कृपया निम्नलिखित पृष्ठ की सामग्री को हिंदी में सारांशित करें।\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_ID = {
  id: "33381921-4f31-5884-9364-598b5fa03285",
  revision: 0,
  title: "Ringkasan halaman",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Tolong ringkas konten halaman berikut dalam bahasa Indonesia.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_MS = {
  id: "a1773db0-4c0a-5568-8962-69272e08751b",
  revision: 0,
  title: "Ringkasan halaman",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Sila ringkaskan kandungan halaman berikut dalam Bahasa Melayu.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_PAGE_SUMMARY_IT = {
  id: "a69cbdc4-44bc-586c-8802-0b65eb1e53d2",
  revision: 0,
  title: "Riepilogo pagina",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Si prega di riassumere il contenuto della pagina seguente in italiano.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ---- AI Prompt: YouTube Summary commands ----

const CMD_YOUTUBE_SUMMARY_JA = {
  id: "2e3ac565-1e4f-5eb3-a9b8-9ed35afec16e",
  revision: 0,
  title: "YouTubeの概要生成",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "以下のYouTube動画の内容を日本語で要約してください。\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_ZH = {
  id: "c3493b59-14f8-5d48-9045-6453ab6842db",
  revision: 0,
  title: "YouTube摘要",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请用中文总结以下YouTube视频的内容。\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_KO = {
  id: "9d5e2285-f85c-525f-b0f2-ff6b250d0c66",
  revision: 0,
  title: "YouTube 요약",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "다음 YouTube 동영상의 내용을 한국어로 요약해 주세요.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_RU = {
  id: "e0f2cd1a-d783-5a8a-8f73-1593a270b201",
  revision: 0,
  title: "Краткое содержание YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Пожалуйста, кратко изложите содержание следующего видео на YouTube на русском языке.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_DE = {
  id: "340d9418-6e4b-5924-aa5c-c464bdfe0f00",
  revision: 0,
  title: "YouTube-Zusammenfassung",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Bitte fasse den Inhalt des folgenden YouTube-Videos auf Deutsch zusammen.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_FR = {
  id: "aced5600-b0f5-5cdf-a6e8-22dd0990933b",
  revision: 0,
  title: "Résumé YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Veuillez résumer le contenu de la vidéo YouTube suivante en français.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_ES = {
  id: "fe8d2de7-d5cf-5401-9a84-8f7b94fe0dc7",
  revision: 0,
  title: "Resumen de YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resume el contenido del siguiente video de YouTube en español.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_PT = {
  id: "508dcbd2-4d9d-5b76-99b7-3c8f22c669e8",
  revision: 0,
  title: "Resumo do YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, resuma o conteúdo do seguinte vídeo do YouTube em português.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_HI = {
  id: "eb15fea0-5bfe-5a79-b87d-527debadd2c8",
  revision: 0,
  title: "YouTube सारांश",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "कृपया निम्नलिखित YouTube वीडियो की सामग्री को हिंदी में सारांशित करें।\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_ID = {
  id: "c45929d2-3a91-5dcc-84b2-a0fe51ec5ff9",
  revision: 0,
  title: "Ringkasan YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Tolong ringkas konten video YouTube berikut dalam bahasa Indonesia.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_MS = {
  id: "fa412165-8dfc-5f79-b5d8-6ce5b3a4c5f8",
  revision: 0,
  title: "Ringkasan YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Sila ringkaskan kandungan video YouTube berikut dalam Bahasa Melayu.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_YOUTUBE_SUMMARY_IT = {
  id: "f89c080f-0ed5-5f12-a555-e94e0bf7572f",
  revision: 0,
  title: "Riepilogo YouTube",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Si prega di riassumere il contenuto del seguente video di YouTube in italiano.\n{{Url}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

// ---- AI Prompt: Translation commands ----

const CMD_TRANSLATE_JA = {
  id: "c6dd7dcc-b342-517e-aed0-36a74fd007a2",
  revision: 0,
  title: "選択テキストの相互翻訳",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "以下のテキストを日本語と英語の間で翻訳してください。\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_ZH = {
  id: "c6f1cfe2-b982-5941-b62e-743b859c0cea",
  revision: 0,
  title: "文本互译",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "请将以下文本在中英文之间进行互译。\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_KO = {
  id: "ec4abe19-5ba3-569c-8df1-3735fbd2f086",
  revision: 0,
  title: "텍스트 번역",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "다음 텍스트를 한국어와 영어 사이에서 번역해 주세요.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_RU = {
  id: "5973d8a1-3634-5e4e-8979-2c684efa3baf",
  revision: 0,
  title: "Перевод текста",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Пожалуйста, переведите следующий текст между русским и английским языками.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_DE = {
  id: "cd834add-0189-5ee1-88d0-48e4968439c9",
  revision: 0,
  title: "Textübersetzung",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Bitte übersetze den folgenden Text zwischen Deutsch und Englisch.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_FR = {
  id: "75162ab2-5868-590c-bf75-d91a492352fc",
  revision: 0,
  title: "Traduction de texte",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Veuillez traduire le texte suivant entre le français et l'anglais.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_ES = {
  id: "141e9098-a8d0-5d8f-8e76-9da22e43af31",
  revision: 0,
  title: "Traducción de texto",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, traduce el siguiente texto entre español e inglés.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_PT = {
  id: "99b00ce3-8856-58a8-9892-86193280f9ca",
  revision: 0,
  title: "Tradução de texto",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Por favor, traduza o seguinte texto entre português e inglês.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_HI = {
  id: "27dfe2d4-0645-5e67-b3d3-075b00fba514",
  revision: 0,
  title: "पाठ अनुवाद",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "कृपया निम्नलिखित पाठ को हिंदी और अंग्रेजी के बीच अनुवाद करें।\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_ID = {
  id: "ff811237-adce-55be-b7d8-76ae00f2ffe4",
  revision: 0,
  title: "Terjemahan teks",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Tolong terjemahkan teks berikut antara bahasa Indonesia dan bahasa Inggris.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_MS = {
  id: "55978ac1-2bfc-5b06-8a95-73055b534dc5",
  revision: 0,
  title: "Terjemahan teks",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Sila terjemahkan teks berikut antara Bahasa Melayu dan Bahasa Inggeris.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
}

const CMD_TRANSLATE_IT = {
  id: "42840fa4-17e8-5b02-8319-c5f081179a93",
  revision: 0,
  title: "Traduzione testo",
  iconUrl:
    "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt:
      "Si prega di tradurre il seguente testo tra italiano e inglese.\n{{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
  parentFolderId: FOLDER_ACTION,
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
    CMD_GEMINI_JA,
    CMD_PAGE_SUMMARY_JA,
    CMD_YOUTUBE_SUMMARY_JA,
    CMD_TRANSLATE_JA,
    CMD_YOUTUBE,
    CMD_NETFLIX,
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
