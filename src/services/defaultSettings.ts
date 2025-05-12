import { SettingsType, Command } from '@/types'
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
} from '@/const'

export const PopupPlacement = {
  side: SIDE.top,
  align: ALIGN.start,
  sideOffset: 0,
  alignOffset: 0,
}

export default {
  settingVersion: VERSION,
  popupPlacement: PopupPlacement,
  commands: [],
  linkCommand: {
    enabled: LINK_COMMAND_ENABLED.ENABLE,
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    showIndicator: true,
    startupMethod: {
      method: LINK_COMMAND_STARTUP_METHOD.KEYBOARD,
      keyboardParam: KEYBOARD.SHIFT,
      threshold: 150,
      leftClickHoldParam: 200,
    },
  },
  folders: [
    {
      title: 'Search',
      iconUrl:
        'https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png',
      id: '222d6489-4eca-48fd-8590-fceb30545bab',
      onlyIcon: true,
    },
    {
      title: 'Action',
      iconUrl: '',
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
      id: '0f2167ab-2e1b-4972-954c-71eec058ab14',
      onlyIcon: true,
    },
    {
      title: 'Media',
      iconUrl: '',
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-play-icon lucide-monitor-play"><path d="M10 7.75a.75.75 0 0 1 1.142-.638l3.664 2.249a.75.75 0 0 1 0 1.278l-3.664 2.25a.75.75 0 0 1-1.142-.64z"/><path d="M12 17v4"/><path d="M8 21h8"/><rect x="2" y="3" width="20" height="14" rx="2"/></svg>',
      id: 'a3495269-0a4d-4866-a519-bca75ed1c246',
      onlyIcon: true,
    },
    {
      title: 'Work',
      iconUrl: '',
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
      id: '01710cf1-ec8b-497f-8d1f-9cb716567bc4',
    },
  ],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  startupMethod: {
    method: STARTUP_METHOD.TEXT_SELECTION,
  },
  userStyles: [
    {
      name: 'padding-scale',
      value: '1.5',
    },
    {
      name: 'image-scale',
      value: '1.1',
    },
    {
      name: 'font-scale',
      value: '1.1',
    },
  ],
  stars: [],
  commandExecutionCount: 0,
} as SettingsType

export const PopupOption = {
  width: 600,
  height: 700,
}

export const DefaultCommands = [
  {
    id: '$$drag-1',
    title: 'Link Preview',
    searchUrl: '',
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: '723ee9f1-150b-54ad-aeac-5fbfd0ae3650',
    iconUrl: 'https://www.google.com/favicon.ico',
    openMode: OPEN_MODE.POPUP,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://google.com/search?q=%s',
    title: 'Google',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: '18998bac-4e6c-503f-b3ea-b9198edef7c3',
    iconUrl: 'https://www.google.com/favicon.ico',
    openMode: OPEN_MODE.POPUP,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://google.com/search?q=%s&tbm=isch',
    title: 'Google Image',
    parentFolderId: '222d6489-4eca-48fd-8590-fceb30545bab',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: '92f8f4e8-3cd8-4e01-9908-811d72448670',
    iconUrl: 'https://www.amazon.com/favicon.ico',
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://www.amazon.com/s?k=%s',
    title: 'Amazon',
    parentFolderId: '222d6489-4eca-48fd-8590-fceb30545bab',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: 'c187228b-844c-50a6-8a9d-147817ca75fe',
    title: 'Gemini',
    iconUrl:
      'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: {
      openMode: OPEN_MODE.POPUP,
      startUrl: 'https://gemini.google.com/app',
      steps: [
        {
          id: '1clkfxbrr',
          param: {
            label: 'Start',
            type: 'start',
          },
        },
        {
          id: 'gmavyqlj2',
          label: 'Ask Gemini',
          param: {
            label: 'Ask Gemini',
            selector: "//*[@data-gramm='false']/*",
            selectorType: 'xpath',
            type: 'input',
            value: 'Please explain the following.\n{{SelectedText}}',
          },
        },
        {
          id: 'umb7r0prx',
          param: {
            label: '',
            selector: "//*[@data-mat-icon-name='send']",
            selectorType: 'xpath',
            type: 'click',
          },
        },
        {
          id: 'stjwk2dnp',
          param: {
            label: 'End',
            type: 'end',
          },
        },
      ],
    },
    parentFolderId: '0f2167ab-2e1b-4972-954c-71eec058ab14',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: '7256d90a-5f40-5d71-b0c7-db403add3bc0',
    title: 'Gemini - 日本語',
    iconUrl:
      'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: {
      openMode: OPEN_MODE.POPUP,
      startUrl: 'https://gemini.google.com/app',
      steps: [
        {
          id: '1clkfxbrr',
          param: {
            label: 'Start',
            type: 'start',
          },
        },
        {
          id: 'gmavyqlj2',
          label: 'Ask Gemini',
          param: {
            label: 'Ask Gemini',
            selector: "//*[@data-gramm='false']/*",
            selectorType: 'xpath',
            type: 'input',
            value: '以下について解説してください。\n{{SelectedText}}',
          },
        },
        {
          id: 'umb7r0prx',
          param: {
            label: '',
            selector: "//*[@data-mat-icon-name='send']",
            selectorType: 'xpath',
            type: 'click',
          },
        },
        {
          id: 'stjwk2dnp',
          param: {
            label: 'End',
            type: 'end',
          },
        },
      ],
    },
    parentFolderId: '0f2167ab-2e1b-4972-954c-71eec058ab14',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
  },
  {
    id: '2e0cd6fe-a232-402e-846c-2104f0639995',
    iconUrl: 'https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png',
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://www.youtube.com/results?search_query=%s',
    title: 'Youtube',
    parentFolderId: 'a3495269-0a4d-4866-a519-bca75ed1c246',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: '409aba7d-c49e-5e81-b8a6-a862f2651b3e',
    iconUrl:
      'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico',
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://www.netflix.com/search?q=%s',
    title: 'Netflix',
    parentFolderId: 'a3495269-0a4d-4866-a519-bca75ed1c246',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: '54f3e785-960a-5a70-9c80-cfbf0357c4c7',
    iconUrl: 'https://s.pinimg.com/webapp/favicon-22eb868c.png',
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://www.pinterest.com/search/pins/?q=%s',
    title: 'Pinterest',
    parentFolderId: 'a3495269-0a4d-4866-a519-bca75ed1c246',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: '125fdc5e-a97d-5f81-92c4-2a6cbfc3662f',
    iconUrl:
      'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png',
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl: 'https://drive.google.com/drive/search?q=%s',
    title: 'Drive',
    parentFolderId: '01710cf1-ec8b-497f-8d1f-9cb716567bc4',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
  {
    id: '6c6d45d6-735b-43bd-b4c8-5dc5104c23ed',
    iconUrl: 'https://ssl.gstatic.com/translate/favicon.ico',
    openMode: OPEN_MODE.TAB,
    openModeSecondary: OPEN_MODE.TAB,
    searchUrl:
      'https://translate.google.co.jp/?hl=ja&sl=auto&text=%s&op=translate',
    title: 'en to ja',
    parentFolderId: '01710cf1-ec8b-497f-8d1f-9cb716567bc4',
    popupOption: {
      width: PopupOption.width,
      height: PopupOption.height,
    },
    spaceEncoding: SPACE_ENCODING.PLUS,
  },
] as Command[]
