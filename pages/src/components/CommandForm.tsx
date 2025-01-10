'use client'

import React, { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import clsx from 'clsx'
import {
  ChevronsUpDown,
  ChevronsDownUp,
  Send,
  Undo2,
  RotateCw,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Image } from '@/components/Image'
import { Tag } from '@/components/Tag'
import { useLocale } from '@/hooks/useLocale'
import { cmd2uuid, getSearchUrl } from '@/features/command'
import { isEmpty } from '@/lib/utils'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import type { CommandInJson, CommandInMessage, Tag as TagType } from '@/types'

import css from './CommandForm.module.css'

const formSchema = z.object({
  title: z.string().min(3, { message: 'min3' }).max(100, { message: 'max100' }),
  searchUrl: z
    .string()
    .url({ message: 'url' })
    .refine((url) => getSearchUrl().every((u) => u !== url), {
      message: 'unique',
    }),
  iconUrl: z.string().url({ message: 'url' }),
  openMode: z.nativeEnum(OPEN_MODE),
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

type FormValues = z.infer<typeof formSchema>
type FormKeys = keyof FormValues

const STORAGE_KEY = 'CommandShareFormData'

let onChagneSearchUrlTO = 0

const toMessages = (data: FormValues) => {
  const msgObj = toCommand(data)
  return `\`\`\`\n${JSON.stringify(msgObj, null, 2)}`
}

const toCommand = (data: FormValues): CommandInJson => {
  const tags = data.tags.map((t) => t.name)
  return {
    ...data,
    id: cmd2uuid(data),
    addedAt: new Date().toISOString(),
    tags,
  }
}

const enum STEP {
  INPUT,
  CONFIRM,
  SENDING,
  COMPLETE,
  ERROR,
}

const DefaultValue = {
  title: '',
  searchUrl: '',
  iconUrl: '',
  description: '',
  openMode: OPEN_MODE.POPUP,
  openModeSecondary: OPEN_MODE.TAB,
  spaceEncoding: SPACE_ENCODING.PLUS,
  tags: [],
}

export function CommandForm() {
  const [formData, setFormData] = useState<FormValues>({} as FormValues)
  const [step, setStep] = useState<STEP>(STEP.INPUT)

  const onInputSubmit = (values: FormValues) => {
    if (!values) return
    setFormData(values)
    setStep(STEP.CONFIRM)
  }

  const onConfirmSubmit = () => {
    setStep(STEP.SENDING)
    // Send data to Google Apps Script
    const url =
      'https://script.google.com/macros/s/AKfycbxhdkl8vb0mxDlKqiHlF1ND461sIVp7nenuKOuNP4Shq1xMgvWyRQsg5Dl2Z0eRnxE/exec'
    const submit = async () => {
      try {
        const ret = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors',
          body: JSON.stringify({
            title: formData.title,
            message: toMessages(formData),
          }),
        })
        console.debug(ret)
        // Clear localStorage after form submission
        sessionStorage.removeItem(STORAGE_KEY)
        setStep(STEP.COMPLETE)
      } catch (e) {
        console.error(e)
        setStep(STEP.ERROR)
      }
    }
    submit()
  }

  const onBack = () => {
    setStep(STEP.INPUT)
  }

  switch (step) {
    case STEP.INPUT:
      return <InputForm onFormSubmit={onInputSubmit} />
    case STEP.CONFIRM:
      return (
        <ConfirmForm
          data={formData}
          onBack={onBack}
          onFormSubmit={onConfirmSubmit}
        />
      )
    case STEP.SENDING:
      return <SendingForm />
    case STEP.COMPLETE:
      return <CompleteForm />
    case STEP.ERROR:
      return <ErrorForm />
    default:
      return null
  }
}

type InputProps = {
  onFormSubmit: (data: FormValues) => void
}

function InputForm(props: InputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [animation, setAnimation] = useState(false)
  const { lang, dict } = useLocale()
  const t = dict.inputForm

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: DefaultValue,
  })

  const { setValue } = form
  const searchUrl = form.getValues('searchUrl')
  const iconUrl = form.getValues('iconUrl')

  const { fields, append, remove } = useFieldArray({
    name: 'tags',
    control: form.control,
  })

  const onChagneSearchUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(onChagneSearchUrlTO)
    onChagneSearchUrlTO = window.setTimeout(() => {
      const sUrl = e.target.value
      const iUrl = form.getValues('iconUrl')
      if (isEmpty(iUrl) && !isEmpty(sUrl)) {
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

  const handleSubmit = (_data: FormValues) => {
    const data = {
      title: DOMPurify.sanitize(_data.title),
      searchUrl: DOMPurify.sanitize(_data.searchUrl),
      description: DOMPurify.sanitize(_data.description),
      iconUrl: DOMPurify.sanitize(_data.iconUrl),
      openMode: _data.openMode,
      openModeSecondary: _data.openModeSecondary,
      spaceEncoding: _data.spaceEncoding,
      tags: _data.tags,
    }
    props.onFormSubmit(data)
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
  }, [])

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
        onSubmit={form.handleSubmit(handleSubmit)}
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
                  <img
                    className="absolute top-1 right-2.5 w-7 h-7"
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

const Item = ({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) => (
  <div className="flex items-center min-h-7">
    <label className="w-2/6 text-sm font-medium">{label}</label>
    <div
      className={clsx(
        'w-4/6 font-[family-name:var(--font-geist-mono)] text-sm leading-relaxed overflow-x-auto whitespace-nowrap inline-block',
        valueClass,
      )}
    >
      <span>{value}</span>
    </div>
  </div>
)

const IconItem = ({ label, value }: { label: string; value: string }) => (
  <div className="relative">
    <img
      className="absolute top-[-2px] left-[27%] w-7 h-7 rounded"
      src={value}
      alt="Search url's favicon"
    />
    <Item label={label} value={value} />
  </div>
)

type TagName = Omit<TagType, 'id'>
const tagNames = (tags: TagName[]) => tags.map((t) => t.name).join(', ')

type ConfirmProps = {
  data: FormValues
  onFormSubmit: () => void
  onBack: () => void
}

function ConfirmForm(props: ConfirmProps) {
  const { dict } = useLocale()
  const t = dict.inputForm
  const t2 = dict.confirmForm
  return (
    <div id="ConfirmForm" className="overflow-auto">
      <DialogDescription className="text-stone-600">
        {t2.formDescription}
      </DialogDescription>

      <div className="mt-3 px-4 py-3 text-stone-800 bg-stone-200 rounded-xl">
        <Item label={t.title.label} value={props.data.title} />
        <Item label={t.searchUrl.label} value={props.data.searchUrl} />
        <Item
          label={t.description.label}
          value={props.data.description}
          valueClass="whitespace-break-spaces break-words"
        />
        <IconItem label={t.iconUrl.label} value={props.data.iconUrl} />
        <Item label={t.tags.label} value={tagNames(props.data.tags)} />
        <Item
          label={t.openMode.label}
          value={t.openMode.options[props.data.openMode]}
        />
        <Item
          label={t.openModeSecondary.label}
          value={t.openMode.options[props.data.openModeSecondary]}
        />
        <Item
          label={t.spaceEncoding.label}
          value={t.spaceEncoding.options[props.data.spaceEncoding]}
        />
      </div>
      <p className="mt-3 text-md text-center whitespace-break-spaces">
        {t2.caution}
      </p>
      <div className="mt-5 text-center">
        <Button
          className="rounded-xl font-semibold text-stone-700 bg-stone-300 hover:bg-stone-300/80"
          onClick={props.onBack}
          data-gtm-click="confirm-back"
        >
          <Undo2 />
          {t2.back}
        </Button>
        <Button
          type="submit"
          className="rounded-xl font-semibold bg-stone-700 ml-6"
          onClick={props.onFormSubmit}
        >
          <Send />
          {t2.submit}
        </Button>
      </div>
    </div>
  )
}

function SendingForm() {
  const t = useLocale().dict.SendingForm
  return (
    <div id="SendingForm" className="flex items-center justify-center flex-col">
      <DialogDescription className="text-stone-600">
        {t.sending}
      </DialogDescription>
      <Image
        src="/bars-scale-middle.svg"
        alt="Uploading..."
        width={30}
        height={30}
        className="opacity-60 my-5"
      />
    </div>
  )
}

function CompleteForm() {
  const { dict } = useLocale()
  const t = dict.completeForm
  return (
    <div id="CompleteForm">
      <DialogDescription className="text-stone-600 text-lg">
        {t.formDescription}
        <span className="ml-1 text-xl">🎉</span>
      </DialogDescription>
      <div className="flex items-center mt-3">
        <p
          className={clsx(
            'flex-1 bg-stone-200 rounded-2xl px-5 py-3 whitespace-break-spaces',
            css.triangle,
          )}
        >
          {t.thanks}
        </p>
        <Image
          src="/engineer_suit_simple.png"
          alt="Engineer"
          width={100}
          height={100}
          className="rounded-full bg-stone-200 ml-3 h-[100px]"
          style={
            {
              objectViewBox: 'inset(-5% 8% 47% 38%)',
            } as React.CSSProperties
          }
        />
      </div>
      <p className="mt-5 text-md">{t.aboudDelete}</p>
      <a
        className="underline text-sky-600"
        href="https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support"
        target="_brank"
        data-gtm-click="support-on-complete"
      >
        {t.supportHub}
      </a>
    </div>
  )
}

function ErrorForm() {
  const t = useLocale().dict.errorForm
  return (
    <div id="ErrorForm">
      <DialogDescription className="text-stone-600 text-lg">
        {t.formDescription}
      </DialogDescription>
      <div className="mt-3 gap-2 flex flex-col">
        <p className="text-md whitespace-break-spaces">{t.message}</p>
        <a
          className="underline text-sky-600"
          href="https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support"
          target="_brank"
          data-gtm-click="support-on-error"
        >
          {t.supportHub}
        </a>
      </div>
    </div>
  )
}
