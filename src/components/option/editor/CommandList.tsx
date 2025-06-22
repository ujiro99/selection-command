import { useState, useRef, useEffect } from 'react'
import { useFieldArray } from 'react-hook-form'
import { z } from 'zod'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { Terminal, FolderPlus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/Tooltip'
import { SortableItem } from '@/components/option/SortableItem'
import { EditButton } from '@/components/option/EditButton'
import { CopyButton } from '@/components/option/CopyButton'
import { RemoveButton } from '@/components/option/RemoveButton'
import {
  commandSchema,
  CommandEditDialog,
} from '@/components/option/editor/CommandEditDialog'
import {
  FolderEditDialog,
  folderSchema,
} from '@/components/option/editor/FolderEditDialog'
import { MenuImage } from '@/components/menu/MenuImage'

import { ANALYTICS_EVENTS, sendEvent } from '@/services/analytics'
import { SCREEN } from '@/const'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { OPEN_MODE, ROOT_FOLDER, COMMAND_MAX, HUB_URL } from '@/const'
import { cn, e2a, isEmpty } from '@/lib/utils'
import type {
  Command,
  CommandFolder,
  SelectionCommand,
  PageActionCommand,
} from '@/types'

const commandsSchema = z.object({
  commands: z.array(commandSchema).min(1).max(COMMAND_MAX),
})

const foldersSchema = z.object({
  folders: z.array(folderSchema),
})

type CommandSchemaType = z.infer<typeof commandSchema>
type CommandsSchemaType = z.infer<typeof commandsSchema>
type FoldersSchemaType = z.infer<typeof foldersSchema>

type CommandTreeNode = {
  type: 'command' | 'folder'
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

// フォルダーノードを作成する関数
const createFolderNode = (folder: CommandFolder): CommandTreeNode => ({
  type: 'folder',
  content: folder,
  children: [],
})

// ツリー内でノードを検索する関数
const findNodeInTree = (
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

// 親フォルダーが必要な場合に追加する関数
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

// ノードをツリーに追加する関数を作成するファクトリー
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
        // 親フォルダーがまだない場合は、先に親フォルダーを追加
        addParentFolderIfNeeded(
          tree,
          parentId,
          folders,
          processedFolders,
          addNodeToTree,
        )
        // 再帰的に追加
        addNodeToTree(tree, node, parentId)
      }
    } else {
      // ルートレベルに追加
      tree.push(node)
    }
  }
  return addNodeToTree
}

// コマンドをツリーに追加する処理
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

    // コマンドを追加する前に、必要な親フォルダーが存在するか確認し、なければ追加
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

// 残りのフォルダーをツリーに追加する処理
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

  const addNodeToTree = createAddNodeToTreeFunction(folders, processedFolders)

  // commandArrayの順序に従って、コマンドとフォルダーを順番に処理
  addCommandsToTree(tree, commands, folders, processedFolders, addNodeToTree)

  // 残りのフォルダー（コマンドで参照されていないフォルダー）を追加
  addRemainingFoldersToTree(tree, folders, processedFolders, addNodeToTree)

  return tree
}

