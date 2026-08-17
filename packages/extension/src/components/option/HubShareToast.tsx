import { toast } from "sonner"
import { Share } from "lucide-react"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { SCREEN } from "@/const"
import { shareCommandToHub } from "@/services/hubShare"
import type { SelectionCommand } from "@/types"

// Delay before showing the toast so it doesn't overlap the dialog's close animation.
const SHOW_DELAY_MS = 2000

/**
 * Shows a one-time toast on the options page suggesting the user share a
 * newly created command to the Selection Command Hub. `onShown` is invoked
 * whenever the toast is dismissed — by clicking either button, or via the
 * auto-close timeout — so callers can persist a "don't show again" flag as
 * soon as the toast has been presented.
 */
export function showHubShareToast(
  command: SelectionCommand,
  onShown: () => void,
): void {
  setTimeout(() => {
    showHubShareToastNow(command, onShown)
  }, SHOW_DELAY_MS)
}

function showHubShareToastNow(
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-5 py-4 text-gray-800">
        <div className="flex flex-col gap-2 items-start mb-4">
          <img
            src="/SelectionCommandHub_new.png"
            alt="Selection Command Hub"
            width="260"
            className="pointer-events-none select-none"
          />
          <span className="text-base">{t("hub_share_toast_message")}</span>
        </div>
        <div className="flex flex-row gap-3">
          <button
            className="flex-1 h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium transition hover:bg-gray-50"
            onClick={() => {
              toast.dismiss(toastId)
              onShown()
            }}
          >
            {t("hub_share_toast_later")}
          </button>
          <button
            className={cn(
              "flex items-center justify-center gap-2 flex-1 h-9 px-3 rounded-lg transition",
              "text-base text-white border border-sky-600 bg-sky-500 hover:bg-sky-600 font-medium hover:scale-105",
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
            <Share className="inline" size={16} />
            {t("hub_share_toast_button")}
          </button>
        </div>
      </div>
    ),
    {
      duration: 60 * 1000,
      onAutoClose: () => {
        onShown()
      },
    },
  )
}
