import Commands from '@/data/commands.json'
import Analytics from '@/data/analytics.json'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import { Command, SelectionCommand } from '@/types'
import {
  generateUUIDFromObject,
  isSearchCommand,
  isPageActionCommand,
} from '@/lib/utils'

export function cmd2text(cmd: Command): string {
  if (isSearchCommand(cmd)) {
    return JSON.stringify({
      id: cmd.id,
      title: cmd.title,
      searchUrl: cmd.searchUrl,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      openModeSecondary: cmd.openModeSecondary,
      spaceEncoding: cmd.spaceEncoding,
    })
  } else if (isPageActionCommand(cmd)) {
    return JSON.stringify({
      id: cmd.id,
      title: cmd.title,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      pageActionOption: cmd.pageActionOption,
    })
  } else {
    throw new Error('Invalid command')
  }
}

type CommandContent = Omit<
  SelectionCommand,
  'id' | 'tags' | 'addedAt' | 'description'
>

export function cmd2uuid(cmd: CommandContent): string {
  if (isSearchCommand(cmd)) {
    return generateUUIDFromObject({
      title: cmd.title,
      searchUrl: cmd.searchUrl,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      openModeSecondary: cmd.openModeSecondary,
      spaceEncoding: cmd.spaceEncoding,
    })
  } else if (isPageActionCommand(cmd)) {
    return generateUUIDFromObject({
      title: cmd.title,
      iconUrl: cmd.iconUrl,
      openMode: cmd.openMode,
      pageActionOption: cmd.pageActionOption,
    })
  } else {
    throw new Error('Invalid command')
  }
}

const emptyData = {
  eventCount: 0,
}

export function getCommands(): Command[] {
  return Commands.map((command) => {
    const dl =
      Analytics.download.find((a) => a.eventId === command.id) ?? emptyData
    const star =
      Analytics.starred.find((a) => a.eventId === command.id) ?? emptyData
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
      download: dl.eventCount,
      star: star.eventCount,
    }
  }) as Command[]
}

export function getSearchUrl(): string[] {
  return Commands.filter((cmd) => isSearchCommand(cmd)).map(
    (cmd) => cmd.searchUrl,
  )
}
