import { z } from 'zod'
import { useFieldArray } from 'react-hook-form'
import {
  OPEN_MODE,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
} from '@/const'
import { FormLabel, FormDescription } from '@/components/ui/form'
import { SelectorType } from '@/services/pageAction'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { cn, e2a } from '@/lib/utils'

import { InputField } from '@/components/option/field/InputField'
import { SelectField } from '@/components/option/field/SelectField'
import { StepList } from '@/components/pageAction/StepList'

import { Disc3 } from 'lucide-react'

const PageActionControlSchema = z.object({
  type: z.nativeEnum(PAGE_ACTION_CONTROL),
  label: z.string(),
  url: z.string(),
})

const PageActionClickSchema = z.object({
  type: z.enum([
    PAGE_ACTION_EVENT.click,
    PAGE_ACTION_EVENT.doubleClick,
    PAGE_ACTION_EVENT.tripleClick,
  ]),
  label: z.string(),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
})

const PageActionInputSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.input),
  label: z.string(),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
  value: z.string(),
})

const PageActionKeyboardSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.keyboard),
  label: z.string(),
  key: z.string(),
  code: z.string(),
  keyCode: z.number(),
  shiftKey: z.boolean(),
  ctrlKey: z.boolean(),
  altKey: z.boolean(),
  metaKey: z.boolean(),
  targetSelector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
})

const PageActionScrollSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.scroll),
  label: z.string(),
  x: z.number(),
  y: z.number(),
})

const PageActionParameterSchema = z.discriminatedUnion('type', [
  PageActionControlSchema,
  PageActionClickSchema,
  PageActionInputSchema,
  PageActionKeyboardSchema,
  PageActionScrollSchema,
])

export const PageActionStepSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(PAGE_ACTION_EVENT).or(z.nativeEnum(PAGE_ACTION_CONTROL)),
  param: PageActionParameterSchema,
})

const PageActionOption = z.object({
  startUrl: z.string(),
  openMode: z.nativeEnum(PAGE_ACTION_OPEN_MODE),
  steps: z.array(PageActionStepSchema),
})

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

  const recDisabled = !getValues('pageActionOption.startUrl')

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
          <FormLabel>Actions</FormLabel>
          <FormDescription>記録されたアクション</FormDescription>
        </div>
        <div className="w-4/6 relative">
          <StepList
            steps={
              pageActionArray.fields.filter(
                (f: any) => !e2a(PAGE_ACTION_CONTROL).includes(f.type),
              ) as any
            }
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
    </>
  )
}
