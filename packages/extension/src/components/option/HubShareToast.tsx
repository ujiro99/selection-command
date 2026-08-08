import { toast } from "sonner"
import { Share } from "lucide-react"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { SCREEN } from "@/const"
import { shareCommandToHub } from "@/services/hubShare"
import type { SelectionCommand } from "@/types"

/**
 * Shows a one-time toast on the options page suggesting the user share a
 * newly created command to the Selection Command Hub. `onShown` is invoked
 * regardless of which button is clicked, so callers can persist a
 * "don't show again" flag as soon as the toast has been presented.
 */
export function showHubShareToast(
  command: SelectionCommand,
  onShown: () => void,
): void {
  sendEvent(
    ANALYTICS_EVENTS.OPEN_DIALOG,
    {
      event_label: "hub_share_toast",
    },
    SCREEN.OPTION,
  )

  toast.custom(
    (toastId) => (
      <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-gray-800">
        <div className="flex flex-row gap-3 items-center mb-4">
          <Share className="stroke-sky-500 shrink-0" size={20} />
          <span className="text-sm">{t("hub_share_toast_message")}</span>
        </div>
        <div className="flex flex-row gap-3">
          <button
            className="flex-1 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium transition hover:bg-gray-50"
            onClick={() => {
              toast.dismiss(toastId)
              onShown()
            }}
          >
            {t("hub_share_toast_later")}
          </button>
          <button
            className={cn(
              "flex items-center justify-center gap-2 flex-1 h-9 px-3 rounded-md transition",
              "text-sm text-white border border-sky-500 bg-sky-400 hover:bg-sky-500 font-medium hover:scale-110",
            )}
            onClick={() => {
              shareCommandToHub(command)
              sendEvent(
                ANALYTICS_EVENTS.COMMAND_SHARE,
                {
                  event_label: "hub-share-toast",
                },
                SCREEN.OPTION,
              )
              toast.dismiss(toastId)
              onShown()
            }}
          >
            {t("hub_share_toast_button")}
            <Share className="inline" size={16} />
          </button>
        </div>
      </div>
    ),
    {
      duration: 60 * 1000,
    },
  )
}
