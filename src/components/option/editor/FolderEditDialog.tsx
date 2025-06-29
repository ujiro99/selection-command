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
import { IconField } from '@/components/option/field/IconField'
import { SwitchField } from '@/components/option/field/SwitchField'
import { SelectField } from '@/components/option/field/SelectField'
import { isEmpty } from '@/lib/utils'
import { t as _t } from '@/services/i18n'
import { ROOT_FOLDER } from '@/const'
import { folderSchema } from '@/types/schema'
import { getDescendantFolderIds } from '@/services/option/commandUtils'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import type { CommandFolder } from '@/types'
import { calcLevel } from '@/services/option/commandTree'

type FolderEditDialog = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (folder: CommandFolder) => void
  folder?: CommandFolder
  folders: CommandFolder[]
}

export const FolderEditDialog = ({
  open,
  onOpenChange,
  onSubmit,
  folder,
  folders,
}: FolderEditDialog) => {
  const DefaultValue = {
    id: '',
    title: '',
    iconUrl:
      'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png',
    onlyIcon: true,
    parentFolderId: ROOT_FOLDER,
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
            <div id="InputForm" className="space-y-4">
              <InputField
                control={form.control}
                name="title"
                formLabel={t('title')}
                inputProps={{
                  type: 'string',
                  ...register('title', {}),
                }}
              />
              <IconField
                control={form.control}
                nameUrl="iconUrl"
                nameSvg="iconSvg"
                formLabel={t('iconUrl_folder')}
                placeholder={t('icon_placeholder')}
                description={t('icon_desc')}
              />
              <SelectField
                control={form.control}
                name="parentFolderId"
                formLabel={t('parentFolder')}
                description={t('parentFolder_desc')}
                options={[
                  {
                    value: ROOT_FOLDER,
                    name: t('rootFolder'),
                  },
                  ...folders
                    .filter((f) => {
                      if (!folder) return true
                      const excludedIds = [
                        folder.id,
                        ...getDescendantFolderIds(folder.id, folders),
                      ]
                      return !excludedIds.includes(f.id)
                    })
                    .map((f) => ({
                      value: f.id,
                      name: f.title,
                      iconUrl: f.iconUrl,
                      iconSvg: f.iconSvg,
                      level: calcLevel(f, folders),
                    })),
                ]}
              />
              <SwitchField
                control={form.control}
                name="onlyIcon"
                formLabel={t('onlyIcon')}
                description={t('onlyIcon_desc')}
              />
            </div>
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
              onClick={form.handleSubmit(
                (data) => {
                  if (isEmpty(data.id)) data.id = crypto.randomUUID()
                  onSubmit(data)
                  onOpenChange(false)
                  reset(DefaultValue)
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
