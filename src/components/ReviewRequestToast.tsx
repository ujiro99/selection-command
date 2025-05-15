import { t } from '@/services/i18n'
import { ToastAction } from "@/components/ui/toast"

const REVIEW_URL = 'https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/reviews'
const ICON_URL = chrome.runtime.getURL('icon128.png')

export function showReviewRequestToast(toast: any, onAccept: () => void): void {
  const tst = toast({
    title: (
      <p className='flex flex-row gap-2 items-center'>
        <img src={ICON_URL} className='w-6 h-6' />
        <span className='text-base font-semibold text-gray-800'>
          {t("review_request_title")}
        </span>
      </p>
    ),
    description: <span className='text-sm'>
      {t("review_request_message")}
    </span>,
    className: 'flex flex-col text-gray-800',
    action: <div className='w-full flex flex-row gap-3 px-4 pt-3 pb-2'>
      <ToastAction key="later" altText="Later"
        className='flex-1 h-9'
        onClick={() => {
          // Close the toast
          tst.dismiss()
        }}
      >{t("review_request_later")}</ToastAction>
      <ToastAction key="review" altText="Write a review"
        className='flex-1 h-9 transition hover:bg-sky-100'
        onClick={() => {
          window.open(REVIEW_URL, '_blank')
          onAccept()
        }}
      ><span className='mr-1'>🎉</span> {t("review_request_button")}</ToastAction>
    </div>,
    duration: 60 * 1000,
  })
} 