import { MousePointer } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { SIDE, ALIGN } from '@/const'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type PopupPlacementFieldType = {
  control: any
  name: string
}

export const PopupPlacementField = ({
  control,
  name,
}: PopupPlacementFieldType) => {
  const onChangeSide = (field: any) => (value: string) => {
    field.onChange({
      ...field.value,
      side: value as SIDE,
    })
  }
  const onChangeAlign = (field: any) => (value: string) => {
    field.onChange({
      ...field.value,
      align: value as ALIGN,
    })
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <FormLabel>{t('popupPlacement')}</FormLabel>
          {field.value && (
            <>
              <FormItem className="flex items-start gap-1 mt-4">
                <div className="w-2/6">
                  <FormLabel className="ml-2">
                    {t('popupPlacement_side')}
                  </FormLabel>
                  <FormDescription className="ml-2 mt-2 text-balance break-keep wrap-anywhere">
                    {t('popupPlacement_side_desc')}
                  </FormDescription>
                </div>
                <div className="w-4/6">
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      onValueChange={onChangeSide(field)}
                      defaultValue={field.value.side}
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
              <FormItem className="flex items-start gap-1 mt-4">
                <div className="w-2/6">
                  <FormLabel className="ml-2">
                    {t('popupPlacement_align')}
                  </FormLabel>
                  <FormDescription className="ml-2 text-balance break-keep wrap-anywhere">
                    {t('popupPlacement_align_desc')}
                  </FormDescription>
                </div>
                <div className="w-4/6">
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      onValueChange={onChangeAlign(field)}
                      defaultValue={field.value.align}
                      className="grid grid-cols-3 gap-2 p-0.5"
                    >
                      <AlignItem side={field.value.side} align={ALIGN.start} />
                      <AlignItem side={field.value.side} align={ALIGN.center} />
                      <AlignItem side={field.value.side} align={ALIGN.end} />
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            </>
          )}
        </div>
      )}
    />
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
