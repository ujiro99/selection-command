import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Trash2, Pencil, FilePlus2, FolderPlus, Search } from 'lucide-react'

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

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogPortal,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

import { Tooltip } from '@/components/Tooltip'
import { SortableItem } from '@/components/option/SortableItem'
import { LoadingIcon } from '@/components/option/LoadingIcon'

import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { z } from 'zod'
import {
  STYLE,
  OPEN_MODE,
  STARTUP_METHOD,
  POPUP_PLACEMENT,
  KEYBOARD,
  SPACE_ENCODING,
  COMMAND_MAX,
  DRAG_OPEN_MODE,
  POPUP_ENABLED,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  STYLE_VARIABLE,
} from '@/const'
import type { SettingsType, Command, CommandFolder } from '@/types'
import {
  isMenuCommand,
  isLinkCommand,
  isMac,
  isEmpty,
  sleep,
  unique,
  e2a,
  cn,
} from '@/lib/utils'
import { Settings } from '@/services/settings'

function hyphen2Underscore(input: string): string {
  return input.replace(/-/g, '_')
}

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
    commands: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string(),
            iconUrl: z.string(),
            searchUrl: z.string(),
            openMode: z.nativeEnum(OPEN_MODE).or(z.nativeEnum(DRAG_OPEN_MODE)),
            parentFolderId: z.string().optional(),
            spaceEncoding: z.nativeEnum(SPACE_ENCODING).optional(),
            popupOption: z
              .object({
                width: z.number().min(1),
                height: z.number().min(1),
              })
              .optional(),
            fetchOptions: z.string().optional(),
            variables: z
              .array(
                z.object({
                  name: z.string(),
                  value: z.string(),
                }),
              )
              .optional(),
            copyOption: z.enum(['default', 'text']).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(COMMAND_MAX),
    folders: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          iconUrl: z.string().optional(),
          onlyIcon: z.boolean().optional(),
        })
        .strict(),
    ),
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
    pageRules: z.array(
      z
        .object({
          urlPattern: z.string(),
          popupEnabled: z.nativeEnum(POPUP_ENABLED),
          popupPlacement: z.nativeEnum(POPUP_PLACEMENT),
          linkCommandEnabled: z.nativeEnum(LINK_COMMAND_ENABLED),
        })
        .strict(),
    ),
    userStyles: z.array(
      z
        .object({
          name: z.nativeEnum(STYLE_VARIABLE),
          value: z.string(),
        })
        .strict(),
    ),
  })
  .strict()

type FormValues = z.infer<typeof formSchema>

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
    if (command.parentFolderId) {
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
  content: Command | CommandFolder
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
): content is Command {
  if (content == null) return false
  return 'openMode' in content
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

export function SettingForm() {
  const [settingData, setSettingData] = useState<SettingsFormType>()
  const [isSaving, setIsSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [commandDialogOpen, setCommandDialogOpen] = useState(false)
  const [folderDialogOpen, _setFolderDialogOpen] = useState(false)
  const initializedRef = useRef<boolean>(false)
  const saveToRef = useRef<number>()
  const iconToRef = useRef<number>()
  const commandsRef = useRef<HTMLUListElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const editDataRef = useRef<Command | CommandFolder | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  })
  const { reset, getValues, register, watch } = form
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

  const setFolderDialogOpen = (open: boolean) => {
    if (!open) {
      // Reset editData when closing the dialog.
      editDataRef.current = null
    }
    _setFolderDialogOpen(open)
  }

  const updateSettings = async (settings: SettingsFormType) => {
    if (isSaving) return
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
      reset(settings)
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
      // TODO
    } else {
      setFolderDialogOpen(true)
    }
  }

  const commandUpsert = (data: Command | CommandFolder) => {
    if (isCommand(data)) {
      // TODO
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
      commandArray.remove(idx)
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
        })
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
        })
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

      <form id="InputForm" className="space-y-10 w-[600px] mx-auto">
        <section className="space-y-3">
          <h3 className="text-xl font-semibold">起動方法</h3>
          <p className="text-base">
            ポップアップメニューを表示する方法を変更します。
          </p>
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
        <section className="space-y-3">
          <h3 className="text-xl font-semibold">コマンド</h3>
          <p className="text-base">
            {t('commands_desc')}
            <br />
            {getValues('commands')?.length ?? 0}
            {t('commands_desc_count')}
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" className="gap-1 px-3 shadow">
              <FilePlus2 />
              コマンド作成
            </Button>
            <Button variant="secondary" className="gap-1 px-3 shadow" asChild>
              <a
                href="https://ujiro99.github.io/selection-command/?utm_source=optionPage&utm_medium=button"
                target="_blank"
              >
                <Search />
                コマンドを探す
              </a>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-1 px-3 hover:bg-gray-200 shadow"
              onClick={() => setFolderDialogOpen(true)}
            >
              <FolderPlus />
              フォルダ作成
            </Button>
            <FolderUpsertDialog
              open={folderDialogOpen}
              onOpenChange={setFolderDialogOpen}
              onSubmit={(folder) => {
                commandUpsert(folder)
              }}
              folder={editDataRef.current as CommandFolder}
            />
          </div>
          <ul className="border-y" ref={commandsRef}>
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
                    <div className="h-14 pr-2 pl-0 flex-1 flex items-center">
                      <div className="flex-1 flex items-center overflow-hidden pr-2">
                        <img
                          src={field.content.iconUrl}
                          alt={field.content.title}
                          className="inline-block w-7 h-7 mr-3"
                        />
                        <div>
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
                        <CummandEditButton
                          onClick={() => commandEditorOpen(index)}
                        />
                        <CummandRemoveButton
                          command={field.content}
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
      </form>
    </Form>
  )
}

