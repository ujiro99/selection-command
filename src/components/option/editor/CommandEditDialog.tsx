import { useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Save, SquareTerminal } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
} from '@/components/ui/dialog'

import {
  FormControl,
  FormMessage,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'

import { Input } from '@/components/ui/input'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/option/field/InputField'
import { SelectField } from '@/components/option/field/SelectField'
import { TextareaField } from '@/components/option/field/TextareaField'
import {
  OPEN_MODE,
  SPACE_ENCODING,
  POPUP_OPTION,
  COPY_OPTION,
  ROOT_FOLDER,
} from '@/const'
import { isEmpty, isUrl, e2a } from '@/lib/utils'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { fetchIconUrl } from '@/services/chrome'
import type { SelectionCommand, CommandFolder } from '@/types'

const SearchOpenMode = [
  OPEN_MODE.POPUP,
  OPEN_MODE.TAB,
  OPEN_MODE.WINDOW,
] as const

const searchSchema = z.object({
  openMode: z.enum(SearchOpenMode),
  id: z.string(),
  title: z.string().min(1, { message: t('zod_string_min', ['1']) }),
  iconUrl: z.string().url({ message: t('zod_url') }),
  searchUrl: z.string().url({ message: t('zod_url') }),
  parentFolderId: z.string().optional(),
  openModeSecondary: z.enum(SearchOpenMode),
  spaceEncoding: z.nativeEnum(SPACE_ENCODING),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
})

type SearchType = z.infer<typeof searchSchema>

const isSearchType = (data: any): data is SearchType => {
  return SearchOpenMode.includes(data.openMode)
}

const apiSchema = z.object({
  openMode: z.literal(OPEN_MODE.API),
  id: z.string(),
  title: z.string().min(1, { message: t('zod_string_min', ['1']) }),
  iconUrl: z.string().url({ message: t('zod_url') }),
  searchUrl: z.string().url({ message: t('zod_url') }),
  parentFolderId: z.string().optional(),
  fetchOptions: z.string().optional(),
  variables: z
    .array(
      z.object({
        name: z.string({ message: t('zod_string_min', ['1']) }),
        value: z.string({ message: t('zod_string_min', ['1']) }),
      }),
    )
    .optional(),
})

const linkPopupSchema = z.object({
  openMode: z.enum([OPEN_MODE.LINK_POPUP]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Link Popup'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .default(
      'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png',
    ),
})

const copySchema = z.object({
  openMode: z.enum([OPEN_MODE.COPY]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Copy text'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .default(
      'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png',
    ),
  copyOption: z.nativeEnum(COPY_OPTION).default(COPY_OPTION.DEFAULT),
})

const textStyleSchema = z.object({
  openMode: z.enum([OPEN_MODE.GET_TEXT_STYLES]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Get Text Styles'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .default(
      'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png',
    ),
})

export const commandSchema = z.discriminatedUnion('openMode', [
  searchSchema,
  apiSchema,
  linkPopupSchema,
  copySchema,
  textStyleSchema,
])

const EmptyFolder = {
  id: ROOT_FOLDER,
  title: t('Command_rootFolder'),
} as CommandFolder

const defaultValue = (openMode: OPEN_MODE) => {
  if (SearchOpenMode.includes(openMode as any)) {
    return {
      id: '',
      title: '',
      searchUrl: '',
      iconUrl: '',
      openMode: OPEN_MODE.POPUP as const,
      openModeSecondary: OPEN_MODE.TAB as const,
      spaceEncoding: SPACE_ENCODING.PLUS,
      parentFolderId: ROOT_FOLDER,
      popupOption: {
        width: POPUP_OPTION.width,
        height: POPUP_OPTION.height,
      },
    }
  }
  if (openMode === OPEN_MODE.API) {
    return {
      id: '',
      title: '',
      searchUrl: '',
      iconUrl: '',
      openMode: OPEN_MODE.API as const,
      fetchOptions: '',
      variables: [],
      parentFolderId: ROOT_FOLDER,
    }
  }
  if (openMode === OPEN_MODE.LINK_POPUP) {
    return {
      id: '',
      title: 'Link Popup',
      iconUrl:
        'https://cdn3.iconfinder.com/data/icons/fluent-regular-24px-vol-5/24/ic_fluent_open_24_regular-1024.png',
      openMode: OPEN_MODE.LINK_POPUP as const,
      parentFolderId: ROOT_FOLDER,
    }
  }
  if (openMode === OPEN_MODE.COPY) {
    return {
      id: '',
      title: 'Copy text',
      iconUrl:
        'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png',
      openMode: OPEN_MODE.COPY as const,
      copyOption: COPY_OPTION.DEFAULT,
      parentFolderId: ROOT_FOLDER,
    }
  }
  if (openMode === OPEN_MODE.GET_TEXT_STYLES) {
    return {
      id: '',
      title: 'Get Text Styles',
      iconUrl:
        'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png',
      openMode: OPEN_MODE.GET_TEXT_STYLES as const,
      parentFolderId: ROOT_FOLDER,
    }
  }
}

type CommandEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (command: SelectionCommand) => void
  folders: CommandFolder[]
  command?: SelectionCommand
}

