import { SORT_ORDER, OPEN_MODE } from '@/const'

export default {
  name: 'English',
  shorName: 'en',
  languageName: 'English',
  errorPage: {
    error: 'A transmission error has occurred.',
    afterShortTime: 'Please contact us after a while.',
  },
  commandShare: {
    title: 'Command Share',
    formTitle: 'Command Share Form',
  },
  inputForm: {
    title: {
      label: 'Title',
      description: 'Displayed as the title of the command.',
      message: {
        min3: 'The title must be at least 3 characters long.',
        max100: 'The title must be at most 100 characters long.',
      },
    },
    searchUrl: {
      label: 'Search URL',
      description: 'Replace `%s` with the selected text.',
      message: {
        url: 'URL format is incorrect.',
        unique: 'Already registered.',
      },
    },
    description: {
      label: 'Description',
      description: 'Displayed as the description of the command.',
      message: {
        max200: 'Description must be at most 200 characters long.',
      },
    },
    tags: {
      label: 'Tags',
      description: 'Displayed as the classification of the command.',
      message: {
        max20: 'Tags must be at most 20 characters long.',
        max5: 'Up to 5 tags can be registered.',
      },
    },
    iconUrl: {
      label: 'Icon URL',
      description: 'Displayed as the icon of the menu.',
      message: {
        url: 'URL format is incorrect.',
      },
    },
    openMode: {
      label: 'OpenMode',
      description: 'How the result is displayed.',
      options: {
        [OPEN_MODE.POPUP]: 'Popup',
        [OPEN_MODE.WINDOW]: 'Window',
        [OPEN_MODE.TAB]: 'Tab',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + Click',
      description: 'How the result is displayed when Ctrl + Clicked.',
    },
    spaceEncoding: {
      label: 'Space Encoding',
      description: 'Replace spaces in selected text.',
      options: {
        plus: 'Plus(+)',
        percent: 'Percent(%20)',
      },
    },
    formDescription: 'Apply for command sharing.',
    formOptions: 'Options',
    confirm: 'Confirm',
  },
  confirmForm: {
    formDescription: 'Is the following content correct?',
    caution:
      'The submitted information will be published on this site.\nPlease refrain from sharing personal or confidential information.',
    back: 'Back',
    submit: 'Share',
  },
  completeForm: {
    formDescription: 'Submission completed.',
    thanks:
      'Thank you for sharing the command!\nIt may take 2-3 days for the developer to reflect it on the site.\nPlease wait patiently until it is published.',
    aboudDelete:
      'If you wish to delete after applying, please access the link below.',
    supportHub: 'Support Hub',
  },
  errorForm: {
    formDescription: 'A transmission error has occurred.',
    message:
      'Please try again later or contact the developer from the link below.',
    supportHub: 'Support Hub',
  },
  notFound: {
    title: 'Page not found',
    message:
      'The page you tried to access does not exist.\nPlease check the URL.',
  },
  about: {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookie: 'Cookie Policy',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: 'Search URL',
    [SORT_ORDER.title]: 'Title',
    [SORT_ORDER.download]: 'Download Count',
    [SORT_ORDER.star]: 'Star Count',
    [SORT_ORDER.addedAt]: 'Added Date',
    new: 'New',
    old: 'Old',
  },
}
