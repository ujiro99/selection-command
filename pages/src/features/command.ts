import Commands from '@/data/commands.json'
import Analytics from '@/data/analytics.json'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import { Command, SelectionCommand } from '@/types'
import { generateUUIDFromObject } from '@/lib/utils'

export function cmd2text(cmd: Command): string {
  return JSON.stringify({
    id: cmd.id,
    title: cmd.title,
    searchUrl: cmd.searchUrl,
    iconUrl: cmd.iconUrl,
    openMode: cmd.openMode,
    openModeSecondary: cmd.openModeSecondary,
    spaceEncoding: cmd.spaceEncoding,
  })
}

type CommandContent = Omit<
  SelectionCommand,
  'id' | 'tags' | 'addedAt' | 'description'
>

export function cmd2uuid(cmd: CommandContent): string {
  return generateUUIDFromObject({
    title: cmd.title,
    searchUrl: cmd.searchUrl,
    iconUrl: cmd.iconUrl,
    openMode: cmd.openMode,
    openModeSecondary: cmd.openModeSecondary,
    spaceEncoding: cmd.spaceEncoding,
  })
}

const emptyData = {
  eventName: 'command_hub_add',
  eventId: '',
  eventCount: 0,
}

const emptyDataStar = {
  eventName: 'command_hub_star',
  eventId: '',
  eventCount: 0,
}

export function getCommands(): Command[] {
  return Commands.map((command) => {
    const dl = Analytics.find((a) => a.eventId === command.id) ?? emptyData
    const tags = command.tags.map((t) => ({
      id: generateUUIDFromObject({ name: t }),
      name: t,
    }))
    return {
      ...command,
      openMode: command.openMode as OPEN_MODE,
      openModeSecondary: command.openModeSecondary as OPEN_MODE,
      spaceEncoding: command.spaceEncoding as SPACE_ENCODING,
      tags,
      download: dl.eventCount.toLocaleString(),
      star: dl.eventCount.toLocaleString(),
    }
  })
}
