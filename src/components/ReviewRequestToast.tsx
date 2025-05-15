import { Star } from 'lucide-react'
import { t } from '@/services/i18n'
import { ToastAction } from "@/components/ui/toast"


const REVIEW_URL = 'https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/reviews'

export function showReviewRequestToast(toast: any): void {
  toast({
    title: t("review_request_title"),
    description: t("review_request_message"),
    action: <ToastAction altText="Write a review"
      onClick={() => {
        window.open(REVIEW_URL, '_blank')
      }}
    >{t("review_request_button")}</ToastAction>,
    duration: 100 * 1000,
  })

} 