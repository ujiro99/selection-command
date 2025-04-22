'use client'

import React, { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import DOMPurify from 'dompurify'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { ChevronsUpDown, ChevronsDownUp, Send, RotateCw, X } from 'lucide-react'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessageLocale,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DialogDescription } from '@/components/ui/dialog'
import { TagPicker } from '@/components/TagPicker'
import { Tag } from '@/components/Tag'
import { Image } from '@/components/Image'
import { Button } from '@/components/ui/button'
import { StepList } from '@/components/pageAction/StepList'

import { getSearchUrl } from '@/features/command'
import { isEmpty, isSearchCommand, isPageActionCommand } from '@/lib/utils'
import type { CommandInMessage } from '@/types'
import { PageActionOption } from '@/types/schema'
import { OPEN_MODE, SPACE_ENCODING, PAGE_ACTION_OPEN_MODE } from '@/const'
import { useLocale } from '@/hooks/useLocale'

import css from './CommandForm.module.css'

const searchCommandSchema = z.object({
  title: z.string().min(3, { message: 'min3' }).max(100, { message: 'max100' }),
  searchUrl: z
    .string()
    .url({ message: 'url' })
    .refine((url) => getSearchUrl().every((u) => u !== url), {
      message: 'unique',
    }),
  iconUrl: z.string().url({ message: 'url' }),
  openMode: z.enum([OPEN_MODE.POPUP, OPEN_MODE.TAB, OPEN_MODE.WINDOW]),
  openModeSecondary: z.nativeEnum(OPEN_MODE),
  spaceEncoding: z.nativeEnum(SPACE_ENCODING),
  description: z.string().max(200, {
    message: 'max200',
  }),
  tags: z
    .array(
      z.object({
        tagId: z.string(),
        name: z.string().max(20, {
          message: 'max20',
        }),
      }),
    )
    .max(5, {
      message: 'max5',
    }),
})

const pageActionSchema = z.object({
  title: z.string().min(3, { message: 'min3' }).max(100, { message: 'max100' }),
  iconUrl: z.string().url({ message: 'url' }),
  openMode: z.literal(OPEN_MODE.PAGE_ACTION),
  description: z.string().max(200, {
    message: 'max200',
  }),
  tags: z
    .array(
      z.object({
        tagId: z.string(),
        name: z.string().max(20, {
          message: 'max20',
        }),
      }),
    )
    .max(5, {
      message: 'max5',
    }),
  pageActionOption: PageActionOption,
})

const formSchema = z.discriminatedUnion('openMode', [
  searchCommandSchema,
  pageActionSchema,
])

export type FormValues = z.infer<typeof formSchema>
type FormKeys = keyof FormValues

export type PageActionOptionType = z.infer<typeof PageActionOption>

const DefaultValue = {
  title: '',
  searchUrl: '',
  iconUrl: '',
  description: '',
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  spaceEncoding: SPACE_ENCODING.PLUS,
  tags: [],
  PageActionOption: {
    startUrl: '',
    openMode: PAGE_ACTION_OPEN_MODE.POPUP,
    steps: [],
  },
}

const SEARCH_MODE = [OPEN_MODE.POPUP, OPEN_MODE.TAB, OPEN_MODE.WINDOW]

const STORAGE_KEY = 'CommandShareFormData'

let onChagneSearchUrlTO = 0

type InputProps = {
  onFormSubmit: (data: FormValues) => void
}

