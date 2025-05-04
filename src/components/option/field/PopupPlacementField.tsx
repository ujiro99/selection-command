import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MousePointer } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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

  return (
    <section>
      <h2 className="text-sm font-bold">{t('popupPlacement')}</h2>
      <div className="flex flex-col gap-4 ml-3 mt-3">
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-2 p-0.5"
                  >
                    <div />
                    <SideItem side={SIDE.top} />
                    <div />

                    <SideItem side={SIDE.left} />
                    <div className="flex items-center flex-col gap-0.5">
                      <MousePointer size={18} />
                      <span>{t('mouse_pointer')}</span>
                    </div>
                    <SideItem side={SIDE.right} />

                    <div />
                    <SideItem side={SIDE.bottom} />
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-2 p-0.5"
                  >
                    <AlignItem side={side} align={ALIGN.start} />
                    <AlignItem side={side} align={ALIGN.center} />
                    <AlignItem side={side} align={ALIGN.end} />
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
          description={t('popupPlacement_alignOffset_desc')}
          unit="px"
          inputProps={{
            type: 'number',
            min: -100,
            max: 100,
            step: 5,
            ...register('alignOffset', {
              valueAsNumber: true,
            }),
          }}
        />
      </div>
    </section>
  )
}

const SideItem = ({ side }: { side: SIDE }) => {
  return (
    <FormItem>
      <FormControl>
        <ToggleGroupItem
          value={side}
          aria-label={t(`popupPlacement_${side}`)}
          className="w-full h-9 shadow-sm text-xs font-mono text-gray-600"
        >
          {t(`popupPlacement_${side}`)}
        </ToggleGroupItem>
      </FormControl>
    </FormItem>
  )
}

const AlignItem = ({ side, align }: { side: SIDE; align: ALIGN }) => {
  const _side =
    side === SIDE.left || side === SIDE.right ? 'vertical' : 'horizontal'
  return (
    <FormItem>
      <FormControl>
        <ToggleGroupItem
          value={align}
          aria-label={t(`popupPlacement_${align}`)}
          className="flex-col gap-0 h-auto w-full py-1 shadow-sm text-xs font-mono text-gray-600"
        >
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
