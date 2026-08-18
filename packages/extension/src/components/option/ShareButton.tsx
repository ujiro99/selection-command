import { useState, useRef } from "react"
import { Share, CloudCheck } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { cn, isUUIDv7, generateId } from "@/lib/utils"
import { t } from "@/services/i18n"
import {
  shareCommandToHub,
  getHubLocale,
  isHubShareable,
  isHubRegistered,
} from "@/services/hubShare"
import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { NEW_HUB_URL, SCREEN } from "@/const"
import type { SelectionCommand } from "@/types"
import { TEST_IDS } from "@/testIds"

type Props = {
  command: SelectionCommand
  onCommandIdChange?: (newId: string) => void
  isShared?: boolean
}

export const ShareButton = ({
  command,
  onCommandIdChange,
  isShared,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">(
    "idle",
  )

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isShared) {
      // Open the hub dashboard page for the shared command
      const locale = getHubLocale()
      const url = `${NEW_HUB_URL}/${locale}/dashboard/mycommands?id=${encodeURIComponent(command.id)}`
      chrome.tabs.create({ url })
      return
    }

    // Disable the button immediately to prevent duplicate shares/signup
    // tabs from rapid repeated clicks while the lookup below runs.
    setStatus("pending")

    let commandToShare = command
    if (!isUUIDv7(command.id)) {
      const newId = generateId()
      commandToShare = { ...command, id: newId }
      onCommandIdChange?.(newId)
    }

    const ok = shareCommandToHub(commandToShare)

    if (!ok) {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2000)
      return
    }

    // Users who have never signed in to the hub are redirected to the
    // sign-up page instead (see shareCommandToHub in services/hub/background.ts);
    // nothing is actually shared yet, so leave the button idle and skip
    // the share analytics event for this case.
    const registered = await isHubRegistered()
    if (!registered) {
      setStatus("idle")
      return
    }

    setStatus("sent")
    setTimeout(() => setStatus("idle"), 2000)

    sendEvent(
      ANALYTICS_EVENTS.COMMAND_SHARE,
      { event_label: "share-button" },
      SCREEN.OPTION,
    )
  }

  if (!isHubShareable(command)) {
    return null
  }

  return (
    <>
      <button
        type="button"
        disabled={status !== "idle"}
        className={cn(
          "outline-gray-200 p-2 rounded-md transition hover:bg-green-100 hover:scale-125 group/share-btn",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        )}
        onClick={handleClick}
        ref={buttonRef}
        data-testid={
          isShared ? TEST_IDS.sharedCommandButton : TEST_IDS.shareCommandButton
        }
      >
        {!isShared ? (
          <Share
            className={cn(
              "stroke-gray-500 group-hover/share-btn:stroke-green-600",
              status === "error" && "stroke-red-500",
            )}
            size={16}
          />
        ) : (
          <CloudCheck
            className={cn(
              "stroke-gray-500 group-hover/share-btn:stroke-green-600",
              status === "error" && "stroke-red-500",
            )}
            size={16}
          />
        )}
      </button>
      <Tooltip
        positionElm={buttonRef.current}
        text={
          isShared
            ? t("Option_shareButton_shared_tooltip")
            : t("Option_shareButton_tooltip")
        }
      />
    </>
  )
}
