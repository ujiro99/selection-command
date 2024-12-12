'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import clsx from 'clsx'

import { ChevronsUpDown, ChevronsDownUp, Send } from 'lucide-react'

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    debugger
  }

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
            <FormItem className="flex items-center">
              <div className="w-2/5">
                <FormLabel>検索URL</FormLabel>
                <FormDescription className="leading-tight">
                  `%s`を選択テキストに置換します。
                </FormDescription>
              </div>
              <div className="w-3/5">
                <FormControl>
                  <Input placeholder="Search URL" {...field} />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="iconUrl"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <div className="w-2/5">
                <FormLabel>アイコンURL</FormLabel>
                <FormDescription className="leading-tight">
                  メニューのアイコンとして表示されます。
                </FormDescription>
              </div>
              <div className="w-3/5">
                <FormControl>
                  <Input placeholder="Icon URL" {...field} />
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
