import { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import {
  Terminal,
  FolderPlus,
  Search,
  MessageSquareMore,
  SquareTerminal,
  Eye,
  BookOpen,
  Paintbrush,
} from 'lucide-react'

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

import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/Tooltip'
import { SortableItem } from '@/components/option/SortableItem'
import { LoadingIcon } from '@/components/option/LoadingIcon'
import { EditButton } from '@/components/option/EditButton'
import { RemoveButton } from '@/components/option/RemoveButton'
import { InputField } from '@/components/option/field/InputField'
import { SelectField } from '@/components/option/field/SelectField'
import { SwitchField } from '@/components/option/field/SwitchField'
import {
  CommandEditDialog,
  commandSchema,
} from '@/components/option/editor/CommandEditDialog'
import {
  FolderEditDialog,
  folderSchema,
} from '@/components/option/editor/FolderEditDialog'
import {
  PageRuleList,
  pageRuleSchema,
} from '@/components/option/editor/PageRuleList'
import {
  UserStyleList,
  userStyleSchema,
} from '@/components/option/editor/UserStyleList'

import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

import { z } from 'zod'
import {
  STYLE,
  STARTUP_METHOD,
  POPUP_PLACEMENT,
  KEYBOARD,
  COMMAND_MAX,
  DRAG_OPEN_MODE,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  OPEN_MODE,
  ROOT_FOLDER,
} from '@/const'
import type {
  SettingsType,
  Command,
  CommandFolder,
  SelectionCommand,
} from '@/types'
import {
  isMenuCommand,
  isLinkCommand,
  isMac,
  isEmpty,
  sleep,
  unique,
  e2a,
  cn,
  hyphen2Underscore,
} from '@/lib/utils'
import { Settings } from '@/services/settings'
import DefaultSettings from '@/services/defaultSettings'

const formSchema = z
  .object({
    startupMethod: z
      .object({
        method: z.nativeEnum(STARTUP_METHOD),
        keyboardParam: z.nativeEnum(KEYBOARD).optional(),
        leftClickHoldParam: z.number().min(50).max(500).step(10).optional(),
      })
      .strict(),
    popupPlacement: z.nativeEnum(POPUP_PLACEMENT),
    style: z.nativeEnum(STYLE),
    commands: z.array(commandSchema).min(1).max(COMMAND_MAX),
    folders: z.array(folderSchema),
    linkCommand: z
      .object({
        enabled: z
          .nativeEnum(LINK_COMMAND_ENABLED)
          .refine((v) => v !== LINK_COMMAND_ENABLED.INHERIT),
        openMode: z.nativeEnum(DRAG_OPEN_MODE),
        showIndicator: z.boolean(),
        startupMethod: z
          .object({
            method: z.nativeEnum(LINK_COMMAND_STARTUP_METHOD),
            keyboardParam: z.nativeEnum(KEYBOARD).optional(),
            threshold: z.number().min(50).max(400).step(10).optional(),
            leftClickHoldParam: z.number().min(50).max(500).step(10).optional(),
          })
          .strict(),
      })
      .strict(),
    pageRules: z.array(pageRuleSchema),
    userStyles: z.array(userStyleSchema),
  })
  .strict()

type FormValues = z.infer<typeof formSchema>
type CommandSchemaType = z.infer<typeof commandSchema>

type CommandTreeNode = {
  type: 'command' | 'folder'
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

function toCommandTree(
  commands: Command[],
  folders: CommandFolder[],
): CommandTreeNode[] {
  let tree = commands.reduce((acc, command) => {
    if (command.parentFolderId && command.parentFolderId !== ROOT_FOLDER) {
      const folder = folders.find((f) => f.id === command.parentFolderId)
      if (folder) {
        const parent = acc.find((node) => node.content.id === folder.id)
        if (parent) {
          if (parent.children == null) parent.children = []
          parent.children.push({
            type: 'command',
            content: command,
          })
        } else {
          acc.push({
            type: 'folder',
            content: folder,
            children: [
              {
                type: 'command',
                content: command,
              },
            ],
          })
        }
      }
    } else {
      acc.push({
        type: 'command',
        content: command,
      })
    }
    return acc
  }, [] as CommandTreeNode[])
  const existsFolders = unique(commands.map((c) => c.parentFolderId))
  const remainingFolders = folders.filter((f) => !existsFolders.includes(f.id))
  tree = tree.concat(
    remainingFolders.map((folder) => ({
      type: 'folder',
      content: folder,
      children: [],
    })),
  )
  return tree
}

type FlattenNode = {
  id: string
  index: number
  content: SelectionCommand | CommandFolder
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
      _toFlatten(node.children ?? [], flatten)
      flatten[flatten.length - 1].lastChild = true
    }
  }
  return flatten
}
function toFlatten(tree: CommandTreeNode[]): FlattenNode[] {
  let flatten = _toFlatten(tree)
  flatten = flatten.map((node, index) => ({ ...node, index }))
  return flatten
}

