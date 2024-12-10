import { v5 as uuidv5 } from 'uuid'
import { createHash } from 'crypto'
import { Commands } from '@/data/commands'
import Analytics from '@/data/analytics.json'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import { Command } from '@/types'

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

export function getCommands(): Command[] {
  return Commands.map((command) => {
    const a = Analytics.downloads.find((a) => a.id === command.id) ?? {
      download: 0,
    }
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
      download: a.download.toLocaleString(),
    }
  })
}

function generateUUIDFromObject(obj: object): string {
  const objString = JSON.stringify(obj)
  const hash = createHash('sha1').update(objString).digest('hex')
  // UUIDv5 from https://ujiro99.github.io/selection-command/
  const namespace = 'fe352db3-6a8e-5d07-9aaf-c45a2e9d9f5c'
  return uuidv5(hash, namespace)
}
