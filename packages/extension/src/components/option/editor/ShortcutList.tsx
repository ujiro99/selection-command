import { useEffect, useState, useMemo } from "react"
import { Control, useFieldArray, useWatch } from "react-hook-form"
import { Keyboard, SquareArrowOutUpRight } from "lucide-react"
import { SelectField } from "@/components/option/field/SelectField"
import type { SelectOptionType } from "@/components/option/field/SelectField"
import { t as _t } from "@/services/i18n"
import { Ipc, BgCommand } from "@/services/ipc"
import type { Command, CommandFolder, ShortcutCommand } from "@/types"
import {
  OPEN_MODE_BG,
  SHORTCUT_PLACEHOLDER,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
} from "@/const"
import {
  toCommandTree,
  toFlatten,
  calcLevel,
} from "@/services/option/commandTree"
import { cn } from "@/lib/utils"
import css from "./ShortcutList.module.css"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type ShortcutListProps = {
  control: Control<any>
}

const isTextSelectionOnly = (openMode: string) =>
  !Object.values(OPEN_MODE_BG).includes(openMode as any)

const createNameRender = (openMode: string) => {
  return isTextSelectionOnly(openMode)
    ? (name: string) => (
        <span className="truncate">
          {name}
          <span
            className={cn(
              "absolute right-4 border rounded-lg px-2 py-0.5 text-[10px] text-gray-600 bg-gray-100 whitespace-nowrap",
              css.tag,
            )}
          >
            {t("shortcut_text_selection_only")}
          </span>
        </span>
      )
    : undefined
}

// Create flat list of commands and folders with proper hierarchy levels using toFlatten
const flattenCommandsAndFolders = (
  commands: Command[],
  folders: CommandFolder[],
): SelectOptionType[] => {
  const tree = toCommandTree(commands, folders)
  const flattenedNodes = toFlatten(tree)

  const result: SelectOptionType[] = []

  flattenedNodes.forEach((node) => {
    if ("openMode" in node.content) {
      // This is a command
      const command = node.content as Command
      const level = calcLevel(command, folders)

      result.push({
        name: command.title,
        value: command.id,
        iconUrl: command.iconUrl,
        nameRender: createNameRender(command.openMode),
        level: level,
      })
    } else {
      // This is a folder
      const folder = node.content as CommandFolder
      const level = calcLevel(folder, folders)

      result.push({
        name: folder.title,
        value: folder.id,
        iconUrl: folder.iconUrl,
        iconSvg: folder.iconSvg,
        level: level,
        isGroup: true, // Folders are not selectable
      })
    }
  })

  return result
}

export function ShortcutList({ control }: ShortcutListProps) {
  const [commands, setCommands] = useState<chrome.commands.Command[]>([])
  const { fields, replace } = useFieldArray<{
    shortcuts: { shortcuts: ShortcutCommand[] }
  }>({
    control,
    name: "shortcuts.shortcuts",
  })
  const userCommands = useWatch({
    control,
    name: "commands",
    defaultValue: [],
  })
  const folders = useWatch({
    control,
    name: "folders",
    defaultValue: [],
  })
  const shortcutValues = useWatch({
    control,
    name: "shortcuts.shortcuts",
  })

  const updateCommands = () => {
    chrome.commands.getAll((cmds) => {
      const filteredCommands = cmds.filter((cmd) => cmd.description !== "")
      setCommands(filteredCommands)
    })
  }

  useEffect(() => {
    // Initialize the commands on Chrome setting.
    updateCommands()

    // Update commands when the page becomes visible or focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateCommands()
      }
    }

    const handleFocus = () => {
      updateCommands()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  useEffect(() => {
    // Initialize the shortcuts
    if (fields.length !== 0) return
    const initialData = commands.map((cmd) => ({
      id: cmd.name || "",
      commandId: SHORTCUT_PLACEHOLDER,
      noSelectionBehavior: SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD,
    }))
    replace(initialData)
  }, [replace, commands, userCommands])

  const options = useMemo(
    () => flattenCommandsAndFolders(userCommands, folders),
    [userCommands, folders],
  )

  const noSelectionOptions = [
    {
      name: t("shortcut_no_selection_do_nothing"),
      value: SHORTCUT_NO_SELECTION_BEHAVIOR.DO_NOTHING,
    },
    {
      name: t("shortcut_no_selection_use_clipboard"),
      value: SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Keyboard size={22} className="mr-2 stroke-gray-600" />
        <h3 className="text-xl font-semibold">{t("shortcuts")}</h3>
      </div>
      <p className="text-base">
        {t("shortcuts_desc")}
        <br />
        <span className="text-sm">
          {t("shortcuts_settings_desc")}{" "}
          <button
            type="button"
            onClick={() => Ipc.send(BgCommand.openShortcuts)}
            className="text-blue-600 hover:underline h-4"
          >
            <SquareArrowOutUpRight
              size={14}
              className="inline-block mr-1 mb-0.5"
            />
            {t("shortcuts_settings_link")}
          </button>
        </span>
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const chromeCmd = commands[index]
          if (!chromeCmd) return null

          const opts = [
            {
              name: t("shortcut_select_placeholder"),
              value: SHORTCUT_PLACEHOLDER,
            },
            ...options,
          ]

          const targetId = shortcutValues[index]?.commandId
          const selectedCmd = userCommands.find(
            (c: Command) => c?.id === targetId,
          )
          const showNoSel =
            selectedCmd && !isTextSelectionOnly(selectedCmd.openMode)

          return (
            <div key={field.id} className="space-y-2">
              <SelectField
                control={control}
                name={`shortcuts.shortcuts.${index}.commandId`}
                formLabel={`${chromeCmd.description} (${chromeCmd.shortcut || t("shortcut_not_set")})`}
                options={opts}
              />
              {showNoSel && (
                <SelectField
                  control={control}
                  name={`shortcuts.shortcuts.${index}.noSelectionBehavior`}
                  formLabel={t("shortcut_no_selection_behavior")}
                  options={noSelectionOptions}
                  labelClass="ml-6 font-normal"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
