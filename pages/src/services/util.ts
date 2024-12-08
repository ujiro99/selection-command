import { Commands } from '@/data/commands'
import Analytics from '@/data/analytics.json'
import { randomBytes } from 'crypto'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import { Command } from '@/types'

function generateUUID() {
  const randomData = randomBytes(16)
  const hexData = randomData.toString('hex')
  return `${hexData.slice(0, 8)}-${hexData.slice(8, 12)}-${hexData.slice(12, 16)}-${hexData.slice(16, 20)}-${hexData.slice(20, 32)}`
}

export function cmd2text(cmd: Command): string {
  return JSON.stringify({
    title: cmd.title,
    searchUrl: cmd.searchUrl,
    iconUrl: cmd.iconUrl,
    openMode: cmd.openMode,
    openModeSecondary: cmd.openModeSecondary,
    spaceEncoding: cmd.spaceEncoding,
  })
}

export function getCommands(): Command[] {
  return Commands.map((command) => {
    const a = Analytics.downloads.find((a) => a.id === command.id) ?? {
      download: 0,
    }
    const tags = command.tags.map((t) => ({
      id: generateUUID(),
      name: t,
    }))
    return {
      ...command,
      openMode: command.openMode as OPEN_MODE,
      openModeSecondary: command.openModeSecondary as OPEN_MODE,
      spaceEncoding: command.spaceEncoding as SPACE_ENCODING,
      tags,
      download: a.download.toLocaleString(),
    }
  })
}
