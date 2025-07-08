import React from "react"
import { Button } from "@/components/ui/button"
import { Terminal, FolderPlus, Search } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { HUB_URL } from "@/const"
import { t as _t } from "@/services/i18n"
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
    <div className="relative h-10 flex items-end">
      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono tracking-tight">
        {commandCount ?? 0}
        {t("commands_desc_count")}
      </span>
      <Button
        type="button"
        ref={addFolderButtonRef}
        variant="outline"
        className="absolute left-[255px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
        onClick={onAddFolder}
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
        className="absolute left-[360px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
        onClick={onAddCommand}
      >
        <Terminal className="stroke-gray-600 group-hover:stroke-gray-700" />
        {t("Command")}
      </Button>
      <Tooltip
        positionElm={addCommandButtonRef.current}
        text={t("Command_tooltip")}
      />
      <Button
        variant="outline"
        className="absolute right-0 translate-x-[-5%] pl-2 pr-2.5 w-32 rounded-md transition hover:bg-gray-100 hover:scale-[110%] group"
        asChild
      >
        <a
          href={`${HUB_URL}/?utm_source=optionPage&utm_medium=button`}
          target="_blank"
          className="font-mono text-gray-600 hover:text-gray-700"
        >
          <Search />
          <span className="font-semibold">Command</span>
          <span className="font-thin">Hub</span>
        </a>
      </Button>
    </div>
  )
}
