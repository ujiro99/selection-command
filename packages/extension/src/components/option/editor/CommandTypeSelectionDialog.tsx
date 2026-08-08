import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { NEW_HUB_URL } from "@/const"
import { useHubUser } from "@/hooks/option/useHubUser"
import { getHubLocale } from "@/services/hubShare"
import { UTM_SOURCE, UTM_MEDIUM, withUtmParams } from "@shared"
const UTM_PARAMS = { source: UTM_SOURCE.OPTION_PAGE, medium: UTM_MEDIUM.BUTTON }

import { CommandType } from "./CommandType"

import { COMMAND_TYPE, COMMAND_TYPE_GROUPS } from "@/const"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

interface CommandTypeSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (type: COMMAND_TYPE) => void
}

export const CommandTypeSelectionDialog = ({
  open,
  onOpenChange,
  onSelect,
}: CommandTypeSelectionDialogProps) => {
  const hubUser = useHubUser()
  const locale = getHubLocale()
  const hubButtonLink = withUtmParams(
    hubUser
      ? `${NEW_HUB_URL}/${locale}/dashboard/commands`
      : `${NEW_HUB_URL}/${locale}`,
    UTM_PARAMS,
  )

  const handleCardClick = (type: COMMAND_TYPE) => {
    onSelect(type)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-between">
            <DialogHeader className="relative">
              <DialogTitle>{t("commandType_title")}</DialogTitle>
              <DialogDescription>
                {t("commandType_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="shrink-0">
              <a
                href={hubButtonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg border px-3 pt-2 pb-1 hover:shadow-md transition"
              >
                <span className="text-sm inline-flex items-center gap-1">
                  <Search className="inline size-4" />
                  {t("commandType_hubLink")}
                </span>
                <img
                  src="/SelectionCommandHub_new.png"
                  alt="Selection Command Hub"
                  width="200"
                />
              </a>
            </div>
          </div>
          <div className="space-y-6 py-4">
            {COMMAND_TYPE_GROUPS.map((group) => (
              <div key={group.titleKey}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t(group.titleKey)}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {group.types.map((type) => (
                    <CommandType
                      key={type}
                      type={type}
                      onClick={handleCardClick}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="absolute bottom-6 right-6">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="lg">
                {t("labelCancel")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
