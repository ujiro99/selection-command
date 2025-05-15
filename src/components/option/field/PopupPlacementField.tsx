import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MousePointer } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Check } from 'lucide-react'

import { InputField } from '@/components/option/field/InputField'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PopupPlacementSchema } from '@/types/schema'

import { SIDE, ALIGN } from '@/const'
import { cn } from '@/lib/utils'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type PopupPlacementType = z.infer<typeof PopupPlacementSchema>

type PopupPlacementFieldType = {
  onSubmit: (data: PopupPlacementType) => void
  defaultValues: PopupPlacementType
}

export const PopupPlacementField = ({
  onSubmit,
  defaultValues,
}: PopupPlacementFieldType) => {
  const form = useForm<PopupPlacementType>({
    resolver: zodResolver(PopupPlacementSchema),
    mode: 'onChange',
    defaultValues: defaultValues,
  })
  const { register } = form

  form.watch((data) => {
    if (onSubmit) {
      onSubmit(data as PopupPlacementType)
    }
  })

  const side = useWatch({
    control: form.control,
    name: 'side',
  })

  const align = useWatch({
    control: form.control,
    name: 'align',
  })

  const isAlignOffsetDisabled = align === ALIGN.center

  return (
    <section>
      <h2 className="text-sm font-bold">{t('popupPlacement')}</h2>
      <div className="flex flex-col gap-4 ml-4 mt-3">
        <FormField
          control={form.control}
          name="side"
          render={({ field }) => (
            <FormItem className="flex items-start gap-1">
              <div className="w-2/6">
                <FormLabel>{t('popupPlacement_side')}</FormLabel>
                <FormDescription className="mt-2 text-balance break-keep wrap-anywhere">
                  {t('popupPlacement_side_desc')}
                </FormDescription>
              </div>
              <div className="w-4/6">
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={(val) => {
                      if (val) field.onChange(val)
                    }}
                    className="grid grid-cols-3 gap-2 p-0.5"
                  >
                    <div />
                    <SideItem side={SIDE.top} current={field.value} />
                    <div />

                    <SideItem side={SIDE.left} current={field.value} />
                    <div className="flex items-center flex-col gap-0.5">
                      <MousePointer size={18} />
                      <span>{t('mouse_pointer')}</span>
                    </div>
                    <SideItem side={SIDE.right} current={field.value} />

                    <div />
                    <SideItem side={SIDE.bottom} current={field.value} />
                    <div />
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <InputField
          control={form.control}
          name="sideOffset"
          formLabel={t('popupPlacement_sideOffset')}
          description={t('popupPlacement_sideOffset_desc')}
          unit="px"
          inputProps={{
            type: 'number',
            min: 0,
            max: 100,
            step: 5,
            ...register('sideOffset', {
              valueAsNumber: true,
            }),
          }}
        />
        <FormField
          control={form.control}
          name="align"
          render={({ field }) => (
            <FormItem className="flex items-start gap-1">
              <div className="w-2/6">
                <FormLabel>{t('popupPlacement_align')}</FormLabel>
                <FormDescription className="text-balance break-keep wrap-anywhere">
                  {t('popupPlacement_align_desc')}
                </FormDescription>
              </div>
              <div className="w-4/6">
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={(val) => {
                      if (val) field.onChange(val)
                    }}
                    className="grid grid-cols-3 gap-2 p-0.5"
                  >
                    <AlignItem
                      side={side}
                      align={ALIGN.start}
                      current={field.value}
                    />
                    <AlignItem
                      side={side}
                      align={ALIGN.center}
                      current={field.value}
                    />
                    <AlignItem
                      side={side}
                      align={ALIGN.end}
                      current={field.value}
                    />
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <InputField
          control={form.control}
          name="alignOffset"
          formLabel={t('popupPlacement_alignOffset')}
          description={isAlignOffsetDisabled ? t('popupPlacement_alignOffset_disabled') : t('popupPlacement_alignOffset_desc')}
          unit="px"
          inputProps={{
            type: 'number',
            min: -100,
            max: 100,
            step: 5,
            disabled: isAlignOffsetDisabled,
            className: cn(
              isAlignOffsetDisabled && 'opacity-80 cursor-not-allowed'
            ),
            ...register('alignOffset', {
              valueAsNumber: true,
            }),
          }}
        />
      </div>
    </section>
  )
}

const SideItem = ({ side, current }: { side: SIDE; current: SIDE }) => {
  const checked = side === current
  return (
    <FormItem>
      <FormControl>
        <ToggleGroupItem
          value={side}
          aria-label={t(`popupPlacement_${side}`)}
          className={cn(
            'relative w-full h-9 shadow-sm text-xs font-mono text-gray-600',
          )}
        >
          {checked && <Check size={16} className="absolute left-5" />}
          {t(`popupPlacement_${side}`)}
        </ToggleGroupItem>
      </FormControl>
    </FormItem>
  )
}

const AlignItem = ({
  side,
  align,
  current,
}: {
  side: SIDE
  align: ALIGN
  current: ALIGN
}) => {
  const _side =
    side === SIDE.left || side === SIDE.right ? 'vertical' : 'horizontal'
  const checked = align === current
  return (
    <FormItem>
      <FormControl>
        <ToggleGroupItem
          value={align}
          aria-label={t(`popupPlacement_${align}`)}
          className={cn(
            'relative',
            'flex-col gap-0 h-auto w-full py-1 shadow-sm text-xs font-mono text-gray-600',
          )}
        >
          {checked && <Check size={16} className="absolute left-2" />}
          <img
            src={`/setting/align_${align}_${_side}.png`}
            alt="Selection Command"
            className="h-16 w-full object-contain"
          />
          <span>{t(`popupPlacement_${align}`)}</span>
        </ToggleGroupItem>
      </FormControl>
    </FormItem>
  )
}