function commandsFilter(
  nodes: FlattenNode[],
  draggingId?: string | null,
): FlattenNode[] {
  return nodes.filter((node) => {
    if (isCommand(node.content)) {
      if (node.content.parentFolderId === draggingId) return false
    }
    return true
  })
}

function isDroppable(selfNode: FlattenNode, activeNode?: FlattenNode): boolean {
  if (!activeNode) return true
  if (isCommand(activeNode.content)) return true

  const isMoveDown = activeNode.index < selfNode.index
  if (isMoveDown) {
    if (isFolder(selfNode.content)) return false
    if (selfNode.content.parentFolderId != null && !selfNode.lastChild)
      return false
  } else {
    if (isFolder(selfNode.content)) return true
    if (selfNode.content.parentFolderId != null) return false
  }

  return true
}

function isCommand(
  content: Command | CommandFolder | undefined,
): content is SelectionCommand {
  if (content == null) return false
  if ('openMode' in content) {
    return e2a(OPEN_MODE).includes(content.openMode)
  }
  return false
}

function isFolder(
  content: Command | CommandFolder | undefined,
): content is CommandFolder {
  if (content == null) return false
  return !('openMode' in content)
}

function calcLevel(node: FlattenNode): number {
  if (isCommand(node.content)) {
    if (node.content.parentFolderId) {
      return 1
    } else {
      return 0
    }
  } else {
    return 0
  }
}

type SettingsFormType = Omit<SettingsType, 'settingVersion' | 'stars'>

