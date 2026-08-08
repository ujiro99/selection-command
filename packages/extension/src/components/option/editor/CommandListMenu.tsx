import React from "react"
import { Button } from "@/components/ui/button"
import { Plus, FolderPlus } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { t as _t } from "@/services/i18n"
import { TEST_IDS } from "@/testIds"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

interface Props {
  onAddCommand: () => void
  onAddFolder: () => void
  addCommandButtonRef: React.RefObject<HTMLButtonElement>
  addFolderButtonRef: React.RefObject<HTMLButtonElement>
  commandCount: number
}

export const CommandListMenu: React.FC<Props> = ({
  onAddCommand,
  onAddFolder,
  addCommandButtonRef,
  addFolderButtonRef,
  commandCount,
}) => {
  return (
    <div className="relative h-10 flex items-end justify-between pr-2">
      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono tracking-tight">
        {commandCount ?? 0}
        {t("commands_desc_count")}
      </span>
      <div className="inline-flex items-center gap-3">
        <Button
          type="button"
          ref={addFolderButtonRef}
          variant="outline"
          className="px-3 gap-0.5 rounded-md transition hover:bg-gray-100 hover:scale-[110%] group font-mono"
          onClick={onAddFolder}
          data-testid={TEST_IDS.addFolderButton}
        >
          <FolderPlus />
          {t("folders")}
        </Button>
        <Tooltip
          positionElm={addFolderButtonRef.current}
          text={t("folders_tooltip")}
        />
        <Button
          type="button"
          ref={addCommandButtonRef}
          variant="outline"
          className="px-3 gap-0.5 rounded-md transition hover:bg-gray-100 hover:scale-[110%] group font-mono"
          onClick={onAddCommand}
          data-testid={TEST_IDS.addCommandButton}
        >
          <Plus className="stroke-gray-600 group-hover:stroke-gray-700" />
          {t("Command")}
        </Button>
        <Tooltip
          positionElm={addCommandButtonRef.current}
          text={t("Command_tooltip")}
        />
      </div>
    </div>
  )
}
