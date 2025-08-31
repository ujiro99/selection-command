import { useState } from "react"
import { Control, useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn, isValidVariableName } from "@/lib/utils"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

const MAX_VARIABLES = 3

type UserVariablesFieldProps = {
  control: Control<any>
  name: string
  formLabel: string
  description?: string
}

export const UserVariablesField = ({
  control,
  name,
  formLabel,
  description,
}: UserVariablesFieldProps) => {
  const { watch, setValue } = useFormContext()
  const variableArray = useFieldArray({
    name,
    control,
  })

  const [errors, setErrors] = useState<Record<number, string>>({})
  const watchedFields = watch(name) || []

  const addVariable = () => {
    if (variableArray.fields.length < MAX_VARIABLES) {
      variableArray.append({ name: "", value: "" })
    }
  }

  const removeVariable = (index: number) => {
    variableArray.remove(index)
    // Remove error for this index
    const newErrors = { ...errors }
    delete newErrors[index]
    // Adjust error indexes
    Object.keys(newErrors).forEach((key) => {
      const numKey = parseInt(key)
      if (numKey > index) {
        newErrors[numKey - 1] = newErrors[numKey]
        delete newErrors[numKey]
      }
    })
    setErrors(newErrors)
  }

  const validateVariableName = (name: string, index: number) => {
    if (!name) {
      setErrors((prev) => ({
        ...prev,
        [index]: t("userVariable_name_required"),
      }))
      return false
    }
    if (!isValidVariableName(name)) {
      setErrors((prev) => ({
        ...prev,
        [index]: t("userVariable_name_invalid"),
      }))
      return false
    }
    // Check for duplicates
    const allNames = watchedFields.map((field: any, i: number) =>
      i === index ? name : field?.name,
    )
    const duplicateCount = allNames.filter(
      (n: string) => n === name && n,
    ).length
    if (duplicateCount > 1) {
      setErrors((prev) => ({
        ...prev,
        [index]: t("userVariable_name_duplicate"),
      }))
      return false
    }
    // Clear error if valid
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })
    return true
  }

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className="flex items-start gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="w-4/6 space-y-2">
            {variableArray.fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <FormControl>
                      <Input
                        placeholder={t("userVariable_name")}
                        value={watchedFields[index]?.name || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          setValue(`${name}.${index}.name`, value)
                          validateVariableName(value, index)
                        }}
                        className={cn(errors[index] && "border-red-500")}
                        inputClassName="text-sm lg:text-sm"
                      />
                    </FormControl>
                    <FormControl>
                      <Input
                        placeholder={t("userVariable_value")}
                        value={watchedFields[index]?.value || ""}
                        onChange={(e) => {
                          setValue(`${name}.${index}.value`, e.target.value)
                        }}
                        inputClassName="text-sm lg:text-sm"
                      />
                    </FormControl>
                  </div>
                  {errors[index] && (
                    <p className="text-sm text-red-500">{errors[index]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariable(index)}
                  className="p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group/remove-button"
                >
                  <Trash2
                    className="stroke-gray-500 group-hover/remove-button:stroke-red-500"
                    size={16}
                  />
                </button>
              </div>
            ))}

            {variableArray.fields.length < MAX_VARIABLES && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariable}
                className="relative py-4 text-xs mx-auto left-[50%] -translate-x-[50%]"
              >
                <Plus size={16} className="mr-1" />
                {t("userVariable_add")}
              </Button>
            )}

            {variableArray.fields.length >= MAX_VARIABLES && (
              <p className="text-sm text-gray-500 text-center">
                {t("userVariable_max_reached", [`${MAX_VARIABLES}`])}
              </p>
            )}
          </div>
        </FormItem>
      )}
    />
  )
}
