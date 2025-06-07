import { SORT_ORDER, OPEN_MODE } from '@/const'
import { UNINSTALL_OTHER_OPTION } from '@/const'

const lang = {
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
  tagPicker: {
    notFound: 'Not found',
    create: 'Create?',
  },
  inputForm: {
    title: {
      label: 'Title',
      description: 'Displayed as the title of the command.',
      placeholder: 'Title of command',
      message: {
        min3: 'The title must be at least 3 characters long.',
        max100: 'The title must be at most 100 characters long.',
      },
    },
    searchUrl: {
      label: 'Search URL',
      description: 'Replace `%s` with the selected text.',
      placeholder: 'Search URL',
      faviconAlt: "Search url's favicon",
      message: {
        url: 'URL format is incorrect.',
        unique: 'Already registered.',
      },
    },
    description: {
      label: 'Description',
      description: 'Displayed as the description of the command.',
      placeholder: 'Command description',
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
      placeholder: 'Icon URL',
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
        [OPEN_MODE.PAGE_ACTION]: 'PageAction',
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
    pageAction: {
      label: 'Page Action',
      description: 'Actions to be performed.',
    },
    PageActionOption: {
      startUrl: {
        label: 'Start Page URL',
        description: 'URL to start the page action.',
        faviconAlt: "Start url's favicon",
      },
    },
  },
  confirmForm: {
    formDescription: 'Is the following content correct?',
    caution:
      'The submitted information will be published on this site.\nPlease refrain from sharing personal or confidential information.',
    back: 'Back',
    submit: 'Share',
  },
  SendingForm: {
    sending: 'Sending...',
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
  sortOrder: {
    [SORT_ORDER.searchUrl]: 'Search URL',
    [SORT_ORDER.title]: 'Title',
    [SORT_ORDER.download]: 'Download Count',
    [SORT_ORDER.star]: 'Star Count',
    [SORT_ORDER.addedAt]: 'Added Date',
    new: 'New',
    old: 'Old',
  },
  about: {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookie: 'Cookie Policy',
  },
  cookieConsent: {
    title: 'We use cookies',
    message:
      'We use cookies to ensure you get the best experience on our website. For more information, please see our cookie policy.',
    accept: 'Accept',
    decline: 'Decline',
  },
  uninstallForm: {
    title: 'Uninstallation Complete.',
    description:
      "Thank you for using Selection Command. While we're sad to see you go, we would greatly appreciate your feedback through the survey below to help us improve the extension.",
    reinstall:
      'If you uninstalled by mistake, you can reinstall from the link below.',
    reasonTitle: 'Please tell us why you uninstalled (multiple choice)',
    otherReasonPlaceholder: 'Please specify your reason',
    detailsTitle: 'If possible, please provide more details.',
    detailsPlaceholder:
      "Details about why you uninstalled,\nWhat you wanted to do or what problems you encountered,\nSites where it didn't work, etc.",
    submit: 'Submit',
    submitting: 'Submitting...',
    success: {
      title: 'Survey Submission Complete',
      message:
        'Thank you for your response. We truly appreciate your valuable feedback.\nIf you would like to provide additional feedback directly, please contact us at takeda.yujiro@gmail.com with a clear subject line.',
    },
    error: 'Submission failed. Please try again later.',
    reasons: {
      difficult_to_use: "I didn't know how to use it.",
      not_user_friendly: 'Not user-friendly',
      not_working: "Didn't work as expected",
      missing_features: 'Missing needed features',
      too_many_permissions: 'Required too many permissions',
      found_better: 'Found a better alternative',
      no_longer_needed: 'No longer needed',
      language_not_supported: 'Language not supported',
      [UNINSTALL_OTHER_OPTION]: 'Other',
    },
  },
}
export default lang
