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
        "bg-gradient-to-r from-purple-50 to-blue-50",
        "border-purple-200 hover:border-purple-300",
        "hover:from-purple-100 hover:to-blue-100",
        "text-purple-700 hover:text-purple-800",
        "transition-all duration-200",
        disabled && "opacity-50 cursor-not-allowed",
        compact && "[&_svg]:mr-[0]",
        !compact && "min-w-[80px]",
        className,
      )}
    >
      <Sparkles size={14} className="text-purple-600" />
      {!compact && <span>{t("searchUrlAssist")}</span>}
    </Button>
  )
}
