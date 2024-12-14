'use client'

import React, { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import clsx from 'clsx'

import { ChevronsUpDown, ChevronsDownUp, Send, RotateCw } from 'lucide-react'

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
  SelectLabel,
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
import { isEmpty } from '@/services/util'
import { OPEN_MODE, SPACE_ENCODING } from '@/const'

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
  searchUrl: z.string().url(),
  iconUrl: z.string().url(),
  openMode: z.nativeEnum(OPEN_MODE),
  openModeSecondary: z.nativeEnum(OPEN_MODE),
  spaceEncoding: z.nativeEnum(SPACE_ENCODING),
  description: z.string().max(200, {
    message: '説明は最長200文字です',
  }),
})

const STORAGE_KEY = 'CommandShareFormData'

let onChagneSearchUrlTO = 0

export function CommandForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      searchUrl: '',
      iconUrl: '',
      description: '',
      openMode: OPEN_MODE.POPUP,
      openModeSecondary: OPEN_MODE.TAB,
      spaceEncoding: SPACE_ENCODING.PLUS,
    },
  })

  const { setValue } = form
  const searchUrl = form.getValues('searchUrl')
  const iconUrl = form.getValues('iconUrl')

  const onChagneSearchUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(onChagneSearchUrlTO)
    onChagneSearchUrlTO = window.setTimeout(() => {
      const sUrl = e.target.value
      const iUrl = form.getValues('iconUrl')
      if (isEmpty(iUrl) && !isEmpty(sUrl)) {
        form.setValue(
          'iconUrl',
          `https://www.google.com/s2/favicons?sz=64&domain_url=${sUrl}`,
        )
        form.trigger('iconUrl')
      }
    }, 1000)
  }

  const onChagneIconUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmpty(e.target.value)) {
      form.resetField('iconUrl')
    }
  }

  const findIconUrl = () => {
    form.setValue(
      'iconUrl',
      `https://www.google.com/s2/favicons?sz=64&domain_url=${searchUrl}`,
    )
    form.trigger('iconUrl')
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // Clear localStorage after form submission
    sessionStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    // Resotre form data from localStorage
    const data = sessionStorage.getItem(STORAGE_KEY)
    if (data) {
      const savedData = JSON.parse(data)
      if (savedData) {
        Object.keys(savedData).forEach((key) => {
          setValue(key, savedData[key])
        })
      }
    }
  }, [setValue])

  form.watch((data) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  })

  return (
    <Form {...form}>
      <form
        id="commandForm"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 mt-4"
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
                    className=" pr-10"
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

        <Collapsible className={clsx(css.collapse, 'flex flex-col items-end')}>
          <CollapsibleTrigger className="flex items-center hover:bg-stone-200 px-1.5 py-1 rounded-lg">
            <ChevronsUpDown size={18} className={css.iconUpDown} />
            <ChevronsDownUp size={18} className={css.iconDownUp} />
            <span className="ml-0.5">オプション</span>
          </CollapsibleTrigger>
          <CollapsibleContent
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
                        onClick={findIconUrl}
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
                  <div className="w-3/5">
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
                          <SelectLabel>OpenMode</SelectLabel>
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
                  <div className="w-3/5">
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
                          <SelectLabel>OpenMode</SelectLabel>
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
                  <div className="w-3/5">
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
                          <SelectLabel>スペースのエンコード</SelectLabel>
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
            <Send /> 共有実行
          </Button>
        </div>
      </form>
    </Form>
  )
}
