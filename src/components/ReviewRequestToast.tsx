import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/services/i18n'

const REVIEW_URL = 'https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/reviews'

export function showReviewRequestToast(onClose: () => void): void {
  toast.custom(
    (id) => (
      <div className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <Star className="w-6 h-6 text-yellow-400 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {t('review_request_title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {t('review_request_message')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                chrome.tabs.create({ url: REVIEW_URL })
                toast.dismiss(id)
                onClose()
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {t('review_request_button')}
            </button>
            <button
              onClick={() => {
                toast.dismiss(id)
                onClose()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {t('review_request_close')}
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: 'bottom-right',
    }
  )
} 