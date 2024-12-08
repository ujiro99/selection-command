import { Commands } from '@/data/commands'
import { randomBytes } from 'crypto'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import { Command } from '@/types'

function generateUUID() {
  const randomData = randomBytes(16)
  const hexData = randomData.toString('hex')
  return `${hexData.slice(0, 8)}-${hexData.slice(8, 12)}-${hexData.slice(12, 16)}-${hexData.slice(16, 20)}-${hexData.slice(20, 32)}`
}

export function getCommands(): Command[] {
  return Commands.map((command) => {
    const tags = command.tags.map((t) => ({
      id: generateUUID(),
      name: t,
    }))
    return {
      ...command,
      id: generateUUID(),
      openMode: command.openMode as OPEN_MODE,
      openModeSecondary: command.openModeSecondary as OPEN_MODE,
      spaceEncoding: command.spaceEncoding as SPACE_ENCODING,
      tags,
    }
  })
}