type SelectOptionType = {
  name: string
  value: string
}

type SelectFieldType = {
  control: any
  name: string
  formLabel: string
  options: SelectOptionType[]
}

const SelectField = ({
  control,
  name,
  formLabel,
  options,
}: SelectFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
          </div>
          <div className="w-4/6">
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Key" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem value={opt.value} key={opt.value}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
}

const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
}: InputFieldType) => {
  const type = inputProps.type

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
          </div>
          <div className="w-4/6 relative">
            {type === 'iconUrl' && !isEmpty(field.value) && (
              <img
                className="absolute top-[16%] left-[-11%] w-7 h-7 rounded"
                src={field.value}
                alt="folder icon's url"
              />
            )}
            <FormControl>
              <Input {...field} {...inputProps} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

type SwitchFieldType = {
  control: any
  name: string
  formLabel: string
  description?: string
}
const SwitchField = ({
  control,
  name,
  formLabel,
  description,
}: SwitchFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="w-4/6">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

type CummandEditButtonProps = {
  onClick: () => void
}
const CummandEditButton = ({ onClick }: CummandEditButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleClick = (e: React.SyntheticEvent) => {
    onClick()
    e.preventDefault()
  }
  return (
    <>
      <button
        ref={buttonRef}
        className="p-2 rounded-md transition hover:bg-sky-100 hover:scale-125 group"
        onClick={handleClick}
      >
        <Pencil
          className="stroke-gray-500 group-hover:stroke-sky-500"
          size={16}
        />
      </button>
      <Tooltip positionElm={buttonRef.current} text={'編集'} />
    </>
  )
}

type CummandRemoveButtonProps = {
  command: Command | CommandFolder
  onRemove: () => void
}
const CummandRemoveButton = ({
  command,
  onRemove,
}: CummandRemoveButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog>
      <DialogTrigger
        ref={buttonRef}
        className="p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group"
        asChild
      >
        <button>
          <Trash2
            className="stroke-gray-500 group-hover:stroke-red-500"
            size={16}
          />
        </button>
      </DialogTrigger>
      <Tooltip positionElm={buttonRef.current} text={'削除'} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>削除しますか？</DialogTitle>
        </DialogHeader>
        <DialogDescription className="flex items-center justify-center">
          <img
            src={command.iconUrl}
            alt={command.title}
            className="inline-block w-6 h-6 mr-2"
          />
          <span className="text-base">{command.title}</span>
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              やめる
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => onRemove()}
              variant="destructive"
            >
              削除する
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type FolderUpsertDialog = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (folder: CommandFolder) => void
  folder?: CommandFolder
}
const FolderUpsertDialog = ({
  open,
  onOpenChange,
  onSubmit,
  folder,
}: FolderUpsertDialog) => {
  const formSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    iconUrl: z.string().optional(),
    onlyIcon: z.boolean().optional(),
  })

  const DefaultValue = {
    id: '',
    title: '',
    iconUrl:
      'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png',
    onlyIcon: true,
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: DefaultValue,
  })

  useEffect(() => {
    form.reset(folder ?? DefaultValue)
  }, [folder])

  const isUpdate = folder != null
  const { register, reset } = form

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>✏️ フォルダの作成</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            フォルダの情報を入力してください。
          </DialogDescription>

          <Form {...form}>
            <form id="InputForm" className="space-y-4">
              <InputField
                control={form.control}
                name="title"
                formLabel="タイトル"
                inputProps={{
                  type: 'string',
                  ...register('title', {}),
                }}
              />
              <InputField
                control={form.control}
                name="iconUrl"
                formLabel="アイコンURL"
                inputProps={{
                  type: 'iconUrl',
                  ...register('iconUrl', {}),
                }}
              />
              <SwitchField
                control={form.control}
                name="onlyIcon"
                formLabel="アイコンのみ表示"
                description="※横並びのときのみ有効です。"
              />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                やめる
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                type="button"
                onClick={form.handleSubmit((data) => {
                  data.id = data.id ?? crypto.randomUUID()
                  onSubmit(data)
                  onOpenChange(false)
                  reset(DefaultValue)
                })}
              >
                {isUpdate ? '更新する' : '作成する'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
