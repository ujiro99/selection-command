import { useEffect } from 'react'
import type { CommandFolder } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/option/field/InputField'
import { SwitchField } from '@/components/option/field/SwitchField'
import { isEmpty } from '@/lib/utils'

export const folderSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  iconUrl: z.string().optional(),
  onlyIcon: z.boolean().optional(),
})

type FolderEditDialog = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (folder: CommandFolder) => void
  folder?: CommandFolder
}

export const FolderEditDialog = ({
  open,
  onOpenChange,
  onSubmit,
  folder,
}: FolderEditDialog) => {
  const DefaultValue = {
    id: '',
    title: '',
    iconUrl:
      'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png',
    onlyIcon: true,
  }

  const form = useForm<z.infer<typeof folderSchema>>({
    resolver: zodResolver(folderSchema),
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
            <Button
              type="button"
              onClick={form.handleSubmit((data) => {
                console.log(data)
                if (isEmpty(data.id)) data.id = crypto.randomUUID()
                onSubmit(data)
                onOpenChange(false)
                reset(DefaultValue)
              })}
            >
              {isUpdate ? '更新する' : '作成する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
