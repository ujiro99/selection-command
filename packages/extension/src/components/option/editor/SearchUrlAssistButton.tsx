import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type SearchUrlAssistButtonProps = {
  onClick: () => void
  disabled?: boolean
  className?: string
  compact?: boolean
}

export const SearchUrlAssistButton = ({
  onClick,
  disabled = false,
  className,
  compact = false,
}: SearchUrlAssistButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-2 gap-0.5 text-xs font-medium",
        "bg-linear-to-r from-purple-50 to-blue-50",
        "dark:from-purple-950/40 dark:to-blue-900/40",
        "border-purple-200 hover:border-purple-300",
        "dark:border-purple-800/80 dark:hover:border-purple-700",
        "hover:from-purple-100 hover:to-blue-100",
        "dark:hover:from-purple-900/60 dark:hover:to-blue-900/60",
        "text-purple-700 hover:text-purple-800",
        "dark:text-purple-300 dark:hover:text-purple-200",
        "transition-all duration-200",
        disabled && "opacity-50 cursor-not-allowed",
        compact && "[&_svg]:mr-0",
        !compact && "min-w-20",
        className,
      )}
    >
      <Sparkles size={14} className="text-purple-600 dark:text-purple-300" />
      {!compact && <span>{t("searchUrlAssist")}</span>}
    </Button>
  )
}
