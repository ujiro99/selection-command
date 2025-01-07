import { SORT_ORDER } from '@/const'

export default {
  errorPage: {
    error: 'A transmission error has occurred.',
    afterShortTime: 'Please contact us after a while.',
  },
  commandShare: {
    title: 'Command Share',
    formTitle: 'Command Share Form',
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
