import type { Command, CommandFolder } from '@/types'
import { ROOT_FOLDER } from '@/const'

export type CommandTreeNode = {
  type: 'command' | 'folder'
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

export type FlattenNode = {
  id: string
  index: number
  content: Command | CommandFolder
  firstChild?: boolean
  lastChild?: boolean
}

const createFolderNode = (folder: CommandFolder): CommandTreeNode => ({
  type: 'folder',
  content: folder,
  children: [],
})

export const findNodeInTree = (
  tree: CommandTreeNode[],
  id: string,
): CommandTreeNode | null => {
  for (const node of tree) {
    if (node.content.id === id) {
      return node
    }
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

export const findFirstCommand = (
  node: CommandTreeNode,
): CommandTreeNode | null => {
  if (node.children == null) return null
  const first = node.children[0]
  if (first == null) return null
  if (first.type === 'folder') return findFirstCommand(first)
  return first
}

const addParentFolderIfNeeded = (
  tree: CommandTreeNode[],
  parentFolderId: string,
  folders: CommandFolder[],
  processedFolders: Set<string>,
  addNodeToTree: (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => void,
) => {
  if (parentFolderId === ROOT_FOLDER) return

  const parentFolder = folders.find((f) => f.id === parentFolderId)
  if (parentFolder && !processedFolders.has(parentFolder.id)) {
    const folderNode = createFolderNode(parentFolder)
    addNodeToTree(tree, folderNode, parentFolder.parentFolderId)
    processedFolders.add(parentFolder.id)
  }
}

const createAddNodeToTreeFunction = (
  folders: CommandFolder[],
  processedFolders: Set<string>,
) => {
  const addNodeToTree = (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => {
    if (parentId && parentId !== ROOT_FOLDER) {
      const parent = findNodeInTree(tree, parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(node)
      } else {
        addParentFolderIfNeeded(
          tree,
          parentId,
          folders,
          processedFolders,
          addNodeToTree,
        )
        addNodeToTree(tree, node, parentId)
      }
    } else {
      tree.push(node)
    }
  }
  return addNodeToTree
}

const addCommandsToTree = (
  tree: CommandTreeNode[],
  commands: Command[],
  folders: CommandFolder[],
  processedFolders: Set<string>,
  addNodeToTree: (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => void,
) => {
  commands.forEach((command) => {
    const commandNode: CommandTreeNode = {
      type: 'command',
      content: command,
    }

    if (command.parentFolderId && command.parentFolderId !== ROOT_FOLDER) {
      addParentFolderIfNeeded(
        tree,
        command.parentFolderId,
        folders,
        processedFolders,
        addNodeToTree,
      )
    }

    addNodeToTree(tree, commandNode, command.parentFolderId)
  })
}

const addRemainingFoldersToTree = (
  tree: CommandTreeNode[],
  folders: CommandFolder[],
  processedFolders: Set<string>,
  addNodeToTree: (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => void,
) => {
  folders.forEach((folder) => {
    if (!processedFolders.has(folder.id)) {
      const folderNode = createFolderNode(folder)
      addNodeToTree(tree, folderNode, folder.parentFolderId)
      processedFolders.add(folder.id)
    }
  })
}

export function toCommandTree(
  commands: Command[],
  folders: CommandFolder[],
): CommandTreeNode[] {
  const tree: CommandTreeNode[] = []
  const processedFolders = new Set<string>()
  if (commands == null || (commands.length === 0 && folders.length === 0)) {
    return tree
  }

  const addNodeToTree = createAddNodeToTreeFunction(folders, processedFolders)
  addCommandsToTree(tree, commands, folders, processedFolders, addNodeToTree)
  addRemainingFoldersToTree(tree, folders, processedFolders, addNodeToTree)

  return tree
}

function _toFlatten(
  tree: CommandTreeNode[],
  flatten: FlattenNode[] = [],
): FlattenNode[] {
  for (const node of tree) {
    if (node.type === 'command') {
      flatten.push({
        id: node.content.id,
        content: node.content,
        index: 0,
      })
    } else {
      flatten.push({
        id: node.content.id,
        content: node.content,
        index: 0,
      })

      if (node.children && node.children.length > 0) {
        const beforeChildrenLength = flatten.length
        _toFlatten(node.children, flatten)
        const afterChildrenLength = flatten.length

        if (beforeChildrenLength < afterChildrenLength) {
          flatten[beforeChildrenLength].firstChild = true
        }
        if (afterChildrenLength > beforeChildrenLength) {
          flatten[afterChildrenLength - 1].lastChild = true
        }
      }
    }
  }
  return flatten
}

export function toFlatten(tree: CommandTreeNode[]): FlattenNode[] {
  let flatten = _toFlatten(tree)
  flatten = flatten.map((node, index) => ({ ...node, index }))
  return flatten
}

export function calcLevel(
  node: FlattenNode | Command | CommandFolder,
  folders: CommandFolder[],
): number {
  const calculateDepth = (parentFolderId?: string): number => {
    if (!parentFolderId || parentFolderId === ROOT_FOLDER) {
      return 0
    }

    const parentFolder = folders.find((f) => f.id === parentFolderId)
    if (!parentFolder) {
      return 0
    }

    return 1 + calculateDepth(parentFolder.parentFolderId)
  }

  // Handle different input types
  const parentFolderId =
    'content' in node ? node.content.parentFolderId : node.parentFolderId

  return calculateDepth(parentFolderId)
}

export function getAllCommandsFromFolder(
  folderNode: CommandTreeNode,
): Command[] {
  const commands: Command[] = []

  const collectCommands = (node: CommandTreeNode) => {
    if (node.type === 'command') {
      commands.push(node.content as Command)
    }

    if (node.children) {
      for (const child of node.children) {
        collectCommands(child)
      }
    }
  }

  collectCommands(folderNode)
  return commands
}
