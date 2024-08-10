import { OPEN_MODE } from '@/const'
import { t } from '@/services/i18n'

export const OptionItem = {
  folder: {
    id: 'option',
    title: 'Option',
    iconUrl:
      'https://cdn0.iconfinder.com/data/icons/evericons-24px-vol-1/24/more-vertical-1024.png',
    onlyIcon: true,
  },
  commands: [
    {
      id: 1,
      title: t('labelOption'),
      searchUrl: '',
      iconUrl:
        'https://cdn4.iconfinder.com/data/icons/music-ui-solid-24px/24/settings-3-1024.png',
      openMode: OPEN_MODE.OPTION,
    },
    {
      id: 2,
      title: t('labelAddPageRule'),
      searchUrl: '',
      iconUrl:
        'https://cdn1.iconfinder.com/data/icons/freeline/32/add_cross_new_plus_create-512.png',
      openMode: OPEN_MODE.ADD_PAGE_RULE,
    },
  ],
}
