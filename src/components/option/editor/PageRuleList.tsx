import { useEffect, useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, BookOpen } from 'lucide-react'
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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/Tooltip'
import { EditButton } from '@/components/option/EditButton'
import { RemoveButton } from '@/components/option/RemoveButton'
import { InputField } from '@/components/option/field/InputField'
import { SelectField } from '@/components/option/field/SelectField'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { POPUP_PLACEMENT, POPUP_ENABLED, LINK_COMMAND_ENABLED } from '@/const'
import { e2a, cn } from '@/lib/utils'
import type { PageRule } from '@/types'

export const pageRuleSchema = z.object({
  urlPattern: z.string().url({ message: t('zod_url') }),
  popupEnabled: z.nativeEnum(POPUP_ENABLED),
  popupPlacement: z.nativeEnum(POPUP_PLACEMENT),
  linkCommandEnabled: z.nativeEnum(LINK_COMMAND_ENABLED),
})

const pageRulesSchema = z.object({
  pageRules: z.array(pageRuleSchema),
})

type pageRulesType = z.infer<typeof pageRulesSchema>

const DefaultRule = {
  urlPattern: '',
  popupEnabled: POPUP_ENABLED.ENABLE,
  popupPlacement: POPUP_PLACEMENT.TOP_END,
  linkCommandEnabled: LINK_COMMAND_ENABLED.INHERIT,
}

type PageRuleListProps = {
  control: any
}

export const PageRuleList = ({ control }: PageRuleListProps) => {
  const [dialogOpen, _setDialogOpen] = useState(false)
  const editorRef = useRef(DefaultRule)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const setDialogOpen = (open: boolean) => {
    _setDialogOpen(open)
    if (!open) {
      editorRef.current = DefaultRule
    }
  }

  const pageRuleArray = useFieldArray<pageRulesType, 'pageRules', '_id'>({
    control: control,
    name: 'pageRules',
    keyName: '_id',
  })

  const upsert = (rule: PageRule) => {
    const index = pageRuleArray.fields.findIndex(
      (field) => field.urlPattern === rule.urlPattern,
    )
    if (index === -1) {
      pageRuleArray.append(rule)
    } else {
      pageRuleArray.update(index, rule)
    }
  }

  return (
    <FormField
      control={control}
      name="pageRules"
      render={() => (
        <FormItem>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="absolute bottom-0 left-[100%] translate-x-[-105%] px-2 rounded-md transition font-mono hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group"
              onClick={() => setDialogOpen(true)}
              ref={addButtonRef}
            >
              <BookOpen />
              {t('pageRules')}
            </Button>
            <Tooltip
              positionElm={addButtonRef.current}
              text={t('pageRules_tooltip')}
            />
          </div>
          <FormControl>
            <ul>
              {pageRuleArray.fields.map((field, index) => (
                <li
                  key={field._id}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1',
                    index !== 0 ? 'border-t' : '',
                  )}
                >
                  <div className="flex-1 px-1 py-2 overflow-hidden">
                    <p className="flex items-center">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${field.urlPattern}`}
                        alt="favicon"
                        className="w-5 h-5 inline-block mr-2 rounded"
                      />
                      <span className="text-base font-mono truncate">
                        {field.urlPattern}
                      </span>
                    </p>
                    <ul className="mt-1 text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                      <li>
                        {t('popupEnabled')}: {t(`${field.popupEnabled}`)}
                      </li>
                      <li>
                        {t('popupPlacement')}: {field.popupPlacement}
                      </li>
                      <li>
                        {t('linkCommandEnabled')}:{' '}
                        {t(`linkCommand_enabled${field.linkCommandEnabled}`)}
                      </li>
                    </ul>
                  </div>
                  <div className="flex gap-0.5 items-center">
                    <EditButton
                      onClick={() => {
                        editorRef.current = field
                        setDialogOpen(true)
                      }}
                    />
                    <RemoveButton
                      title={field.urlPattern}
                      iconUrl={`https://www.google.com/s2/favicons?sz=64&domain_url=${field.urlPattern}`}
                      onRemove={() => pageRuleArray.remove(index)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </FormControl>
          <PageRuleDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={(rule) => upsert(rule)}
            rule={editorRef.current ?? DefaultRule}
          />
        </FormItem>
      )}
    />
  )
}

type PageRuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rule: PageRule) => void
  rule?: PageRule
}

export const PageRuleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  rule,
}: PageRuleDialogProps) => {
  const form = useForm<z.infer<typeof pageRuleSchema>>({
    resolver: zodResolver(pageRuleSchema),
    mode: 'onChange',
    defaultValues: DefaultRule,
  })
  const { register, reset } = form

  useEffect(() => {
    if (rule != null && rule.urlPattern !== DefaultRule.urlPattern) {
      reset(rule ?? DefaultRule)
    } else {
      setTimeout(() => {
        reset(DefaultRule)
      }, 200)
    }
  }, [rule])

  const isUpdate = rule != null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <BookOpen />
              {t('pageRules_add')}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>{t('pageRules_add_desc')}</DialogDescription>
          <Form {...form}>
            <form id="PageRuleDialog" className="space-y-4">
              <InputField
                control={form.control}
                name="urlPattern"
                formLabel={t('urlPattern')}
                inputProps={{
                  type: 'string',
                  ...register('urlPattern', {}),
                }}
              />
              <SelectField
                control={form.control}
                name="popupEnabled"
                formLabel={t('popupEnabled')}
                options={e2a(POPUP_ENABLED).map((mode) => ({
                  name: t(`${mode}`),
                  value: mode,
                }))}
              />
              <SelectField
                control={form.control}
                name="popupPlacement"
                formLabel={t('popupPlacement')}
                options={e2a(POPUP_PLACEMENT).map((opt) => ({
                  name: `${opt}`,
                  value: opt,
                }))}
              />
              <SelectField
                control={form.control}
                name="linkCommandEnabled"
                formLabel={t('linkCommandEnabled')}
                options={e2a(LINK_COMMAND_ENABLED).map((opt) => ({
                  name: t(`linkCommand_enabled${opt}`),
                  value: opt,
                }))}
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
                onSubmit(data)
                onOpenChange(false)
                reset(DefaultRule)
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
