import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { t } from "@/services/i18n"
import { Settings } from "@/services/settings/settings"
import { cn } from "@/lib/utils"
import css from "./PromptHistoryBanner.module.css"

const PROMPT_HISTORY_URL =
  "https://ujiro99.github.io/prompt-history/?utm_source=selection-command&utm_medium=extension&utm_campaign=banner-announcement"

export function PromptHistoryBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkVisibility = async () => {
      try {
        const settings = await Settings.get()
        const dismissed = settings.hasDismissedPromptHistoryBanner ?? false
        setIsVisible(!dismissed)
      } catch (error) {
        // If settings retrieval fails, don't show the banner
        console.error("Failed to load banner settings:", error)
        setIsVisible(false)
      }
    }
    checkVisibility()
  }, [])

  const handleDismiss = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await Settings.update("hasDismissedPromptHistoryBanner", () => true)
      setIsVisible(false)
    } catch (error) {
      // If settings update fails, log the error but keep the banner visible
      console.error("Failed to save banner dismissal:", error)
    }
  }

  if (!isVisible) return null

  return (
    <a
      href={PROMPT_HISTORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-5 right-5 z-1000 p-5 max-w-[300px]",
        "bg-white dark:bg-gray-900 shadow-2xl rounded-lg",
        "cursor-pointer transition-all duration-300 ease-in-out",
        "no-underline text-inherit",
        "hover:-translate-y-0.5 hover:shadow-xl",
        css.fadeIn,
      )}
    >
      <button
        className={cn(
          "absolute top-2 right-2 p-1 rounded-full",
          "bg-transparent border-none cursor-pointer",
          "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-hover",
          "transition-colors z-1001",
          "focus:outline-2 focus:outline-blue-500 focus:outline-offset-2",
        )}
        onClick={handleDismiss}
        aria-label="Close banner"
        type="button"
      >
        <X size={16} />
      </button>
      <img
        src="/PromptHistory.png"
        alt="Prompt History"
        className="w-full h-auto rounded-lg mb-3"
      />
      <p className="font-mono text-gray-800 dark:text-gray-200 text-sm leading-relaxed m-0">
        {t("prompthistory_banner_description")}
      </p>
    </a>
  )
}
