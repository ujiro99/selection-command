import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FolderPlus, Save } from 'lucide-react'
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
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import type { CommandFolder } from '@/types'

export const folderSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: t('zod_string_min', ['1']) }),
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
            <DialogTitle>
              <FolderPlus />
              {t('folders_edit')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>{t('folders_input')}</DialogDescription>
          <Form {...form}>
            <form id="InputForm" className="space-y-4">
              <InputField
                control={form.control}
                name="title"
                formLabel={t('title')}
                inputProps={{
                  type: 'string',
                  ...register('title', {}),
                }}
              />
              <InputField
                control={form.control}
                name="iconUrl"
                formLabel={t('iconUrl')}
                inputProps={{
                  type: 'iconUrl',
                  ...register('iconUrl', {}),
                }}
              />
              <SwitchField
                control={form.control}
                name="onlyIcon"
                formLabel={t('onlyIcon')}
                description={t('onlyIcon_desc')}
              />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="lg" type="button" variant="secondary">
                {t('labelCancel')}
              </Button>
            </DialogClose>
            <Button
              size="lg"
              type="button"
              onClick={form.handleSubmit((data) => {
                if (isEmpty(data.id)) data.id = crypto.randomUUID()
                onSubmit(data)
                onOpenChange(false)
                reset(DefaultValue)
              })}
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