export function InputForm(props: InputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [animation, setAnimation] = useState(false)
  const { lang, dict } = useLocale()
  const t = dict.inputForm

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: DefaultValue,
  })

  const { setValue, getValues } = form
  const searchUrl = getValues('searchUrl')
  const iconUrl = getValues('iconUrl')

  const openMode = useWatch({
    control: form.control,
    name: 'openMode',
    defaultValue: OPEN_MODE.POPUP,
  })

  const pageActionSteps = useWatch({
    control: form.control,
    name: 'pageActionOption.steps',
    defaultValue: [],
  })

  const { fields, append, remove } = useFieldArray({
    name: 'tags',
    control: form.control,
  })

  const onChagneSearchUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(onChagneSearchUrlTO)
    onChagneSearchUrlTO = window.setTimeout(() => {
      const sUrl = e.target.value
      if (isEmpty(iconUrl) && !isEmpty(sUrl)) {
        findIconUrl(sUrl)
      }
    }, 1000)
  }

  const onChagneIconUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmpty(e.target.value)) {
      form.resetField('iconUrl')
    }
  }

  const findIconUrl = (_url?: string) => {
    const url = _url ?? searchUrl
    form.setValue(
      'iconUrl',
      `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`,
    )
    form.trigger('iconUrl')
  }

  const sanitizePageActionOption = (option: PageActionOptionType) => {
    const steps = option.steps.map((step) => {
      if ((step.param as any).value != null) {
        return {
          ...step,
          param: {
            ...step.param,
            label: DOMPurify.sanitize(step.param.label),
            value: DOMPurify.sanitize((step.param as any).value),
          },
        }
      }
      return step
    })
    return {
      ...option,
      startUrl: DOMPurify.sanitize(option.startUrl),
      steps,
    }
  }

  const handleSubmit = (_data: FormValues) => {
    const isSearch = isSearchCommand(_data)
    const isPageAction = isPageActionCommand(_data)
    const data = isSearch
      ? {
          title: DOMPurify.sanitize(_data.title),
          searchUrl: DOMPurify.sanitize(_data.searchUrl),
          description: DOMPurify.sanitize(_data.description),
          iconUrl: DOMPurify.sanitize(_data.iconUrl),
          openMode: _data.openMode,
          openModeSecondary: _data.openModeSecondary,
          spaceEncoding: _data.spaceEncoding,
          tags: _data.tags,
        }
      : isPageAction
        ? {
            title: DOMPurify.sanitize(_data.title),
            description: DOMPurify.sanitize(_data.description),
            iconUrl: DOMPurify.sanitize(_data.iconUrl),
            openMode: _data.openMode,
            tags: _data.tags,
            pageActionOption: sanitizePageActionOption(_data.pageActionOption),
          }
        : null
    if (data != null) {
      props.onFormSubmit(data as FormValues)
    } else {
      console.error('Invalid data')
    }
  }

  const autofillProps = (index: number, cls: string) => {
    if (!animation)
      return {
        className: cls,
      }
    return {
      className: clsx('autofill', cls),
      style: {
        '--autofill-animation-delay': `${index * 20}ms`,
      } as React.CSSProperties,
    }
  }

  useEffect(() => {
    // Resotre form data from localStorage
    const data = sessionStorage.getItem(STORAGE_KEY)
    if (data) {
      const savedData = JSON.parse(data)
      if (savedData) {
        Object.keys(savedData).forEach((key) => {
          setValue(key as FormKeys, savedData[key])
        })
      }
    }
  }, [setValue])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data.action === 'InsertCommand'
      ) {
        const cmd = event.data.data as CommandInMessage
        const params = [
          'title',
          'searchUrl',
          'iconUrl',
          'openMode',
          'openModeSecondary',
          'spaceEncoding',
          'pageActionOption',
        ] as (keyof CommandInMessage)[]
        params.forEach((key) => {
          setValue(key as FormKeys, cmd[key] ?? DefaultValue[key])
        })
        form.trigger(params)
        setAnimation(true)
        setTimeout(() => setAnimation(false), 300)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [form, setValue])

  form.watch((data: any) => {
    if (!data.title && !data.searchUrl) {
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  })

  return (
    <Form {...form}>
      <DialogDescription className="text-stone-600">
        {t.formDescription}
      </DialogDescription>
      {/* Content inserted by Chrome extension */}
      <div id="MyCommands" className="hidden overflow-hidden" />
      <form
        id="InputForm"
        className="space-y-3 mt-4"
        onSubmit={form.handleSubmit(handleSubmit, (err) => console.error(err))}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <div className="w-2/5">
                <FormLabel>{t.title.label}</FormLabel>
                <FormDescription className="leading-tight">
                  {t.title.description}
                </FormDescription>
              </div>
              <div {...autofillProps(0, 'w-3/5 rounded-md')}>
                <FormControl>
                  <Input placeholder="Title of command" {...field} />
                </FormControl>
                <FormMessageLocale lang={lang} />
              </div>
            </FormItem>
          )}
        />

        {SEARCH_MODE.includes(openMode) && (
          <FormField
            control={form.control}
            name="searchUrl"
            render={({ field }) => (
              <FormItem
                className="flex items-center"
                onChange={onChagneSearchUrl}
              >
                <div className="w-2/5">
                  <FormLabel>{t.searchUrl.label}</FormLabel>
                  <FormDescription className="leading-tight">
                    {t.searchUrl.description}
                  </FormDescription>
                </div>
                <div {...autofillProps(1, 'w-3/5 rounded-md relative')}>
                  {!isEmpty(iconUrl) && (
                    <Image
                      className="absolute top-1.5 right-2 w-6 h-6"
                      src={iconUrl}
                      alt="Search url's favicon"
                    />
                  )}
                  <FormControl>
                    <Input
                      className="pr-10"
                      placeholder="Search URL"
                      {...field}
                    />
                  </FormControl>
                  <FormMessageLocale lang={lang} />
                </div>
              </FormItem>
            )}
          />
        )}

        {openMode === OPEN_MODE.PAGE_ACTION && (
          <>
            <FormField
              control={form.control}
              name="pageActionOption.startUrl"
              render={({ field }) => (
                <FormItem className="flex items-center">
                  <div className="w-2/5">
                    <FormLabel>{t.PageActionOption.startUrl.label}</FormLabel>
                    <FormDescription className="leading-tight">
                      {t.PageActionOption.startUrl.description}
                    </FormDescription>
                  </div>
                  <div {...autofillProps(1, 'w-3/5 rounded-md relative')}>
                    {!isEmpty(iconUrl) && (
                      <Image
                        className="absolute top-1.5 right-2 w-6 h-6"
                        src={iconUrl}
                        alt="Start url's favicon"
                      />
                    )}
                    <FormControl>
                      <Input
                        className="pr-10"
                        placeholder="Start URL"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessageLocale lang={lang} />
                  </div>
                </FormItem>
              )}
            />
            <div>
              <div>
                <FormLabel>{t.pageAction.label}</FormLabel>
                <FormDescription className="leading-tight">
                  {t.pageAction.description}
                </FormDescription>
              </div>
              <StepList className="py-3" steps={pageActionSteps} />
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <div className="w-2/5">
                <FormLabel>{t.description.label}</FormLabel>
                <FormDescription className="leading-tight">
                  {t.description.description}
                </FormDescription>
              </div>
              <div className="w-3/5">
                <FormControl>
                  <Textarea
                    placeholder="Command description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessageLocale lang={lang} />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem className="flex items-center">
              <div className="w-2/5">
                <FormLabel>{t.tags.label}</FormLabel>
                <FormDescription className="leading-tight">
                  {t.tags.description}
                </FormDescription>
              </div>
              <div className="w-3/5">
                <FormControl>
                  <ul className="flex gap-1.5 flex-wrap">
                    {fields.map((field, index) => (
                      <li key={field.id}>
                        <button
                          className="group flex items-center relative"
                          onClick={() => remove(index)}
                        >
                          <Tag className="py-1" tag={field} />
                          <X
                            size={16}
                            className="absolute right-[3px] bg-white rounded-full p-0.5 hidden group-hover:inline"
                          />
                        </button>
                      </li>
                    ))}
                    {fields.length < 5 && (
                      <TagPicker
                        containerRef={containerRef}
                        onSelect={(tag) =>
                          append({
                            tagId: tag.id,
                            name: tag.name,
                          })
                        }
                        excludeIds={fields.map((f) => f.tagId)}
                      />
                    )}
                  </ul>
                </FormControl>
                <FormMessageLocale lang={lang} />
              </div>
            </FormItem>
          )}
        />

        <div ref={containerRef} />

        <Collapsible className={clsx(css.collapse, 'flex flex-col items-end')}>
          <CollapsibleTrigger className="flex items-center hover:bg-stone-200 px-1.5 py-1 rounded-lg">
            <ChevronsUpDown size={18} className={css.iconUpDown} />
            <ChevronsDownUp size={18} className={css.iconDownUp} />
            <span className="ml-0.5">{t.formOptions}</span>
          </CollapsibleTrigger>
          <CollapsibleContent
            id="InputForm_Options"
            className={clsx(css.CollapsibleContent, 'w-full space-y-3 pt-2')}
          >
            <FormField
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <FormItem
                  className="flex items-center"
                  onChange={onChagneIconUrl}
                >
                  <div className="w-2/5">
                    <FormLabel>{t.iconUrl.label}</FormLabel>
                    <FormDescription className="leading-tight">
                      {t.iconUrl.description}
                    </FormDescription>
                  </div>

                  <div {...autofillProps(2, 'w-3/5 rounded-md relative')}>
                    <FormControl>
                      <Input placeholder="Icon URL" {...field} />
                    </FormControl>
                    {isEmpty(iconUrl) && !isEmpty(searchUrl) && (
                      <Button
                        onClick={() => findIconUrl()}
                        className="absolute gap-1.5 top-1 right-1 px-2.5 h-7 bg-stone-500 rounded-lg"
                      >
                        <RotateCw size={28} />
                        <span className="font-medium">Detect</span>
                      </Button>
                    )}
                    <FormMessageLocale lang={lang} />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openMode"
              render={({ field }) => (
                <FormItem className="flex items-center">
                  <div className="w-2/5">
                    <FormLabel>{t.openMode.label}</FormLabel>
                    <FormDescription className="leading-tight">
                      {t.openMode.description}
                    </FormDescription>
                  </div>
                  <div {...autofillProps(3, 'w-3/5 rounded-md relative')}>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={openMode === OPEN_MODE.PAGE_ACTION}
                    >
                      <FormControl>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select a OpenMode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {Object.values(OPEN_MODE).map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {t.openMode.options[mode]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessageLocale lang={lang} />
                  </div>
                </FormItem>
              )}
            />

            {SEARCH_MODE.includes(openMode) && (
              <>
                <FormField
                  control={form.control}
                  name="openModeSecondary"
                  render={({ field }) => (
                    <FormItem className="flex items-center">
                      <div className="w-2/5">
                        <FormLabel>{t.openModeSecondary.label}</FormLabel>
                        <FormDescription className="leading-tight">
                          {t.openModeSecondary.description}
                        </FormDescription>
                      </div>
                      <div {...autofillProps(4, 'w-3/5 rounded-md relative')}>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="">
                              <SelectValue placeholder="Select a openMode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value={OPEN_MODE.POPUP}>
                                {t.openMode.options.popup}
                              </SelectItem>
                              <SelectItem value={OPEN_MODE.TAB}>
                                {t.openMode.options.tab}
                              </SelectItem>
                              <SelectItem value={OPEN_MODE.WINDOW}>
                                {t.openMode.options.window}
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessageLocale lang={lang} />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spaceEncoding"
                  render={({ field }) => (
                    <FormItem className="flex items-center">
                      <div className="w-2/5">
                        <FormLabel>{t.spaceEncoding.label}</FormLabel>
                        <FormDescription className="leading-tight">
                          {t.spaceEncoding.description}
                        </FormDescription>
                      </div>

                      <div {...autofillProps(5, 'w-3/5 rounded-md relative')}>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="">
                              <SelectValue placeholder="Select a space encoding" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value={SPACE_ENCODING.PLUS}>
                                {t.spaceEncoding.options.plus}
                              </SelectItem>
                              <SelectItem value={SPACE_ENCODING.PERCENT}>
                                {t.spaceEncoding.options.percent}
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessageLocale lang={lang} />
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
        <div className="pt-3 text-center">
          <Button
            type="submit"
            className="rounded-xl font-semibold bg-stone-700"
          >
            <Send /> {t.confirm}
          </Button>
        </div>
      </form>
    </Form>
  )
}
