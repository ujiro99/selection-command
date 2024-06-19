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
  ],
}
