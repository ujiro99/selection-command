import { useCallback } from "react"
import { useFieldArray } from "react-hook-form"
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { UserStyleType, UserStylesType } from "@/types/schema"
import { Attributes } from "@/services/option/userStyles"

import { STYLE_VARIABLE } from "@/const"
import { cn, hyphen2Underscore } from "@/lib/utils"
import { t } from "@/services/i18n"

const isAnimation = (variable: STYLE_VARIABLE) => {
  return (
    variable === STYLE_VARIABLE.POPUP_DELAY ||
    variable === STYLE_VARIABLE.POPUP_DURATION
  )
}

type Props = {
  control: any
  register: any
}

export const PopupAnimation = ({ control, register }: Props) => {
  const array = useFieldArray<UserStylesType, "userStyles", "_id">({
    name: "userStyles",
    control: control,
    keyName: "_id",
  })

  console.debug("PopupAnimation", array.fields)

  return (
    <section className="pt-4">
      <h2 className="text-sm font-bold">{t("Option_popupAnimation")}</h2>
      <div className="flex flex-col space-y-3 ml-4 mt-3">
        {array.fields
          .filter((f) => isAnimation(f.name))
          .map((field) => {
            const attr = Attributes[field.name]
            const name = hyphen2Underscore(field.name)
            const idx = array.fields.findIndex((f) => f._id === field._id)
            return (
              <FormItem className="flex items-center gap-1" key={field._id}>
                <div className="w-2/6">
                  <FormLabel>{t(`Option_userStyles_option_${name}`)}</FormLabel>
                  <FormDescription>
                    {t(`Option_userStyles_desc_${name}`)}
                  </FormDescription>
                </div>
                <div className="w-4/6 relative">
                  <FormControl>
                    <Input
                      className={cn("pl-10")}
                      unit={"ms"}
                      // {...register(`userStyles.${idx}.value`, {
                      //   valueAsNumber: true,
                      // })}
                      onChange={(e) => {
                        console.debug(e.target.value)
                        const v = parseInt(e.target.value)
                        array.update(idx, { ...field, value: isNaN(v) ? 0 : v })
                      }}
                      {...field}
                      {...attr}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )
          })}
      </div>
    </section>
  )
}
