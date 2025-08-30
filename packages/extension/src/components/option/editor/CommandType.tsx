import { forwardRef } from "react"
import {
  Search,
  Code,
  Play,
  Link,
  Copy,
  Paintbrush,
  EllipsisVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { COMMAND_CATEGORY, COMMAND_CATEGORY_METADATA } from "@/const"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

// Map icon names to actual Lucide React components
const IconMap = {
  Search,
  Code,
  Play,
  Link,
  Copy,
  Paintbrush,
  EllipsisVertical,
} as const

interface CommandTypeProps {
  category: COMMAND_CATEGORY
  onClick: (category: COMMAND_CATEGORY) => void
  compact?: boolean
  disabled?: boolean
}

export const CommandType = forwardRef<HTMLButtonElement, CommandTypeProps>(
  ({ category, onClick, compact, disabled }: CommandTypeProps, ref) => {
    const metadata = COMMAND_CATEGORY_METADATA[category]
    const IconComponent = IconMap[metadata.iconName as keyof typeof IconMap]

    return (
      <button
        key={category}
        type="button"
        className={cn(
          "group px-4 py-2 border rounded-lg transition-all duration-200 text-left",
          !disabled && "hover:bg-gray-50 hover:border-gray-300",
          !compact && "hover:shadow-md",
        )}
        onClick={() => onClick(category)}
        disabled={disabled}
        ref={ref}
      >
        <div
          className={cn(
            "flex items-center ",
            compact ? "min-w-32 flex-row space-x-2" : "flex-col space-y-2",
          )}
        >
          <div
            className={cn(
              "rounded-full bg-gray-100 transition-colors",
              !disabled && "group-hover:bg-gray-200",
              compact ? "p-2" : "p-3",
            )}
          >
            <IconComponent
              size={compact ? 16 : 20}
              className={cn(
                "text-gray-600 ",
                !disabled && "group-hover:text-gray-700",
              )}
            />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-semibold text-gray-900">
              {t(metadata.titleKey)}
            </h4>
            {!compact && (
              <p className="text-xs text-gray-600 line-clamp-3">
                {t(metadata.descKey)}
              </p>
            )}
          </div>
        </div>
      </button>
    )
  },
)
