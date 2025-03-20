import { z } from 'zod'
import { useFieldArray } from 'react-hook-form'
import {
  OPEN_MODE,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
} from '@/const'
import { SelectorType } from '@/services/pageAction'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { cn, capitalize, e2a } from '@/lib/utils'

import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { InputField } from '@/components/option/field/InputField'
import { SelectField } from '@/components/option/field/SelectField'

import css from './CommandEditDialog.module.css'

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
        options={e2a(PAGE_ACTION_OPEN_MODE).map((mode) => ({
          name: t(`openMode_${mode}`),
          value: mode,
        }))}
      />

      <div className="w-full p-2 flex items-center justify-center">
        <button
          type="button"
          className="bg-red-500 font-mono text-white px-4 py-1.5 inline-flex items-center justify-center gap-0.5 rounded-lg text-base font-medium transition hover:opacity-80 hover:scale-[1.10]"
          onClick={openRecorder}
        >
          <Disc3 className="stroke-white mr-1.5" size={20} />
          <span>REC</span>
        </button>
      </div>

      <FormField
        control={form.control}
        name="pageActionOption.steps"
        render={() => (
          <FormItem>
            <FormControl>
              <ul className="flex flex-row flex-wrap gap-3.5 m-auto">
                {pageActionArray.fields.map((field, index) => (
                  <FormField
                    key={field._id}
                    control={form.control}
                    name={`pageActionOption.steps.${index}`}
                    render={({ field }) => (
                      <li
                        className={cn(css.triangle, {
                          [css.pageActionStart]:
                            PAGE_ACTION_CONTROL.start === field.value.type,
                          [css.pageActionEnd]:
                            PAGE_ACTION_CONTROL.end === field.value.type,
                        })}
                      >
                        <FormItem className="w-28 p-2 bg-gray-200 rounded overflow-hidden">
                          <p>{capitalize(field.value.type)}</p>
                          <p className="truncate">{field.value.param?.label}</p>
                        </FormItem>
                      </li>
                    )}
                  />
                ))}
              </ul>
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
