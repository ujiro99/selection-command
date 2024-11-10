import { OPEN_MODE, OPTION_FOLDER } from '@/const'
import { t } from '@/services/i18n'

export const OptionSettings = {
  folder: {
    id: OPTION_FOLDER,
    title: 'Option',
    iconUrl:
      'https://cdn0.iconfinder.com/data/icons/evericons-24px-vol-1/24/more-vertical-1024.png',
    onlyIcon: true,
  },
  commands: [
    {
      id: '$$option-1',
      title: t('labelOption'),
      searchUrl: '',
      iconUrl:
        'https://cdn4.iconfinder.com/data/icons/music-ui-solid-24px/24/settings-3-1024.png',
      openMode: OPEN_MODE.OPTION,
      parentFolderId: OPTION_FOLDER,
    },
    {
      id: '$$option-2',
      title: t('labelAddPageRule'),
      searchUrl: '',
      iconUrl:
        'https://cdn1.iconfinder.com/data/icons/freeline/32/add_cross_new_plus_create-512.png',
      openMode: OPEN_MODE.ADD_PAGE_RULE,
      parentFolderId: OPTION_FOLDER,
    },
  ],
}
