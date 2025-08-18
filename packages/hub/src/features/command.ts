import Commands from "@/data/commands.json"
import Analytics from "@/data/analytics.json"
import { OPEN_MODE, SPACE_ENCODING } from "@/const"
import {
  Command,
  SelectionCommand,
  SearchCommand,
  PageActionCommand,
} from "@/types"
import {
  generateUUIDFromObject,
  isSearchCommand,
  isPageActionCommand,
} from "@/lib/utils"

export function cmd2text(cmd: Command): string {
  if (isSearchCommand(cmd)) {
    const searchCmd = cmd as SearchCommand & { download: number; star: number }
    return JSON.stringify({
      id: searchCmd.id,
      title: searchCmd.title,
      searchUrl: searchCmd.searchUrl,
      iconUrl: searchCmd.iconUrl,
      openMode: searchCmd.openMode,
      openModeSecondary: searchCmd.openModeSecondary,
      spaceEncoding: searchCmd.spaceEncoding,
    })
  } else if (isPageActionCommand(cmd)) {
    const pageActionCmd = cmd as PageActionCommand & {
      download: number
      star: number
    }
    return JSON.stringify({
      id: pageActionCmd.id,
      title: pageActionCmd.title,
      iconUrl: pageActionCmd.iconUrl,
      openMode: pageActionCmd.openMode,
      pageActionOption: pageActionCmd.pageActionOption,
    })
  } else {
    throw new Error("Invalid command")
  }
}

type CommandContent = Omit<
  SelectionCommand,
  "id" | "tags" | "addedAt" | "description"
>

export function cmd2uuid(cmd: CommandContent): string {
  if (isSearchCommand(cmd)) {
    const searchCmd = cmd as Omit<
      SearchCommand,
      "id" | "tags" | "addedAt" | "description"
    >
    return generateUUIDFromObject({
      title: searchCmd.title,
      searchUrl: searchCmd.searchUrl,
      iconUrl: searchCmd.iconUrl,
      openMode: searchCmd.openMode,
      openModeSecondary: searchCmd.openModeSecondary,
      spaceEncoding: searchCmd.spaceEncoding,
    })
  } else if (isPageActionCommand(cmd)) {
    const pageActionCmd = cmd as Omit<
      PageActionCommand,
      "id" | "tags" | "addedAt" | "description"
    >
    return generateUUIDFromObject({
      title: pageActionCmd.title,
      iconUrl: pageActionCmd.iconUrl,
      openMode: pageActionCmd.openMode,
      pageActionOption: pageActionCmd.pageActionOption,
    })
  } else {
    throw new Error("Invalid command")
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
  return Commands.filter((cmd) => cmd.openMode !== OPEN_MODE.PAGE_ACTION).map(
    (cmd) =>
      (cmd as unknown as SearchCommand & { download: number; star: number })
        .searchUrl,
  )
}
