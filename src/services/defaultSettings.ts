import { SettingsType, Command } from '@/types'
import {
  VERSION,
  OPEN_MODE,
  DRAG_OPEN_MODE,
  STARTUP_METHOD,
  STYLE,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  KEYBOARD,
  SPACE_ENCODING,
} from '@/const'

export default {
  settingVersion: VERSION,
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
      title: 'Media',
      iconUrl:
        'https://cdn3.iconfinder.com/data/icons/feather-5/24/play-circle-512.png',
      id: 'a3495269-0a4d-4866-a519-bca75ed1c246',
      onlyIcon: true,
    },
    {
      title: 'Work',
      iconUrl:
        'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png',
      id: '01710cf1-ec8b-497f-8d1f-9cb716567bc4',
    },
  ],
  pageRules: [],
  popupPlacement: 'top-start',
  style: STYLE.HORIZONTAL,
  startupMethod: {
    method: STARTUP_METHOD.TEXT_SELECTION,
  },
  userStyles: [],
  stars: [],
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
    id: 'bbf701ee-6443-49d8-b9c0-3acfa8034c5d',
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