export const CommandEditDialog = ({
  open,
  onOpenChange,
  onSubmit,
  folders,
  command,
}: CommandEditDialogProps) => {
  const preOpenModeRef = useRef(command?.openMode ?? OPEN_MODE.POPUP)
  const fetchIconTO = useRef(0)

  const form = useForm<z.infer<typeof commandSchema>>({
    resolver: zodResolver(commandSchema),
    mode: 'onChange',
    defaultValues: defaultValue(OPEN_MODE.POPUP),
  })
  const { register, reset, getValues, setValue, clearErrors, watch } = form

  const searchUrl = watch('searchUrl')
  const isUpdate = command != null

  const variableArray = useFieldArray({
    name: 'variables',
    control: form.control,
    keyName: '_id',
  })

  const openMode = useWatch({
    control: form.control,
    name: 'openMode',
    defaultValue: OPEN_MODE.POPUP,
  })

  useEffect(() => {
    if (command != null) {
      if (isEmpty(command.parentFolderId)) {
        command.parentFolderId = ROOT_FOLDER
      }
      reset((command as any) ?? defaultValue(OPEN_MODE.POPUP))
    } else {
      setTimeout(() => {
        reset(defaultValue(OPEN_MODE.POPUP))
      }, 100)
    }
  }, [command])

  useEffect(() => {
    if (
      SearchOpenMode.includes(openMode as any) &&
      SearchOpenMode.includes(preOpenModeRef.current as any)
    ) {
      return
    }
    if (command?.openMode === openMode) return
    reset(defaultValue(openMode))
    preOpenModeRef.current = openMode
  }, [openMode])

  useEffect(() => {
    if (isEmpty(searchUrl) || !isUrl(searchUrl)) return

    // debounce
    clearTimeout(fetchIconTO.current)
    fetchIconTO.current = window.setTimeout(async () => {
      const iconUrl = await fetchIconUrl(searchUrl)
      const currentSearchUrl = getValues('searchUrl')
      if (currentSearchUrl != searchUrl) return
      setValue('iconUrl', iconUrl)
      clearErrors('iconUrl')
    }, 500)

    return () => clearTimeout(fetchIconTO.current)
  }, [searchUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <SquareTerminal />
              {t('Command_edit')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>{t('Command_input')}</DialogDescription>
          <Form {...form}>
            <form id="CommandEditForm" className="space-y-2">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <input
                        {...register('id', { value: field.value })}
                        type="hidden"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <InputField
                control={form.control}
                name="title"
                formLabel={t('title')}
                inputProps={{
                  type: 'string',
                  ...register('title', {}),
                }}
              />

              <SelectField
                control={form.control}
                name="openMode"
                formLabel="Open Mode"
                options={e2a(OPEN_MODE)
                  .filter(
                    (mode) =>
                      mode !== OPEN_MODE.ADD_PAGE_RULE &&
                      mode !== OPEN_MODE.OPTION,
                  )
                  .map((mode) => ({
                    name: t(`openMode_${mode}`),
                    value: mode,
                  }))}
              />

              {SearchOpenMode.includes(openMode as any) && (
                <SelectField
                  control={form.control}
                  name="openModeSecondary"
                  formLabel={t('openModeSecondary')}
                  options={SearchOpenMode.map((mode) => ({
                    name: t(`openMode_${mode}`),
                    value: mode,
                  }))}
                />
              )}

              {(SearchOpenMode.includes(openMode as any) ||
                openMode === OPEN_MODE.API) && (
                <InputField
                  control={form.control}
                  name="searchUrl"
                  formLabel={t('searchUrl')}
                  inputProps={{
                    type: 'string',
                    ...register('searchUrl', {}),
                  }}
                />
              )}

              <InputField
                control={form.control}
                name="iconUrl"
                formLabel={t('iconUrl')}
                inputProps={{
                  type: 'iconUrl',
                  ...register('iconUrl', {}),
                }}
              />

              <SelectField
                control={form.control}
                name="parentFolderId"
                formLabel={t('parentFolderId')}
                options={[EmptyFolder, ...folders].map((folder) => ({
                  name: folder.title,
                  value: folder.id,
                  iconUrl: folder.iconUrl,
                }))}
              />

              {SearchOpenMode.includes(openMode as any) && (
                <SelectField
                  control={form.control}
                  name="spaceEncoding"
                  formLabel={t('spaceEncoding')}
                  options={e2a(SPACE_ENCODING).map((enc) => ({
                    name: t(`spaceEncoding_${enc}`),
                    value: enc,
                  }))}
                />
              )}

              {openMode === OPEN_MODE.API && (
                <>
                  <TextareaField
                    control={form.control}
                    name="fetchOptions"
                    formLabel={t('fetchOptions')}
                  />
                  <FormField
                    control={form.control}
                    name="variables"
                    render={() => (
                      <FormItem className="flex items-center">
                        <div className="w-2/6">
                          <FormLabel>{t('variables')}</FormLabel>
                        </div>
                        <div className="w-4/6">
                          <FormControl>
                            <ul className="">
                              {variableArray.fields.map((field, index) => (
                                <li
                                  key={field._id}
                                  className="flex items-center gap-2 p-1"
                                >
                                  <FormField
                                    control={form.control}
                                    name={`variables.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-1 w-1/2">
                                        <FormLabel className="text-xs text-right">
                                          {t('variableName')}
                                        </FormLabel>
                                        <FormControl className="flex-1">
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`variables.${index}.value`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-1 w-1/2">
                                        <FormLabel className="text-xs text-right">
                                          {t('variableValue')}
                                        </FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <button
                                    type="button"
                                    className="group transition p-1.5 flex-none rounded-lg hover:bg-red-200 hover:scale-[1.1]"
                                    onClick={() => variableArray.remove(index)}
                                  >
                                    <Trash2
                                      className="stroke-gray-500 group-hover:stroke-red-500"
                                      size={16}
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </FormControl>
                          <Button
                            type="button"
                            variant="secondary"
                            className="relative mt-1 rounded-lg h-7 left-[50%] translate-x-[-50%]"
                            onClick={() =>
                              variableArray.append({
                                name: '',
                                value: '',
                              })
                            }
                          >
                            <Plus />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {openMode === OPEN_MODE.COPY && (
                <SelectField
                  control={form.control}
                  name="copyOption"
                  formLabel={t('copyOption')}
                  options={e2a(COPY_OPTION).map((opt) => ({
                    name: t(`copyOption_${opt}`),
                    value: opt,
                  }))}
                />
              )}
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="lg">
                {t('labelCancel')}
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="lg"
              onClick={form.handleSubmit(
                (data) => {
                  if (isEmpty(data.id)) data.id = crypto.randomUUID()
                  if (data.parentFolderId === ROOT_FOLDER) {
                    data.parentFolderId = undefined
                  }
                  if (isSearchType(data)) {
                    if (data.popupOption != null) {
                      data.popupOption = {
                        width: Number(data.popupOption.width),
                        height: Number(data.popupOption.height),
                      }
                    }
                  }
                  onSubmit(data)
                  onOpenChange(false)
                  reset(defaultValue(OPEN_MODE.POPUP))
                },
                (err) => console.error(err),
              )}
            >
              <Save />
              {isUpdate ? t('labelUpdate') : t('labelSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
