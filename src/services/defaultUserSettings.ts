import { UserSettingsType, Command } from '@/types'
import {
  VERSION,
  OPEN_MODE,
  DRAG_OPEN_MODE,
  STARTUP_METHOD,
  STYLE,
} from '@/const'
import DefaultSchema from '@/services/userSettingSchema'

export default {
  settingVersion: VERSION,
  commands: [],
  linkCommand: {
    threshold: 150,
    showIndicator: true,
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
} as UserSettingsType

export const DefaultCommands = [
  {
    id: '$$drag-1',
    title: 'Link Preview',
    searchUrl: '',
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    popupOption: {
      width: DefaultSchema.definitions.popupOption.properties.width.default,
      height: DefaultSchema.definitions.popupOption.properties.height.default,
    },
    linkCommandOption: {
      threshold: 150,
      showIndicator: true,
    },
  },
  {
    id: 0,
    iconUrl: 'https://www.google.com/favicon.ico',
    openMode: OPEN_MODE.POPUP,
    searchUrl: 'https://google.com/search?q=%s',
    title: 'Google',
    popupOption: {
      width: DefaultSchema.definitions.popupOption.properties.width.default,
      height: DefaultSchema.definitions.popupOption.properties.height.default,
    },
  },
  {
    id: 1,
    iconUrl: 'https://www.google.com/favicon.ico',
    openMode: OPEN_MODE.POPUP,
    searchUrl: 'https://google.com/search?q=%s&tbm=isch',
    title: 'Google Image',
    parentFolderId: '222d6489-4eca-48fd-8590-fceb30545bab',
    popupOption: {
      width: DefaultSchema.definitions.popupOption.properties.width.default,
      height: DefaultSchema.definitions.popupOption.properties.height.default,
    },
  },
  {
    id: 2,
    iconUrl: 'https://www.amazon.com/favicon.ico',
    openMode: OPEN_MODE.TAB,
    searchUrl: 'https://www.amazon.com/s?k=%s',
    title: 'Amazon',
    parentFolderId: '222d6489-4eca-48fd-8590-fceb30545bab',
  },
  {
    id: 3,
    iconUrl: 'https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png',
    openMode: OPEN_MODE.TAB,
    searchUrl: 'https://www.youtube.com/results?search_query=%s',
    title: 'Youtube',
    parentFolderId: 'a3495269-0a4d-4866-a519-bca75ed1c246',
  },
  {
    id: 4,
    iconUrl:
      'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico',
    openMode: OPEN_MODE.TAB,
    searchUrl: 'https://www.netflix.com/search?q=%s',
    title: 'Netflix',
    parentFolderId: 'a3495269-0a4d-4866-a519-bca75ed1c246',
  },
  {
    id: 5,
    iconUrl: 'https://s.pinimg.com/webapp/favicon-22eb868c.png',
    openMode: OPEN_MODE.TAB,
    searchUrl: 'https://www.pinterest.com/search/pins/?q=%s',
    title: 'Pinterest',
    parentFolderId: 'a3495269-0a4d-4866-a519-bca75ed1c246',
  },
  {
    id: 6,
    iconUrl:
      'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png',
    openMode: OPEN_MODE.TAB,
    searchUrl: 'https://drive.google.com/drive/search?q=%s',
    title: 'Drive',
    parentFolderId: '01710cf1-ec8b-497f-8d1f-9cb716567bc4',
  },
  {
    id: 7,
    iconUrl: 'https://ssl.gstatic.com/translate/favicon.ico',
    openMode: OPEN_MODE.TAB,
    searchUrl:
      'https://translate.google.co.jp/?hl=ja&sl=auto&text=%s&op=translate',
    title: 'en to ja',
    parentFolderId: '01710cf1-ec8b-497f-8d1f-9cb716567bc4',
  },
] as Command[]
