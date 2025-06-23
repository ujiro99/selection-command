import type { Command, CommandFolder, SelectionCommand, PageActionCommand } from '@/types'
import { OPEN_MODE, ROOT_FOLDER } from '@/const'
import { e2a, isEmpty } from '@/lib/utils'

export function isCommand(
  content: Command | CommandFolder | undefined,
): content is SelectionCommand {
  if (content == null) return false
  if ('openMode' in content) {
    return e2a(OPEN_MODE).includes(content.openMode)
  }
  return false
}

export function isPageActionCommand(
  content: Command | CommandFolder | undefined,
): content is PageActionCommand {
  if (content == null) return false
  if ('openMode' in content) {
    return OPEN_MODE.PAGE_ACTION === content.openMode
  }
  return false
}

export function isFolder(
  content: Command | CommandFolder | undefined,
): content is CommandFolder {
  if (content == null) return false
  return !('openMode' in content)
}

export function isInFolder(content: Command | CommandFolder | undefined): boolean {
  if (content == null) return false
  const folderId = content.parentFolderId
  return !isEmpty(folderId) && folderId !== ROOT_FOLDER
}

export function removeUnstoredParam(data: Command): Command {
  delete (data as any)._id
  return data
}

export const getDescendantFolderIds = (
  folderId: string,
  folders: CommandFolder[],
): string[] => {
  const children = folders.filter((f) => f.parentFolderId === folderId)
  let descendants = children.map((f) => f.id)
  for (const child of children) {
    descendants = descendants.concat(getDescendantFolderIds(child.id, folders))
  }
  return descendants
}

export function isCircularReference(
  draggedFolderId: string,
  targetFolderId: string,
  folders: CommandFolder[],
): boolean {
  const descendants = getDescendantFolderIds(draggedFolderId, folders)
  return descendants.includes(targetFolderId)
}