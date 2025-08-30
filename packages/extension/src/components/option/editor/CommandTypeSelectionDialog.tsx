import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog"

import { CommandType } from "./CommandType"

import { COMMAND_CATEGORY, COMMAND_CATEGORY_GROUPS } from "@/const"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

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
                  {group.categories.map((category) => (
                    <CommandType
                      key={category}
                      category={category}
                      onClick={handleCardClick}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
