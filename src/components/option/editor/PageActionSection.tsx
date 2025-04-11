import { useState } from 'react'
import { z } from 'zod'
import { useFieldArray } from 'react-hook-form'
import { Disc3 } from 'lucide-react'
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from '@/const'
import { FormLabel, FormDescription } from '@/components/ui/form'
import type { PageAction } from '@/services/pageAction'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { cn, e2a, isEmpty, capitalize } from '@/lib/utils'
import { PageActionOption, PageActionStep } from '@/types/schema'

import { InputField } from '@/components/option/field/InputField'
import { SelectField } from '@/components/option/field/SelectField'
import { StepList } from '@/components/pageAction/StepList'
import { InputEditor } from '@/components/pageAction/InputEditor'
import { RemoveDialog } from '@/components/option/RemoveDialog'
import { TypeIcon } from '@/components/pageAction/TypeIcon'

export const pageActionSchema = z.object({
  openMode: z.enum([OPEN_MODE.PAGE_ACTION]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Get Text Styles'),
  iconUrl: z.string().url({ message: t('zod_url') }),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  pageActionOption: PageActionOption,
})

type PageActionSectionProps = {
  form: any
  openRecorder: () => void
}

export const PageActionSection = ({
  form,
  openRecorder,
}: PageActionSectionProps) => {
  const { register, getValues } = form

  const pageActionArray = useFieldArray({
    name: 'pageActionOption.steps',
    control: form.control,
    keyName: '_id',
  })
  const steps = pageActionArray.fields as unknown as PageActionStep[]
  const recDisabled = !getValues('pageActionOption.startUrl')

  // for Editor
  const [editId, setEditId] = useState<string | null>(null)
  const editStep = steps.find((a) => a.id === editId)
  const editorValue = (editStep?.param as PageAction.Input)?.value
  const editorOpen = !isEmpty(editId)

  // for RemoveDialog
  const [removeId, setRemoveId] = useState<string | null>(null)
  const removeStep = steps.find((a) => a.id === removeId)
  const removeOpen = !isEmpty(removeId)
  const hasLabel = !isEmpty(removeStep?.param.label)

  const editAction = (value: string) => {
    if (!editStep) return
    pageActionArray.update(
      steps.findIndex((a) => a.id === editId),
      {
        ...editStep,
        param: {
          ...editStep.param,
          value,
        },
      },
    )
    setEditId(null)
  }

  const removeAction = (id: string | null) => {
    if (id == null) return
    pageActionArray.remove(steps.findIndex((a) => a.id === id))
  }

  return (
    <>
      <InputField
        control={form.control}
        name="pageActionOption.startUrl"
        formLabel={t('startUrl')}
        inputProps={{
          type: 'string',
          ...register('pageActionOption.startUrl', {}),
        }}
        description={t('startUrl_desc')}
        previewUrl={getValues('iconUrl')}
      />

      <SelectField
        control={form.control}
        name="pageActionOption.openMode"
        formLabel={t('pageAction_openMode')}
        options={e2a(PAGE_ACTION_OPEN_MODE)
          .filter((mode) => mode !== PAGE_ACTION_OPEN_MODE.NONE)
          .map((mode) => ({
            name: t(`openMode_${mode}`),
            value: mode,
          }))}
      />

      <div className="w-full flex items-center gap-1 py-4">
        <div className="w-2/6">
          <FormLabel>{t('pageAction_title')}</FormLabel>
          <FormDescription>{t('pageAction_desc')}</FormDescription>
        </div>
        <div className="w-4/6 relative">
          <StepList
            steps={pageActionArray.fields as unknown as PageActionStep[]}
            onClickRemove={setRemoveId}
            onClickEdit={setEditId}
          />
          <button
            type="button"
            className={cn(
              'relative left-[50%] -translate-x-[50%] mt-4 px-3 py-1 bg-rose-600 font-mono text-base font-medium text-white inline-flex items-center justify-center gap-0.5 rounded-lg',
              !recDisabled &&
                'group/record transition hover:opacity-80 hover:scale-[1.05]',
              recDisabled && 'opacity-50 cursor-not-allowed bg-gray-400',
            )}
            disabled={recDisabled}
            onClick={openRecorder}
          >
            <Disc3
              className="stroke-white mr-1.5 group-hover/record:animate-spin-slow"
              size={18}
            />
            <span>REC</span>
          </button>
        </div>
      </div>
      <InputEditor
        open={editorOpen}
        onOpenChange={(o) => !o && setEditId(null)}
        value={editorValue}
        onSubmit={editAction}
      />
      <RemoveDialog
        open={removeOpen}
        onOpenChange={(o) => !o && setRemoveId(null)}
        onRemove={() => removeAction(removeId)}
      >
        {removeStep && (
          <div>
            <p className="text-base font-medium font-mono flex items-center gap-1.5">
              <TypeIcon
                type={removeStep.param.type}
                className="stroke-gray-700"
                size={20}
              />
              {capitalize(removeStep.param.type)}
            </p>
            {hasLabel && (
              <p className="mt-2 px-3 py-2 rounded-md text-balance whitespace-pre-line text-sm max-h-80 overflow-x-hidden overflow-y-auto bg-gray-100">
                <span>{removeStep.param.label}</span>
              </p>
            )}
          </div>
        )}
      </RemoveDialog>
    </>
  )
}
