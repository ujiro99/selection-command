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
    id: "e2001b8a-a20c-5d33-983b-bf6c6d55a63c",
    revision: 0,
    title: "Gemini - 日本語",
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
            value: "以下について解説してください。\n{{SelectedText}}",
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
    id: "6c6d45d6-735b-43bd-b4c8-5dc5104c23ed",
    revision: 0,
    iconUrl: "https://ssl.gstatic.com/translate/favicon.ico",
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl:
      "https://translate.google.co.jp/?hl=ja&sl=auto&text=%s&op=translate",
    title: "en to ja",
    parentFolderId: "01710cf1-ec8b-497f-8d1f-9cb716567bc4",
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
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
  searchUrl: "",
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
  id: "18998bac-4e6c-503f-b3ea-b9198edef7c3",
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
  id: "e2001b8a-a20c-5d33-983b-bf6c6d55a63c",
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
  id: "2e0cd6fe-a232-402e-846c-2104f0639995",
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
  id: "409aba7d-c49e-5e81-b8a6-a862f2651b3e",
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
  id: "125fdc5e-a97d-5f81-92c4-2a6cbfc3662f",
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
  id: "6c6d45d6-735b-43bd-b4c8-5dc5104c23ed",
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
  id: "3f2b4d5e-6a7c-4b8d-9e0f-1a2b3c4d5e6f",
  revision: 0,
  iconUrl: "https://s.yimg.jp/images/top/sp2/cmn/logo-170307.png",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://search.yahoo.co.jp/search?p=%s",
  title: "Yahoo! Japan",
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_AMAZON_JP = {
  id: "7f6b8d9e-0a1c-4b2d-3e4f-5a6b7c8d9e0f",
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
  id: "6c5e7a8b-9d0f-4e1a-2b3c-4d5e6f7a8b9c",
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
  id: "7d6f8b9c-0e1a-4f2b-3c4d-5e6f7a8b9c0d",
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
  id: "8e7a9c0d-1f2b-4a3c-4d5e-6f7a8b9c0d1e",
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
  id: "9f8b0d1e-2a3c-4b4d-5e6f-7a8b9c0d1e2f",
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
  id: "a1b2c3d4-e5f6-4789-8abc-def012345601",
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
  id: "0a9c1e2f-3b4d-4c5e-6f7a-8b9c0d1e2f3a",
  revision: 0,
  iconUrl: "https://www.naver.com/favicon.ico",
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://search.naver.com/search.naver?query=%s",
  title: "네이버",
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_COUPANG = {
  id: "1b0d2f3a-4c5e-4d6f-7a8b-9c0d1e2f3a4b",
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
  id: "b2c3d4e5-f6a7-4890-9bcd-ef0123456702",
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
  id: "2c1e3a4b-5d6f-4e7a-8b9c-0d1e2f3a4b5c",
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
  id: "3d2f4b5c-6e7a-4f8b-9c0d-1e2f3a4b5c6d",
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
  id: "4e3a5c6d-7f8b-4a9c-0d1e-2f3a4b5c6d7e",
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
  id: "c3d4e5f6-a7b8-4901-abcd-f01234567803",
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
  id: "5e4a6c7d-8f9b-4b0c-1d2e-3f4a5b6c7d8e",
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
  id: "a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d",
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
  id: "6a5c7e8f-9b0d-4c1e-2f3a-4b5c6d7e8f9a",
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
  id: "d4e5f6a7-b8c9-4012-bcde-012345678904",
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
  id: "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e",
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
  id: "8c7e9a0b-1d2f-4e3a-4b5c-6d7e8f9a0b1c",
  revision: 0,
  iconUrl: "https://www.leboncoin.fr/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.leboncoin.fr/recherche?text=%s",
  title: "leboncoin",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_FR = {
  id: "e5f6a7b8-c9d0-4123-cdef-123456789005",
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
  id: "c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f",
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
  id: "9d8f0b1c-2e3a-4f4b-5c6d-7e8f9a0b1c2d",
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
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  revision: 0,
  iconUrl: "https://www.elcorteingles.es/favicon.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.elcorteingles.es/search-nwx/?s=%s",
  title: "El Corte Inglés",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_ALIEXPRESS_ES = {
  id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  revision: 0,
  iconUrl: "https://ae01.alicdn.com/images/eng/nn/favicon/aliexpress_v3.ico",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://ja.aliexpress.com/w/wholesale-%s.html",
  title: "AliExpress",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.DASH,
}

const CMD_GEMINI_ES = {
  id: "f6a7b8c9-d0e1-4234-def0-234567890106",
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
  id: "d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a",
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
  id: "0e9a1c2d-3f4b-4a5c-6d7e-8f9a0b1c2d3e",
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
  id: "a7b8c9d0-e1f2-4345-ef01-345678901207",
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
  id: "b8c9d0e1-f2a3-4456-f012-456789012308",
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
  id: "e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b",
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
  id: "2a1c3e4f-5b6d-4c7e-8f9a-0b1c2d3e4f5a",
  revision: 0,
  iconUrl:
    "https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/favicon-144px.png",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.flipkart.com/search?q=%s",
  title: "Flipkart",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_HI = {
  id: "c9d0e1f2-a3b4-4567-0123-567890123409",
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
  id: "3b2d4f5a-6c7e-4d8f-9a0b-1c2d3e4f5a6b",
  revision: 0,
  iconUrl:
    "https://images.tokopedia.net/img/cache/215-square/GAnVPX/2021/11/16/2fdf5dc5-abe5-454e-b8ec-bdf4e96d5c60.png",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.tokopedia.com/search?st=product&q=%s",
  title: "Tokopedia",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_SHOPEE_ID = {
  id: "4c3e5a6b-7d8f-4e9a-0b1c-2d3e4f5a6b7c",
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
  id: "d0e1f2a3-b4c5-4678-1234-67890123450a",
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
  id: "5d4f6b7c-8e9a-4f0b-1c2d-3e4f5a6b7c8d",
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
  id: "6e5a7c8d-9f0b-4a1c-2d3e-4f5a6b7c8d9e",
  revision: 0,
  iconUrl:
    "https://lzd-img-global.slatic.net/g/tps/tfs/TB1uGoZXkT2gK0jSZFkXXcIQFXa-114-114.png",
  openMode: OPEN_MODE.TAB,
  openModeSecondary: OPEN_MODE.TAB,
  searchUrl: "https://www.lazada.com.my/catalog/?q=%s",
  title: "Lazada",
  parentFolderId: FOLDER_SEARCH,
  popupOption: { width: PopupOption.width, height: PopupOption.height },
  spaceEncoding: SPACE_ENCODING.PLUS,
}

const CMD_GEMINI_MS = {
  id: "e1f2a3b4-c5d6-4789-2345-78901234560b",
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
  id: "f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c",
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

const CMD_GEMINI_IT = {
  id: "f2a3b4c5-d6e7-4890-3456-89012345670c",
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

/**
 * Returns locale-appropriate default commands.
 * Falls back to global English defaults for unknown locales.
 *
 * @param locale - BCP 47 locale string (e.g. "ja", "zh-CN", "pt-BR").
 *                 Typically obtained via chrome.i18n.getUILanguage().
 */
export function getDefaultCommands(locale?: string): Command[] {
  const lang = (locale ?? "").toLowerCase().replace("_", "-")

  // ja: Japan
  if (lang.startsWith("ja")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_JP,
      CMD_YAHOO_JAPAN,
      CMD_GEMINI_JA,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
      CMD_EN_TO_JA,
    ] as Command[]
  }

  // zh: China (Simplified/Traditional)
  if (lang.startsWith("zh")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_BAIDU,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_JD,
      CMD_GEMINI_ZH,
      CMD_BILIBILI,
      CMD_DRIVE,
      CMD_ZHIHU,
    ] as Command[]
  }

  // ko: Korea
  if (lang.startsWith("ko")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_NAVER,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_COUPANG,
      CMD_GEMINI_KO,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // ru: Russia
  if (lang.startsWith("ru")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_YANDEX,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_OZON,
      CMD_WILDBERRIES,
      CMD_GEMINI_RU,
      CMD_YOUTUBE,
      CMD_VK,
      CMD_DRIVE,
    ] as Command[]
  }

  // de: Germany
  if (lang.startsWith("de")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_DE,
      CMD_EBAY_DE,
      CMD_GEMINI_DE,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // fr: France
  if (lang.startsWith("fr")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_FR,
      CMD_LEBONCOIN,
      CMD_GEMINI_FR,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // es: Spanish-speaking
  if (lang.startsWith("es")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_ES,
      CMD_EBAY_ES,
      CMD_EL_CORTE_INGLES,
      CMD_ALIEXPRESS_ES,
      CMD_GEMINI_ES,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // pt-BR: Brazil
  if (lang === "pt-br") {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_BR,
      CMD_MERCADO_LIVRE_BR,
      CMD_GEMINI_PT,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // pt: Portugal and other Portuguese-speaking
  if (lang.startsWith("pt")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_ES,
      CMD_OLX_PT,
      CMD_GEMINI_PT,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // hi: India (Hindi)
  if (lang.startsWith("hi")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_IN,
      CMD_FLIPKART,
      CMD_GEMINI_HI,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // id: Indonesia
  if (lang.startsWith("id")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_TOKOPEDIA,
      CMD_SHOPEE_ID,
      CMD_GEMINI_ID,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // ms: Malaysia
  if (lang.startsWith("ms")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_SHOPEE_MY,
      CMD_LAZADA_MY,
      CMD_GEMINI_MS,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // it: Italy
  if (lang.startsWith("it")) {
    return [
      CMD_LINK_PREVIEW,
      CMD_GOOGLE,
      CMD_GOOGLE_IMAGE,
      CMD_AMAZON_IT,
      CMD_GEMINI_IT,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // Default: English / global
  return DefaultCommands
}