export function SettingForm({ className }: { className?: string }) {
  const [settingData, setSettingData] = useState<SettingsFormType>()
  const [isSaving, setIsSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [commandDialogOpen, _setCommandDialogOpen] = useState(false)
  const [folderDialogOpen, _setFolderDialogOpen] = useState(false)
  const initializedRef = useRef<boolean>(false)
  const saveToRef = useRef<number>()
  const iconToRef = useRef<number>()
  const commandsRef = useRef<HTMLUListElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const editDataRef = useRef<Command | CommandFolder | null>(null)
  const addCommandButtonRef = useRef<HTMLButtonElement>(null)
  const addFolderButtonRef = useRef<HTMLButtonElement>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  })
  const { reset, getValues, setValue, register, watch } = form
  const commandArray = useFieldArray({
    name: 'commands',
    control: form.control,
    keyName: '_id',
  })
  const folderArray = useFieldArray({
    name: 'folders',
    control: form.control,
    keyName: '_id',
  })
  const startupMethod = useWatch({
    control: form.control,
    name: 'startupMethod.method',
    defaultValue: STARTUP_METHOD.TEXT_SELECTION,
  })
  const linkCommandMethod = useWatch({
    control: form.control,
    name: 'linkCommand.startupMethod.method',
    defaultValue: LINK_COMMAND_STARTUP_METHOD.KEYBOARD,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const commandTree = toCommandTree(commandArray.fields, folderArray.fields)
  let flatten = toFlatten(commandTree)
  flatten = commandsFilter(flatten, draggingId)
  const activeNode = flatten.find((f) => f.id === draggingId)

  const setCommandDialogOpen = (open: boolean) => {
    if (!open) {
      // Reset editData when closing the dialog.
      editDataRef.current = null
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

  const updateSettings = async (settings: SettingsFormType) => {
    try {
      setIsSaving(true)
      const current = await Settings.get(true)
      const linkCommands = current.commands.filter(isLinkCommand).map((c) => ({
        ...c,
        openMode: settings.linkCommand.openMode,
      }))

      // sort commands
      const commandTree = toCommandTree(settings.commands, settings.folders)
      const commands = toFlatten(commandTree)
        .map((f) => f.content)
        .filter((c) => isCommand(c))

      settings.commands = [...commands, ...linkCommands]
      await Settings.set({
        ...settings,
        settingVersion: current.settingVersion,
        stars: current.stars,
      })
      await sleep(1000)
    } catch (e) {
      console.error('Failed to update settings!', settings)
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await Settings.get(true)
      // Convert linkCommand option
      const linkCommands = settings.commands.filter(isLinkCommand)
      if (linkCommands.length > 0) {
        const linkCommand = linkCommands[0]
        settings.linkCommand = {
          ...settings.linkCommand,
          openMode: linkCommand.openMode,
        }
      }
      settings.commands = settings.commands.filter(isMenuCommand)
      reset(settings as FormValues)
    }
    loadSettings()
  }, [])

  // Save after 500 ms to storage.
  useEffect(() => {
    let unmounted = false

    // Skip saving if the settingData is not initialized.
    if (!initializedRef.current) {
      initializedRef.current = settingData != null
      return
    }

    clearTimeout(saveToRef.current)
    saveToRef.current = window.setTimeout(() => {
      if (unmounted || settingData == null) return
      updateSettings(settingData)
    }, 1 * 500 /* ms */)

    return () => {
      unmounted = true
      clearTimeout(saveToRef.current)
      clearTimeout(iconToRef.current)
    }
  }, [settingData])

  useEffect(() => {
    commandsRef.current?.style.setProperty(
      'height',
      commandsRef.current.scrollHeight + 'px',
    )
  }, [settingData?.commands])

  useEffect(() => {
    if (startupMethod === STARTUP_METHOD.KEYBOARD) {
      const val = getValues('startupMethod.keyboardParam')
      if (isEmpty(val)) {
        setValue('startupMethod.keyboardParam', KEYBOARD.SHIFT)
      }
    } else if (startupMethod === STARTUP_METHOD.LEFT_CLICK_HOLD) {
      const val = getValues('startupMethod.leftClickHoldParam')
      if (val == null || isNaN(val)) {
        setValue('startupMethod.leftClickHoldParam', 200)
      }
    }
  }, [startupMethod])

  useEffect(() => {
    if (linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.KEYBOARD) {
      const val = getValues('linkCommand.startupMethod.keyboardParam')
      if (isEmpty(val)) {
        setValue(
          'linkCommand.startupMethod.keyboardParam',
          DefaultSettings.linkCommand.startupMethod.keyboardParam,
        )
      }
    } else if (linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.DRAG) {
      const val = getValues('linkCommand.startupMethod.threshold')
      if (val == null || isNaN(val)) {
        setValue(
          'linkCommand.startupMethod.threshold',
          DefaultSettings.linkCommand.startupMethod.threshold,
        )
      }
    } else if (
      linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD
    ) {
      const val = getValues('linkCommand.startupMethod.leftClickHoldParam')
      if (val == null || isNaN(val)) {
        setValue(
          'linkCommand.startupMethod.leftClickHoldParam',
          DefaultSettings.linkCommand.startupMethod.leftClickHoldParam,
        )
      }
    }
  }, [linkCommandMethod])

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.debug(value, name, type)
      setSettingData(value as SettingsFormType)
    })
    return () => subscription.unsubscribe()
  }, [watch])

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

  const moveCommands = (srcIdxs: number[], distIdx: number) => {
    const sortedIndexes = [...srcIdxs].sort((a, b) => b - a)
    const itemsToMove = sortedIndexes.map((index) => commandArray.fields[index])
    sortedIndexes.forEach((index) => commandArray.remove(index))

    const isMoveDown = srcIdxs[0] < distIdx
    if (isMoveDown) distIdx -= srcIdxs.length - 1
    itemsToMove.reverse().forEach((item, i) => {
      commandArray.insert(distIdx + i, item)
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
      } else {
        commandArray.append(data as CommandSchemaType)
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

  const commandRemove = (idx: number) => {
    const node = flatten[idx]
    if (isCommand(node.content)) {
      commandArray.remove(
        commandArray.fields.findIndex((f) => f.id === node.id),
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

  const commandIdx = (id: string) =>
    commandArray.fields.findIndex((f) => f.id === id)

  const moveArray = (srcId: string, distId: string) => {
    const srcNode = flatten.find((f) => f.id === srcId)
    const distNode = flatten.find((f) => f.id === distId)
    if (!srcNode || !distNode) return

    const isMoveDown =
      flatten.findIndex((f) => f.id === srcId) <
      flatten.findIndex((f) => f.id === distId)

    if (isCommand(srcNode.content)) {
      const srcIdx = commandIdx(srcId)
      if (isCommand(distNode.content)) {
        // command to command
        const distIdx = commandIdx(distId)
        commandArray.update(srcIdx, {
          ...srcNode.content,
          parentFolderId: distNode.content.parentFolderId,
        } as CommandSchemaType)
        commandArray.move(srcIdx, distIdx)
      } else {
        // command to folder
        let distIdx = commandArray.fields.findIndex(
          (f) => f.parentFolderId === distId,
        )
        if (distIdx === -1) {
          // Empty folders always exist at the end of the list, so move to the end of the dommands.
          distIdx = commandArray.fields.length
        }
        commandArray.update(srcIdx, {
          ...srcNode.content,
          parentFolderId: isMoveDown ? distId : undefined,
        } as CommandSchemaType)
        commandArray.move(srcIdx, isMoveDown ? distIdx - 1 : distIdx)
      }
    } else {
      const srcIdxs = commandArray.fields
        .filter((f) => f.parentFolderId === srcId)
        .map((f) => commandIdx(f.id))
      if (isCommand(distNode.content)) {
        // folder to command
        const distIdx = commandIdx(distId)
        moveCommands(srcIdxs, distIdx)
      } else {
        // folder to folder
        const distIdx = commandArray.fields.findIndex(
          (f) => f.parentFolderId === distId,
        )
        moveCommands(srcIdxs, distIdx)
      }
    }
  }

  const os = isMac() ? 'mac' : 'windows'

  return (
    <Form {...form}>
      <CSSTransition
        in={isSaving}
        timeout={300}
        classNames="drop-in"
        unmountOnExit
        nodeRef={loadingRef}
      >
        <LoadingIcon ref={loadingRef}>
          <span>{_t('saving')}</span>
        </LoadingIcon>
      </CSSTransition>

      <form
        id="InputForm"
        className={cn(
          'space-y-10 w-[600px] mx-auto pb-20 text-gray-800',
          className,
        )}
      >
        <section id="startupMethod" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <MessageSquareMore size={22} className="mr-1.5 stroke-gray-600" />
            {t('startupMethod')}
          </h3>
          <p className="text-base">{t('startupMethod_desc')}</p>
          <SelectField
            control={form.control}
            name="startupMethod.method"
            formLabel="方法"
            options={e2a(STARTUP_METHOD).map((method) => ({
              name: t(`startupMethod_${method}`),
              value: method,
            }))}
          />
          {getValues('startupMethod.method') === STARTUP_METHOD.KEYBOARD && (
            <SelectField
              control={form.control}
              name="startupMethod.keyboardParam"
              formLabel="表示を切り替えるキー"
              placeholder="キーを選択"
              options={e2a(KEYBOARD)
                .filter((k) => k != KEYBOARD.META)
                .map((key) => ({
                  name: t(`keyboardParam_${key}_${os}`),
                  value: key,
                }))}
            />
          )}
          {getValues('startupMethod.method') ===
            STARTUP_METHOD.LEFT_CLICK_HOLD && (
            <InputField
              control={form.control}
              name="startupMethod.leftClickHoldParam"
              formLabel="長押し時間(ms)"
              inputProps={{
                type: 'number',
                min: 50,
                max: 500,
                step: 10,
                ...register('startupMethod.leftClickHoldParam', {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          <SelectField
            control={form.control}
            name="popupPlacement"
            formLabel="メニュー表示位置"
            options={e2a(POPUP_PLACEMENT).map((placement) => ({
              name: t(`popupPlacement_${hyphen2Underscore(placement)}`),
              value: placement,
            }))}
          />
          <SelectField
            control={form.control}
            name="style"
            formLabel="メニュースタイル"
            options={e2a(STYLE).map((style) => ({
              name: t(`style_${style}`),
              value: style,
            }))}
          />
        </section>
        <hr />
        <section id="commands" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <SquareTerminal size={22} className="mr-1.5 stroke-gray-600" />
            {t('commands')}
          </h3>
          <p className="text-base">{t('commands_desc')}</p>
          <div className="relative h-10 flex items-end">
            <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono tracking-tight">
              {getValues('commands')?.length ?? 0}
              {t('commands_desc_count')}
            </span>
            <Button
              type="button"
              ref={addFolderButtonRef}
              variant="outline"
              className="absolute left-[250px] px-2 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group"
              onClick={() => setFolderDialogOpen(true)}
            >
              <FolderPlus />
              フォルダ
            </Button>
            <Tooltip
              positionElm={addFolderButtonRef.current}
              text={'フォルダを作成します'}
            />
            <Button
              type="button"
              ref={addCommandButtonRef}
              variant="outline"
              className="absolute left-[358px] px-2 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group"
              onClick={() => setCommandDialogOpen(true)}
            >
              <Terminal className="stroke-gray-600 group-hover:stroke-gray-700" />
              コマンド
            </Button>
            <Tooltip
              positionElm={addCommandButtonRef.current}
              text={'コマンドを作成します'}
            />
            <Button
              variant="outline"
              className="absolute right-1 px-2 rounded-md transition hover:bg-gray-100 hover:scale-[110%] group"
              asChild
            >
              <a
                href="https://ujiro99.github.io/selection-command/?utm_source=optionPage&utm_medium=button"
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
                    level={calcLevel(field)}
                    droppable={isDroppable(field, activeNode)}
                    className={cn(
                      isFolder(activeNode?.content) &&
                        isCommand(field.content) &&
                        field.content.parentFolderId != null &&
                        'opacity-50 bg-gray-100',
                    )}
                  >
                    <div className="h-14 pr-2 pl-0 flex-1 flex items-center overflow-hidden">
                      <div className="flex-1 flex items-center overflow-hidden pr-2">
                        <img
                          src={field.content.iconUrl}
                          alt={field.content.title}
                          className="inline-block w-7 h-7 mr-3"
                        />
                        <div className="overflow-hidden">
                          <p className="text-lg flex flex-row">
                            <span className="text-base">
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
                        <EditButton onClick={() => commandEditorOpen(index)} />
                        <RemoveButton
                          title={field.content.title}
                          iconUrl={field.content.iconUrl}
                          onRemove={() => commandRemove(index)}
                        />
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </ul>
        </section>
        <hr />
        <section id="linkCommand" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <Eye size={22} className="mr-1.5 stroke-gray-600" />
            {t('linkCommand')}
          </h3>
          <p className="text-base">{t('linkCommand_desc')}</p>
          <SelectField
            control={form.control}
            name="linkCommand.enabled"
            formLabel={t('linkCommandEnabled')}
            options={e2a(LINK_COMMAND_ENABLED)
              .filter((opt) => opt !== LINK_COMMAND_ENABLED.INHERIT)
              .map((opt) => ({
                name: t(`linkCommand_enabled${opt}`),
                value: opt,
              }))}
          />
          <SelectField
            control={form.control}
            name="linkCommand.openMode"
            formLabel={t('openMode')}
            options={e2a(DRAG_OPEN_MODE).map((opt) => ({
              name: t(`openMode_${opt}`),
              value: opt,
            }))}
          />
          <SelectField
            control={form.control}
            name="linkCommand.startupMethod.method"
            formLabel={t('linkCommandStartupMethod_method')}
            options={e2a(LINK_COMMAND_STARTUP_METHOD).map((opt) => ({
              name: t(`linkCommandStartupMethod_${opt}`),
              value: opt,
            }))}
          />
          {linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.KEYBOARD && (
            <SelectField
              control={form.control}
              name="linkCommand.startupMethod.keyboardParam"
              formLabel={t('linkCommandStartupMethod_keyboard')}
              options={e2a(KEYBOARD)
                .filter((k) => k != KEYBOARD.META)
                .map((key) => ({
                  name: t(`keyboardParam_${key}_${os}`),
                  value: key,
                }))}
            />
          )}
          {linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.DRAG && (
            <InputField
              control={form.control}
              name="linkCommand.startupMethod.threshold"
              formLabel={t('linkCommandStartupMethod_threshold')}
              description={t('linkCommandStartupMethod_threshold_desc')}
              inputProps={{
                type: 'number',
                min: 50,
                max: 400,
                step: 10,
                ...register('linkCommand.startupMethod.threshold', {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          {linkCommandMethod ===
            LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD && (
            <InputField
              control={form.control}
              name="linkCommand.startupMethod.leftClickHoldParam"
              formLabel={t('linkCommandStartupMethod_leftClickHoldParam')}
              inputProps={{
                type: 'number',
                min: 50,
                max: 500,
                step: 10,
                ...register('linkCommand.startupMethod.leftClickHoldParam', {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          <SwitchField
            control={form.control}
            name="linkCommand.showIndicator"
            formLabel={t('showIndicator')}
            description={t('showIndicator_desc')}
          />
        </section>
        <hr />

        <section id="pageRules" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <BookOpen size={22} className="mr-1.5 stroke-gray-600" />
            {t('pageRules')}
          </h3>
          <p className="text-base">{t('pageRules_desc')}</p>
          <PageRuleList control={form.control} />
        </section>
        <hr />
        <section id="userStyles" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <Paintbrush size={22} className="mr-1.5 stroke-gray-600" />
            {t('userStyles')}
          </h3>
          <p className="text-base">{t('userStyles_desc')}</p>
          <UserStyleList control={form.control} />
        </section>
      </form>
    </Form>
  )
}
