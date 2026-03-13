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
  id: "8f1dd05d-8bfc-508c-977b-e1e741811551",
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
  id: "0ce8e887-e464-545b-923e-3f03181e3841",
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
  id: "e5f4cd16-3d09-5872-abfb-748d3ee44d4d",
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
  id: "55cbdee1-8b93-555a-9b6e-664583e47749",
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
  id: "9ffb5af5-3f25-58b3-a5bb-4a1981f670f2",
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
  id: "365a54c6-0324-57be-84e5-ab56a3a7d1f0",
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
  id: "28514807-91d0-5b78-9c6e-6f66d28480de",
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
  id: "6a262b63-9fe3-5b84-8677-7dfc7a6149f8",
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
  id: "8657cbce-7041-59ee-99bd-0059d7725773",
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
  id: "0d095a4d-dc48-53d4-b6dc-ba2d65d3ec46",
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
  id: "f698f5d8-445a-5425-b147-52ae5d612253",
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
  id: "f024b680-b534-5b4a-9544-19c03bf9ea1b",
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
  id: "b6c74d17-9f37-5cd8-89a8-e2a83db6fa46",
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
  id: "10aacba2-936f-5512-a5ea-7d2fc55fb897",
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
  id: "2c3d8dab-4d2f-5a48-a475-c5633d53e104",
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
  id: "d49c2724-8ee4-5cf3-9966-12ef7542275a",
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
  id: "f52fc864-fd82-5d0b-b014-00cc111f7978",
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
      CMD_EBAY_IT,
      CMD_ZALANDO_IT,
      CMD_GEMINI_IT,
      CMD_YOUTUBE,
      CMD_NETFLIX,
      CMD_DRIVE,
    ] as Command[]
  }

  // Default: English / global
  return DefaultCommands
}
