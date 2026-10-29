import type { Command, CommandFolder } from "@/types"
import { ROOT_FOLDER } from "@/const"
import { isEmpty } from "@/lib/utils"

/**
 * Type guard to check if the content is a CommandFolder
 * @param content - The content to check
 * @returns True if the content is a CommandFolder, false otherwise
 */
export function isFolder(
  content: Command | CommandFolder | undefined,
): content is CommandFolder {
  if (content == null) return false
  return !("openMode" in content)
}

/**
 * Checks if the content is inside a folder (not in the root folder)
 * @param content - The content to check
 * @returns True if the content is in a folder, false otherwise
 */
export function isInFolder(
  content: Command | CommandFolder | undefined,
): boolean {
  if (content == null) return false
  const folderId = content.parentFolderId
  return !isEmpty(folderId) && folderId !== ROOT_FOLDER
}

/**
 * Removes unstored parameters from a command (such as temporary IDs)
 * @param data - The command data to clean
 * @returns The command with unstored parameters removed
 */
export function removeUnstoredParam(data: Command): Command {
  const tempData = data as Command & { _id?: unknown }
  delete tempData._id
  return data
}

/**
 * Gets all descendant folder IDs for a given folder (recursive)
 * @param folderId - The ID of the parent folder
 * @param folders - Array of all folders to search through
 * @returns Array of descendant folder IDs
 */
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

/**
 * Checks if folderA is a descendant of folderB
 * @param folderAId - The ID of folder A to check
 * @param folderBId - The ID of folder B (potential ancestor)
 * @param folders - Array of all folders
 * @returns True if folderA is a descendant of folderB, false otherwise
 */
export function isDescendantOf(
  folderAId: string,
  folderBId: string,
  folders: CommandFolder[],
): boolean {
  const descendants = getDescendantFolderIds(folderBId, folders)
  return descendants.includes(folderAId)
}

/**
 * Checks if moving a folder would create a circular reference
 * @param draggedFolderId - The ID of the folder being moved
 * @param targetFolderId - The ID of the target folder
 * @param folders - Array of all folders
 * @returns True if moving would create a circular reference, false otherwise
 */
export function isCircularReference(
  draggedFolderId: string,
  targetFolderId: string,
  folders: CommandFolder[],
): boolean {
  const descendants = getDescendantFolderIds(draggedFolderId, folders)
  return descendants.includes(targetFolderId)
}
