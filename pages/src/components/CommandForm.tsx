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
  FormMessage,
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

import { cmd2uuid, getSearchUrl } from '@/features/command'
import { isEmpty } from '@/lib/utils'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'
import type { CommandInJson, Tag as TagType } from '@/types'

import css from './CommandForm.module.css'

const formSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: 'タイトルは最短3文字です',
    })
    .max(100, {
      message: 'タイトルは最長100文字です',
    }),
  searchUrl: z
    .string()
    .url()
    .refine((url) => getSearchUrl().every((u) => u !== url), {
      message: '検索URLが既に登録されています',
    }),
  iconUrl: z.string().url(),
  openMode: z.nativeEnum(OPEN_MODE),
  openModeSecondary: z.nativeEnum(OPEN_MODE),
  spaceEncoding: z.nativeEnum(SPACE_ENCODING),
  description: z.string().max(200, {
    message: '説明は最長200文字です',
  }),
  tags: z
    .array(
      z.object({
        tagId: z.string(),
        name: z.string().max(20, {
          message: 'タグは最長20文字です',
        }),
      }),
    )
    .max(5, {
      message: 'タグは最大5つまでです',
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      searchUrl: '',
      iconUrl: '',
      description: '',
      openMode: OPEN_MODE.POPUP,
      openModeSecondary: OPEN_MODE.TAB,
      spaceEncoding: SPACE_ENCODING.PLUS,
      tags: [],
    },
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

  form.watch((data: any) => {
    if (!data.title && !data.searchUrl) {
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  })

  return (
    <Form {...form}>
      <DialogDescription className="text-stone-600">
        コマンドの共有を申請します。
      </DialogDescription>
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
                <FormLabel>タイトル</FormLabel>
                <FormDescription className="leading-tight">
                  コマンドのタイトルとして表示されます。
                </FormDescription>
              </div>
              <div className="w-3/5">
                <FormControl>
                  <Input placeholder="Title of command" {...field} />
                </FormControl>
                <FormMessage />
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
                <FormLabel>検索URL</FormLabel>
                <FormDescription className="leading-tight">
                  `%s`を選択テキストに置換します。
                </FormDescription>
              </div>
              <div className="w-3/5 relative">
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
                <FormMessage />
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
                <FormLabel>コマンドの説明</FormLabel>
                <FormDescription className="leading-tight">
                  コマンドの説明として表示されます。
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
                <FormMessage />
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
                <FormLabel>タグ</FormLabel>
                <FormDescription className="leading-tight">
                  コマンドの分類として表示されます。
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
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div ref={containerRef} />

        <Collapsible className={clsx(css.collapse, 'flex flex-col items-end')}>
          <CollapsibleTrigger className="flex items-center hover:bg-stone-200 px-1.5 py-1 rounded-lg">
            <ChevronsUpDown size={18} className={css.iconUpDown} />
            <ChevronsDownUp size={18} className={css.iconDownUp} />
            <span className="ml-0.5">オプション</span>
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
                    <FormLabel>アイコンURL</FormLabel>
                    <FormDescription className="leading-tight">
                      メニューのアイコンとして表示されます。
                    </FormDescription>
                  </div>
                  <div className="w-3/5 relative">
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
                    <FormMessage />
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
                    <FormLabel>OpenMode</FormLabel>
                    <FormDescription className="leading-tight">
                      結果の表示方法です。
                    </FormDescription>
                  </div>
                  <div className="w-3/5 pr-[1px]">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select a openMode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={OPEN_MODE.POPUP}>Popup</SelectItem>
                          <SelectItem value={OPEN_MODE.WINDOW}>
                            Window
                          </SelectItem>
                          <SelectItem value={OPEN_MODE.TAB}>Tab</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                    <FormLabel>Ctrl + クリック</FormLabel>
                    <FormDescription className="leading-tight">
                      Ctrl + クリック時の表示方法です。
                    </FormDescription>
                  </div>
                  <div className="w-3/5 pr-[1px]">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select a openMode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={OPEN_MODE.POPUP}>Popup</SelectItem>
                          <SelectItem value={OPEN_MODE.WINDOW}>
                            Window
                          </SelectItem>
                          <SelectItem value={OPEN_MODE.TAB}>Tab</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                    <FormLabel>スペースのエンコード</FormLabel>
                    <FormDescription className="leading-tight">
                      選択テキスト中のスペースを置換します。
                    </FormDescription>
                  </div>
                  <div className="w-3/5 pr-[1px]">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select a space encoding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={SPACE_ENCODING.PLUS}>
                            Plus (+)
                          </SelectItem>
                          <SelectItem value={SPACE_ENCODING.PERCENT}>
                            Percent (%20)
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>
        <div className="pt-2 text-center">
          <Button
            type="submit"
            className="rounded-xl font-semibold bg-stone-700"
          >
            <Send /> 入力内容を確認する
          </Button>
        </div>
      </form>
    </Form>
  )
}

const Item = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center">
    <label className="w-2/6 text-sm font-medium">{label}</label>
    <div className="w-4/6 font-[family-name:var(--font-geist-mono)] text-sm leading-relaxed overflow-x-auto whitespace-nowrap inline-block">
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
  return (
    <div id="ConfirmForm" className="overflow-auto">
      <DialogDescription className="text-stone-600">
        以下の内容で間違いありませんか？
      </DialogDescription>

      <div className="mt-3 px-4 py-3 text-stone-800 bg-stone-200 rounded-xl">
        <Item label="タイトル" value={props.data.title} />
        <Item label="検索URL" value={props.data.searchUrl} />
        <Item label="コマンドの説明" value={props.data.description} />
        <IconItem label="アイコンURL" value={props.data.iconUrl} />
        <Item label="タグ" value={tagNames(props.data.tags)} />
        <Item label="OpenMode" value={props.data.openMode} />
        <Item label="Ctrl + クリック" value={props.data.openModeSecondary} />
        <Item label="スペースのエンコード" value={props.data.spaceEncoding} />
      </div>
      <p className="mt-3 text-md text-center">
        ※送信された情報は本サイト上で公開されます。
        <br />
        個人情報や機密情報を含む情報の共有はお控えください。
      </p>
      <div className="mt-5 text-center">
        <Button
          className="rounded-xl font-semibold  text-stone-700 bg-stone-300 hover:bg-stone-300/80"
          onClick={props.onBack}
          data-gtm-click="confirm-back"
        >
          <Undo2 />
          修正する
        </Button>
        <Button
          type="submit"
          className="rounded-xl font-semibold bg-stone-700 ml-6"
          onClick={props.onFormSubmit}
        >
          <Send /> 共有実行
        </Button>
      </div>
    </div>
  )
}

