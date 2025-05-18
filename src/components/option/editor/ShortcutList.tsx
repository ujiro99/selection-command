import { useEffect, useState } from 'react'
import { Control, useFieldArray, useWatch } from 'react-hook-form'
import { Keyboard, SquareArrowOutUpRight } from 'lucide-react'

import { SelectField } from '@/components/option/field/SelectField'
import { t as _t } from '@/services/i18n'
import { Ipc, BgCommand } from '@/services/ipc'
import type { Command, CommandFolder, ShortcutCommand } from '@/types'
import { SHORTCUT_PLACEHOLDER } from '@/const'

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type ShortcutListProps = {
  control: Control<any>
}

type SelectOptionType = {
  name: string
  value: string
  iconUrl?: string
}

type SelectGroupType = {
  label: string
  options: SelectOptionType[]
  iconUrl?: string
  iconSvg?: string
}

// Group commands by folder while maintaining order
const groupCommandsByFolder = (
  commands: Command[],
  folders: CommandFolder[],
): (SelectOptionType | SelectGroupType)[] => {
  const folderMap = new Map(folders.map((folder) => [folder.id, folder]))

  // Create a map to store commands by folder
  const commandsByFolder = new Map<string, Command[]>()
  commandsByFolder.set('root', [])

  // First, group commands by folder
  commands.forEach((command) => {
    const folderId = command.parentFolderId || 'root'
    if (!commandsByFolder.has(folderId)) {
      commandsByFolder.set(folderId, [])
    }
    commandsByFolder.get(folderId)?.push(command)
  })

  // Then, create the final array maintaining the original order
  const result: (SelectOptionType | SelectGroupType)[] = []

  commands.forEach((command) => {
    const folderId = command.parentFolderId || 'root'
    const folderCommands = commandsByFolder.get(folderId)

    if (!folderCommands) return

    if (folderId === 'root') {
      // For root commands, add them individually
      result.push({
        name: command.title,
        value: command.id,
        iconUrl: command.iconUrl,
      })
    } else {
      // For folder commands, add them as a group if not already added
      const folder = folderMap.get(folderId)
      if (
        folder &&
        !result.some((item) => 'label' in item && item.label === folder.title)
      ) {
        result.push({
          label: folder.title,
          iconUrl: folder.iconUrl,
          iconSvg: folder.iconSvg,
          options: folderCommands.map((cmd: Command) => ({
            name: cmd.title,
            value: cmd.id,
            iconUrl: cmd.iconUrl,
          })),
        })
      }
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
    name: 'shortcuts.shortcuts',
  })
  const userCommands = useWatch({
    control,
    name: 'commands',
    defaultValue: [],
  })
  const folders = useWatch({
    control,
    name: 'folders',
    defaultValue: [],
  })

  useEffect(() => {
    chrome.commands.getAll((cmds) => {
      const filteredCommands = cmds.filter((cmd) => cmd.description !== '')
      setCommands(filteredCommands)

      // Initialize the shortcuts
      const initialData = filteredCommands.map((cmd) => ({
        commandId: cmd.name || '',
        targetCommandId: SHORTCUT_PLACEHOLDER,
      }))
      replace(initialData)
    })
  }, [replace])

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Keyboard size={22} className="mr-2 stroke-gray-600" />
        <h3 className="text-xl font-semibold">{t('shortcuts')}</h3>
      </div>
      <p className="text-base">
        {t('shortcuts_desc')}
        <br />
        <span className="text-sm">
          {t('shortcuts_settings_desc')}{' '}
          <button
            type="button"
            onClick={() => Ipc.send(BgCommand.openShortcuts)}
            className="text-blue-600 hover:underline h-4"
          >
            <SquareArrowOutUpRight
              size={14}
              className="inline-block mr-1 mb-0.5"
            />
            {t('shortcuts_settings_link')}
          </button>
        </span>
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const cmd = commands[index]
          if (!cmd) return null

          const groupedOptions = [
            {
              name: t('shortcut_select_placeholder'),
              value: SHORTCUT_PLACEHOLDER,
            },
            ...groupCommandsByFolder(userCommands, folders),
          ]

          return (
            <SelectField
              key={field.id}
              control={control}
              name={`shortcuts.shortcuts.${index}.targetCommandId`}
              formLabel={`${cmd.description} (${cmd.shortcut || t('shortcut_not_set')})`}
              options={groupedOptions}
            />
          )
        })}
      </div>
    </div>
  )
}
