import { Search, Code, Play, Link, Copy, Paintbrush } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog"

import {
  COMMAND_CATEGORY,
  COMMAND_CATEGORY_METADATA,
  COMMAND_CATEGORY_GROUPS,
} from "@/const"
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
} as const

interface CommandTypeSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (category: COMMAND_CATEGORY) => void
}

export const CommandTypeSelectionDialog = ({
  open,
  onOpenChange,
  onSelect,
}: CommandTypeSelectionDialogProps) => {
  const handleCardClick = (category: COMMAND_CATEGORY) => {
    onSelect(category)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("commandType_title")}</DialogTitle>
            <DialogDescription>
              {t("commandType_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {COMMAND_CATEGORY_GROUPS.map((group) => (
              <div key={group.titleKey}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t(group.titleKey)}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {group.categories.map((category) => {
                    const metadata = COMMAND_CATEGORY_METADATA[category]
                    const IconComponent =
                      IconMap[metadata.iconName as keyof typeof IconMap]

                    return (
                      <button
                        key={category}
                        type="button"
                        className={cn(
                          "group px-4 py-2 border rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left",
                          "hover:bg-gray-50",
                        )}
                        onClick={() => handleCardClick(category)}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <div className="p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                            <IconComponent
                              size={20}
                              className="text-gray-600 group-hover:text-gray-700"
                            />
                          </div>
                          <div className="text-center">
                            <h4 className="text-base font-semibold text-gray-900 mb-1">
                              {t(metadata.titleKey)}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-3">
                              {t(metadata.descKey)}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