type FlattenNode = {
  id: string
  index: number
  content: SelectionCommand | CommandFolder
  firstChild?: boolean
  lastChild?: boolean
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

        // 最初の子要素にfirstChildマークを設定
        if (beforeChildrenLength < afterChildrenLength) {
          flatten[beforeChildrenLength].firstChild = true
        }
        // 最後の子要素にlastChildマークを設定
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

// ドラッグ中のフォルダーの子孫フォルダーIDを再帰的に取得
const getDescendantFolderIds = (
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

// ノードがドラッグ中のフォルダーの子ノードかどうかを判定
const isChildOfDraggedFolder = (
  node: FlattenNode,
  hiddenFolderIds: Set<string>,
): boolean => {
  if (isCommand(node.content)) {
    return !!(
      node.content.parentFolderId &&
      hiddenFolderIds.has(node.content.parentFolderId)
    )
  }
  if (isFolder(node.content)) {
    return !!(
      node.content.parentFolderId &&
      hiddenFolderIds.has(node.content.parentFolderId)
    )
  }
  return false
}

function commandsFilter(
  nodes: FlattenNode[],
  draggingId?: string | null,
  folders: CommandFolder[] = [],
): FlattenNode[] {
  if (!draggingId) return nodes

  const descendantFolderIds = getDescendantFolderIds(draggingId, folders)
  const hiddenFolderIds = new Set([draggingId, ...descendantFolderIds])

  return nodes.filter((node) => !isChildOfDraggedFolder(node, hiddenFolderIds))
}

function isCircularReference(
  draggedFolderId: string,
  targetFolderId: string,
  folders: CommandFolder[],
): boolean {
  // draggedFolderIdがtargetFolderIdの子孫フォルダーかチェック
  const descendants = getDescendantFolderIds(draggedFolderId, folders)
  return descendants.includes(targetFolderId)
}

function isDroppable(
  selfNode: FlattenNode,
  activeNode?: FlattenNode,
  folders: CommandFolder[] = [],
): boolean {
  if (!activeNode) return true

  // コマンドのドラッグは常に許可
  if (isCommand(activeNode.content)) return true

  // フォルダーのドラッグの場合は循環参照チェックが必要
  if (isFolder(selfNode.content) && isFolder(activeNode.content)) {
    return !isCircularReference(
      activeNode.content.id,
      selfNode.content.id,
      folders,
    )
  }
  return true
}

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

function isFolder(
  content: Command | CommandFolder | undefined,
): content is CommandFolder {
  if (content == null) return false
  return !('openMode' in content)
}

function isInFolder(content: Command | CommandFolder | undefined): boolean {
  if (content == null) return false
  const folderId = content.parentFolderId
  if (!isEmpty(folderId) && folderId != ROOT_FOLDER) {
    return true
  }
  return false
}

export function removeUnstoredParam(data: Command): Command {
  delete (data as any)._id
  return data
}

function calcLevel(node: FlattenNode, folders: CommandFolder[]): number {
  // 再帰的に親フォルダーをたどってネストレベルを計算
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

  const parentFolderId = node.content.parentFolderId
  return calculateDepth(parentFolderId)
}

type CommandListProps = {
  control: any
}

export const CommandList = ({ control }: CommandListProps) => {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [commandDialogOpen, _setCommandDialogOpen] = useState(false)
  const [folderDialogOpen, _setFolderDialogOpen] = useState(false)
  const addCommandButtonRef = useRef<HTMLButtonElement>(null)
  const addFolderButtonRef = useRef<HTMLButtonElement>(null)
  const commandsRef = useRef<HTMLUListElement>(null)
  const editDataRef = useRef<Command | CommandFolder | null>(null)

  const commandArray = useFieldArray<CommandsSchemaType, 'commands', '_id'>({
    name: 'commands',
    control: control,
    keyName: '_id',
  })

  const folderArray = useFieldArray<FoldersSchemaType, 'folders', '_id'>({
    name: 'folders',
    control: control,
    keyName: '_id',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const commandTree = toCommandTree(commandArray.fields, folderArray.fields)
  let flatten = toFlatten(commandTree)
  flatten = commandsFilter(flatten, draggingId, folderArray.fields)
  const activeNode = flatten.find((f) => f.id === draggingId)

  const setCommandDialogOpen = (open: boolean) => {
    if (!open) {
      // Reset editData when closing the dialog.
      editDataRef.current = null
    } else {
      sendEvent(
        ANALYTICS_EVENTS.OPEN_DIALOG,
        {
          event_label: 'command_edit',
        },
        SCREEN.OPTION,
      )
    }
    _setCommandDialogOpen(open)
  }

  const setFolderDialogOpen = (open: boolean) => {
    if (!open) {
      // Reset editData when closing the dialog.
      editDataRef.current = null
    }
    _setFolderDialogOpen(open)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggingId(active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = event
    if (!active || !over) return
    if (active.id !== over?.id) {
      moveArray(`${active.id}`, `${over.id}`)
    }
  }

  const moveCommands = (sourceIndices: number[], targetIndex: number) => {
    const sortedIndices = [...sourceIndices].sort((a, b) => b - a)
    const itemsToMove = sortedIndices.map((index) => commandArray.fields[index])
    sortedIndices.forEach((index) => commandArray.remove(index))

    const isMoveDown = sourceIndices[0] < targetIndex
    if (isMoveDown) targetIndex -= sourceIndices.length - 1
    itemsToMove.reverse().forEach((item, i) => {
      commandArray.insert(targetIndex + i, item)
    })
  }

  const commandEditorOpen = (idx: number) => {
    const node = flatten[idx]
    editDataRef.current = node.content
    if (isCommand(node.content)) {
      setCommandDialogOpen(true)
    } else {
      setFolderDialogOpen(true)
    }
  }

  const commandUpsert = (data: SelectionCommand | CommandFolder) => {
    if (isCommand(data)) {
      const idx = commandArray.fields.findIndex((f) => f.id === data.id)
      if (idx >= 0) {
        commandArray.update(idx, data as CommandSchemaType)
        sendEvent(
          ANALYTICS_EVENTS.COMMAND_EDIT,
          {
            event_label: data.openMode,
          },
          SCREEN.OPTION,
        )
      } else {
        commandArray.append(data as CommandSchemaType)
        sendEvent(
          ANALYTICS_EVENTS.COMMAND_ADD,
          {
            event_label: data.openMode,
          },
          SCREEN.OPTION,
        )
      }
    } else {
      const idx = folderArray.fields.findIndex((f) => f.id === data.id)
      if (idx >= 0) {
        folderArray.update(idx, data)
      } else {
        folderArray.append(data)
      }
    }
  }

  const commandCopy = (idx: number, title: string) => {
    const node = flatten[idx]
    if (isFolder(node.content)) {
      return
    }
    const index = commandArray.fields.findIndex((f) => f.id === node.id)
    if (index < 0) return
    const cmd = commandArray.fields[index]
    cmd.id = crypto.randomUUID()
    cmd.title = title
    commandArray.insert(index + 1, cmd)
  }

  const commandRemove = (idx: number) => {
    const node = flatten[idx]
    if (isCommand(node.content)) {
      commandArray.remove(
        commandArray.fields.findIndex((f) => f.id === node.id),
      )
      sendEvent(
        ANALYTICS_EVENTS.COMMAND_REMOVE,
        {
          event_label: node.content.openMode,
        },
        SCREEN.OPTION,
      )
    } else {
      commandArray.fields
        .map((f, i) => ({
          index: i,
          id: f.id,
          parentFolderId: f.parentFolderId,
          data: f,
        }))
        .filter((f) => f.parentFolderId === node.id)
        .forEach((f) =>
          commandArray.update(f.index, {
            ...f.data,
            parentFolderId: undefined,
          }),
        )
      folderArray.remove(folderArray.fields.findIndex((f) => f.id === node.id))
    }
  }

  const getCommandIndex = (id: string): number =>
    commandArray.fields.findIndex((f) => f.id === id)

  // コマンドからコマンドへの移動処理
  const moveCommandToCommand = (
    sourceCommandIndex: number,
    sourceCommand: SelectionCommand,
    targetCommand: SelectionCommand,
  ) => {
    const targetCommandIndex = getCommandIndex(targetCommand.id)
    commandArray.update(sourceCommandIndex, {
      ...sourceCommand,
      parentFolderId: targetCommand.parentFolderId,
    } as CommandSchemaType)
    commandArray.move(sourceCommandIndex, targetCommandIndex)
  }

  // コマンドからフォルダーへの移動処理
  const moveCommandToFolder = (
    sourceCommandIndex: number,
    sourceCommand: SelectionCommand,
    targetFolderId: string,
    isMoveDown: boolean,
  ) => {
    if (isMoveDown) {
      // フォルダーの後にドロップ → フォルダー内に移動
      let targetIndex = commandArray.fields.findIndex(
        (f) => f.parentFolderId === targetFolderId,
      )
      if (targetIndex === -1) {
        // Empty folders always exist at the end of the list, so move to the end of the commands.
        targetIndex = commandArray.fields.length
      }
      commandArray.update(sourceCommandIndex, {
        ...sourceCommand,
        parentFolderId: targetFolderId,
      } as CommandSchemaType)
      commandArray.move(sourceCommandIndex, targetIndex - 1)
    } else {
      // フォルダーの前にドロップ → フォルダーと同じレベルの前に挿入
      const targetFolderIndexInFlattened = flatten.findIndex(
        (f) => f.id === targetFolderId,
      )
      // そのフォルダーより前にあるコマンドの数を数える
      let insertPosition = 0
      for (let i = 0; i < targetFolderIndexInFlattened; i++) {
        if (isCommand(flatten[i].content)) {
          insertPosition++
        }
      }

      const targetFolder = flatten.find((f) => f.id === targetFolderId)
        ?.content as CommandFolder
      commandArray.update(sourceCommandIndex, {
        ...sourceCommand,
        parentFolderId: targetFolder.parentFolderId,
      } as CommandSchemaType)
      commandArray.move(sourceCommandIndex, insertPosition)
    }
  }

  // フォルダーの移動処理
  const moveFolderContents = (
    sourceFolderId: string,
    targetNode: FlattenNode,
  ) => {
    const sourceCommandIndices = commandArray.fields
      .filter((f) => f.parentFolderId === sourceFolderId)
      .map((f) => getCommandIndex(f.id))

    if (isCommand(targetNode.content)) {
      // folder to command
      const targetIndex = getCommandIndex(targetNode.id)
      moveCommands(sourceCommandIndices, targetIndex)
    } else {
      // folder to folder
      const targetIndex = commandArray.fields.findIndex(
        (f) => f.parentFolderId === targetNode.id,
      )
      moveCommands(sourceCommandIndices, targetIndex)
    }
  }

  const moveArray = (sourceId: string, targetId: string) => {
    const sourceNode = flatten.find((f) => f.id === sourceId)
    const targetNode = flatten.find((f) => f.id === targetId)
    if (!sourceNode || !targetNode) return

    const isMoveDown =
      flatten.findIndex((f) => f.id === sourceId) <
      flatten.findIndex((f) => f.id === targetId)

    if (isCommand(sourceNode.content)) {
      const sourceCommandIndex = getCommandIndex(sourceId)

      if (isCommand(targetNode.content)) {
        moveCommandToCommand(
          sourceCommandIndex,
          sourceNode.content,
          targetNode.content,
        )
      } else {
        moveCommandToFolder(
          sourceCommandIndex,
          sourceNode.content,
          targetId,
          isMoveDown,
        )
      }
    } else {
      moveFolderContents(sourceId, targetNode)
    }
  }

  useEffect(() => {
    commandsRef.current?.style.setProperty(
      'height',
      commandsRef.current.scrollHeight + 'px',
    )
  }, [commandArray.fields, folderArray.fields])

  return (
    <>
      <div className="relative h-10 flex items-end">
        <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono tracking-tight">
          {commandArray.fields.length ?? 0}
          {t('commands_desc_count')}
        </span>
        <Button
          type="button"
          ref={addFolderButtonRef}
          variant="outline"
          className="absolute left-[255px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
          onClick={() => setFolderDialogOpen(true)}
        >
          <FolderPlus />
          {t('folders')}
        </Button>
        <Tooltip
          positionElm={addFolderButtonRef.current}
          text={t('folders_tooltip')}
        />
        <Button
          type="button"
          ref={addCommandButtonRef}
          variant="outline"
          className="absolute left-[360px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
          onClick={() => setCommandDialogOpen(true)}
        >
          <Terminal className="stroke-gray-600 group-hover:stroke-gray-700" />
          {t('Command')}
        </Button>
        <Tooltip
          positionElm={addCommandButtonRef.current}
          text={t('Command_tooltip')}
        />
        <Button
          variant="outline"
          className="absolute right-0 translate-x-[-5%] pl-2 pr-2.5 w-32 rounded-md transition hover:bg-gray-100 hover:scale-[110%] group"
          asChild
        >
          <a
            href={`${HUB_URL}/?utm_source=optionPage&utm_medium=button`}
            target="_blank"
            className="font-mono text-gray-600 hover:text-gray-700"
          >
            <Search />
            <span className="font-semibold">Command</span>
            <span className="font-thin">Hub</span>
          </a>
        </Button>
        <CommandEditDialog
          open={commandDialogOpen}
          onOpenChange={setCommandDialogOpen}
          onSubmit={(command) => commandUpsert(command)}
          folders={folderArray.fields}
          command={editDataRef.current as SelectionCommand}
        />
        <FolderEditDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          onSubmit={(folder) => commandUpsert(folder)}
          folder={editDataRef.current as CommandFolder}
          folders={folderArray.fields}
        />
      </div>
      <ul ref={commandsRef}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={flatten}
            strategy={verticalListSortingStrategy}
          >
            {flatten.map((field, index) => (
              <SortableItem
                key={field.id}
                id={field.id}
                index={index}
                level={calcLevel(field, folderArray.fields)}
                droppable={isDroppable(field, activeNode, folderArray.fields)}
                className={cn(
                  isFolder(activeNode?.content) &&
                    isCommand(field.content) &&
                    isInFolder(field.content) &&
                    'opacity-50 bg-gray-100',
                )}
              >
                <div className="h-14 pr-2 pl-0 flex-1 flex items-center overflow-hidden">
                  <div className="flex-1 flex items-center overflow-hidden pr-2">
                    <MenuImage
                      src={field.content.iconUrl}
                      svg={
                        isFolder(field.content)
                          ? field.content.iconSvg
                          : undefined
                      }
                      alt={field.content.title}
                      className="inline-block w-7 h-7 mr-3"
                    />
                    <div className="overflow-hidden">
                      <p className="text-lg flex flex-row">
                        <span className="text-base truncate">
                          {field.content.title}
                        </span>
                      </p>
                      {isCommand(field.content) && (
                        <p className="text-xs sm:text-sm text-gray-400 truncate">
                          {field.content.searchUrl}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 items-center">
                    {isPageActionCommand(field.content) && (
                      <CopyButton
                        srcTitle={field.content.title}
                        onClick={(title) => commandCopy(index, title)}
                      />
                    )}
                    <EditButton onClick={() => commandEditorOpen(index)} />
                    <RemoveButton
                      title={field.content.title}
                      iconUrl={field.content.iconUrl}
                      iconSvg={
                        isFolder(field.content)
                          ? field.content.iconSvg
                          : undefined
                      }
                      onRemove={() => commandRemove(index)}
                    />
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </ul>
    </>
  )
}
