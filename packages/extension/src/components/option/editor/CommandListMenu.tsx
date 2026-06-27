import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Terminal, FolderPlus, Search } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { NEW_HUB_URL } from "@/const"
import { t as _t } from "@/services/i18n"
import { TEST_IDS } from "@/testIds"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { HubUser } from "@/types"
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
  const [hubUser, setHubUser] = useState<HubUser | null>(null)

  useEffect(() => {
    Storage.get<HubUser | null>(LOCAL_STORAGE_KEY.HUB_USER).then(setHubUser)
    const unsubscribe = Storage.addListener<HubUser | null>(
      LOCAL_STORAGE_KEY.HUB_USER,
      (newVal) => setHubUser(newVal),
    )
    return unsubscribe
  }, [])

  const hubButtonLink = hubUser
    ? `${NEW_HUB_URL}/dashboard/?utm_source=optionPage&utm_medium=button`
    : `${NEW_HUB_URL}?utm_source=optionPage&utm_medium=button`

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
        className="absolute left-[360px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
        onClick={onAddCommand}
        data-testid={TEST_IDS.addCommandButton}
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
          href={hubButtonLink}
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
