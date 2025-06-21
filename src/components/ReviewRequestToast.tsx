import { toast } from 'sonner'
import { t } from '@/services/i18n'
import { cn } from '@/lib/utils'
import { PartyPopper } from 'lucide-react'

const REVIEW_URL =
  'https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/reviews'
const ICON_URL = chrome.runtime.getURL('icon128.png')

export function showReviewRequestToast(onAccept: () => void): void {
  toast.custom(
    (toastId) => (
      <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-gray-800">
        <div className="flex flex-row gap-3 items-center mb-2">
          <img src={ICON_URL} className="w-7 h-7" />
          <span className="text-base font-semibold">
            {t('review_request_title')}
          </span>
        </div>
        <div className="text-sm mb-4">{t('review_request_message')}</div>
        <div className="flex flex-row gap-3">
          <button
            className="flex-1 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium transition hover:bg-gray-50"
            onClick={() => {
              toast.dismiss(toastId)
            }}
          >
            {t('review_request_later')}
          </button>
          <button
            className={cn(
              'flex items-center justify-center flex-1 h-9 px-3 rounded-md transition',
              'text-sm text-gray-600 font-medium border border-sky-300 bg-sky-200 hover:bg-sky-400',
            )}
            onClick={() => {
              window.open(REVIEW_URL, '_blank')
              onAccept()
              toast.dismiss(toastId)
            }}
          >
            <PartyPopper className="mr-2 inline" size={17} />
            {t('review_request_button')}
          </button>
        </div>
      </div>
    ),
    {
      duration: 60 * 1000,
    },
  )
}
