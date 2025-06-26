import { useCallback } from 'react'
import { useFieldArray } from 'react-hook-form'
import { toCommandTree } from '@/services/commandTree'
import { isCircularReference } from '@/lib/commandUtils'
import { ROOT_FOLDER } from '@/const'
import { CommandsSchemaType, FoldersSchemaType } from '@/types/schema'
import {
  findNodeInTree,
  getAllCommandsFromFolder,
} from '@/services/commandTree'

export const useCommandActions = (
  commandArray: ReturnType<
    typeof useFieldArray<CommandsSchemaType, 'commands'>
  >,
  folderArray: ReturnType<typeof useFieldArray<FoldersSchemaType, 'folders'>>,
) => {
  const tree = toCommandTree(commandArray.fields, folderArray.fields)

  const moveCommands = useCallback(
    (from: number, to: number) => {
      commandArray.move(from, to)
    },
    [commandArray],
  )

  const moveFolderAsSubfolder = useCallback(
    (sourceFolderId: string, targetFolderId: string) => {
      if (
        isCircularReference(
          sourceFolderId,
          targetFolderId,
          folderArray.fields as any,
        )
      ) {
        return
      }

      const sourceFolderIndex = folderArray.fields.findIndex(
        (f) => f.id === sourceFolderId,
      )
      if (sourceFolderIndex >= 0) {
        const sourceFolder = folderArray.fields[sourceFolderIndex]
        folderArray.update(sourceFolderIndex, {
          ...sourceFolder,
          parentFolderId: targetFolderId,
        })
      }
    },
    [folderArray],
  )

  const moveFolderToSameLevel = useCallback(
    (sourceFolderId: string, targetParentId: string | undefined) => {
      const sourceFolderIndex = folderArray.fields.findIndex(
        (f) => f.id === sourceFolderId,
      )
      if (sourceFolderIndex >= 0) {
        const sourceFolder = folderArray.fields[sourceFolderIndex]
        folderArray.update(sourceFolderIndex, {
          ...sourceFolder,
          parentFolderId: targetParentId ?? ROOT_FOLDER,
        })
      }
    },
    [folderArray],
  )

  const moveFolderContents = useCallback(
    (sourceFolderId: string, targetIndex: number, firstChildIndex: number) => {
      const folderNode = findNodeInTree(tree, sourceFolderId)
      if (!folderNode) {
        return
      }
      const folderCommands = getAllCommandsFromFolder(folderNode)
      const isForwardDrag = targetIndex > firstChildIndex
      if (isForwardDrag) {
        folderCommands.forEach(() => {
          moveCommands(firstChildIndex, targetIndex)
        })
      } else {
        let currentTargetIndex = targetIndex
        folderCommands.forEach((cmd) => {
          const idx = commandArray.fields.findIndex((c) => c.id === cmd.id)
          moveCommands(idx, currentTargetIndex)
          currentTargetIndex++
        })
      }
    },
    [tree, commandArray, moveCommands],
  )

  const moveCommandToSameLevel = useCallback(
    (commandId: string, distIndex: number, parentId = ROOT_FOLDER) => {
      const idx = commandArray.fields.findIndex((c) => c.id === commandId)
      if (idx >= 0) {
        const command = commandArray.fields[idx]
        // Update parent folder first
        commandArray.update(idx, {
          ...command,
          parentFolderId: parentId,
        })
        // Then move to target position
        moveCommands(idx, distIndex)
      }
    },
    [commandArray, moveCommands],
  )

  const commandRemove = useCallback(
    (id: string) => {
      const commandIndex = commandArray.fields.findIndex((c) => c.id === id)
      if (commandIndex >= 0) {
        commandArray.remove(commandIndex)
        return
      }

      const folderIndex = folderArray.fields.findIndex((f) => f.id === id)
      if (folderIndex >= 0) {
        // Move child commands to root when removing folder
        const childCommands = commandArray.fields
          .map((cmd, index) => ({ ...cmd, index }))
          .filter((cmd: any) => cmd.parentFolderId === id)

        childCommands.forEach((cmd) => {
          commandArray.update(cmd.index, {
            ...cmd,
            parentFolderId: ROOT_FOLDER,
          })
        })

        const childFolders = folderArray.fields
          .map((folder, index) => ({ ...folder, index }))
          .filter((folder: any) => folder.parentFolderId === id)

        childFolders.forEach((folder) => {
          folderArray.update(folder.index, {
            ...folder,
            parentFolderId: ROOT_FOLDER,
          })
        })

        folderArray.remove(folderIndex)
      }
    },
    [tree, commandArray, folderArray],
  )

  return {
    moveCommands,
    moveFolderAsSubfolder,
    moveFolderToSameLevel,
    moveFolderContents,
    moveCommandToSameLevel,
    commandRemove,
  }
}