function SendingForm() {
  return (
    <div id="SendingForm" className="flex items-center justify-center flex-col">
      <DialogDescription className="text-stone-600">
        送信中...
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
  return (
    <div id="CompleteForm">
      <DialogDescription className="text-stone-600 text-lg">
        送信が完了しました<span className="ml-1 text-xl">🎉</span>
      </DialogDescription>
      <div className="flex items-center mt-3">
        <p
          className={clsx(
            'flex-1 bg-stone-200 rounded-2xl px-5 py-3',
            css.triangle,
          )}
        >
          コマンドを共有して頂きありがとうございます！
          <br />
          開発者がサイトに反映するまで2〜3日かかる場合がございます。
          <br />
          公開まで、今しばらくお待ちください。
          <br />
        </p>
        <Image
          src="/engineer_suit_simple.png"
          alt="Engineer"
          width={100}
          height={100}
          className="rounded-full bg-stone-200 ml-3 h-[100px]"
          style={
            {
              objectViewBox: 'inset(-5px 12px 65px 52px)',
            } as React.CSSProperties
          }
        />
      </div>
      <p className="mt-5 text-md">
        申請後の削除のご要望は、こちらのリンクよりお願いします。
      </p>
      <a
        className="underline text-sky-600"
        href="https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support"
        target="_brank"
        data-gtm-click="support-on-complete"
      >
        サポートハブへ
      </a>
    </div>
  )
}

function ErrorForm() {
  return (
    <div id="ErrorForm">
      <DialogDescription className="text-stone-600 text-lg">
        送信エラーが発生しました⋯<span className="ml-1 text-xl"></span>
      </DialogDescription>
      <div className="mt-3 gap-2 flex flex-col">
        <p className="text-md">
          時間をおいて再度お試し頂くか、
          以下のリンクから開発者までお問い合わせください。
        </p>
        <a
          className="underline text-sky-600"
          href="https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support"
          target="_brank"
          data-gtm-click="support-on-error"
        >
          サポートハブへ
        </a>
      </div>
    </div>
  )
}
