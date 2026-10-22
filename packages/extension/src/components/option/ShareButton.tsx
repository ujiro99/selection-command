import { useState, useRef } from "react"
import { CloudCheck, CloudUpload } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { cn, isUUIDv7, generateId } from "@/lib/utils"
import { t } from "@/services/i18n"
import {
  shareCommandToHub,
  getHubLocale,
  isHubShareable,
  isHubRegistered,
  pushEditToHub,
} from "@/services/hubShare"
import {
  sendEvent,
  sendHubLinkClick,
  ANALYTICS_EVENTS,
  HUB_LINK_ROUTE,
} from "@/services/analytics"
import { NEW_HUB_URL, SCREEN } from "@/const"
import type { SelectionCommand } from "@/types"
import { TEST_IDS } from "@/testIds"

type Props = {
  command: SelectionCommand
  onCommandIdChange?: (newId: string) => void
  isShared?: boolean
  // Shared command with local edits not yet pushed to the Hub
  isModified?: boolean
}

export const ShareButton = ({
  command,
  onCommandIdChange,
  isShared,
  isModified,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">(
    "idle",
  )

  const shareState: "unshared" | "shared" | "modified" = !isShared
    ? "unshared"
    : isModified
      ? "modified"
      : "shared"

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (shareState === "modified") {
      // Push the local edits to the Hub. The mark clears once the Hub
      // acknowledges and the new content hash is saved.
      const ok = pushEditToHub(command)
      setStatus(ok ? "sent" : "error")
      setTimeout(() => setStatus("idle"), 2000)
      return
    }

    if (shareState === "shared") {
      // Open the hub dashboard page for the shared command
      const locale = getHubLocale()
      const url = `${NEW_HUB_URL}/${locale}/dashboard/mycommands?id=${encodeURIComponent(command.id)}`
      chrome.tabs.create({ url })
      sendHubLinkClick(HUB_LINK_ROUTE.SHARE_BUTTON)
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
    // sign-up page instead (see shareCommandToHub in services/hub/serviceWorker.ts);
    // nothing is actually shared yet, so leave the button idle and skip
    // the share analytics event for this case.
    const registered = await isHubRegistered()
    if (!registered) {
      // The sign-up tab is opened by the service worker, so its opening is
      // not confirmed here: this counts the intent to go to the Hub (the
      // share request was dispatched), not a verified navigation.
      sendHubLinkClick(HUB_LINK_ROUTE.SHARE_BUTTON)
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

  const iconClassName = cn(
    "stroke-gray-500",
    shareState === "modified"
      ? "group-hover/share-btn:stroke-orange-600"
      : "group-hover/share-btn:stroke-green-600",
    status === "error" && "stroke-red-500",
  )

  const { testId, tooltip } = {
    unshared: {
      testId: TEST_IDS.shareCommandButton,
      tooltip: t("Option_shareButton_tooltip"),
    },
    shared: {
      testId: TEST_IDS.sharedCommandButton,
      tooltip: t("Option_shareButton_shared_tooltip"),
    },
    modified: {
      testId: TEST_IDS.modifiedSharedCommandButton,
      tooltip: t("Option_shareButton_modified_tooltip"),
    },
  }[shareState]

  return (
    <>
      <button
        type="button"
        disabled={status !== "idle"}
        className={cn(
          "outline-gray-200 p-2 rounded-md transition hover:bg-green-100 hover:scale-125 group/share-btn",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          shareState === "modified" && "bg-orange-50 hover:bg-orange-100",
        )}
        onClick={handleClick}
        ref={buttonRef}
        aria-label={tooltip}
        data-testid={testId}
      >
        {shareState === "unshared" && (
          <CloudUpload className={iconClassName} size={16} />
        )}
        {shareState === "shared" && (
          <CloudCheck className={iconClassName} size={16} />
        )}
        {shareState === "modified" && (
          <span className="relative block">
            <CloudUpload className={iconClassName} size={16} />
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-orange-500"
            />
          </span>
        )}
      </button>
      <Tooltip positionElm={buttonRef.current} text={tooltip} />
    </>
  )
}
