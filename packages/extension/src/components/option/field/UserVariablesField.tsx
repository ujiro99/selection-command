import { useState } from "react"
import { Control, useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2, ChevronRight, Braces } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import collapsibleCss from "@/components/ui/collapsible.module.css"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { InputMenu } from "@/components/pageAction/InputPopup"
import {
  convSymbolsToReadableKeys,
  convReadableKeysToSymbols,
} from "@/services/pageAction"
import { cn, isValidVariableName, isReservedVariableName } from "@/lib/utils"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

export const MAX_VARIABLES = 5

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
  const variableArray = useFieldArray({ name, control })
  const [openId, setOpenId] = useState<string | null>(null)
  const watchedFields = watch(name) || []

  const addVariable = () => {
    if (variableArray.fields.length >= MAX_VARIABLES) return
    variableArray.append({ name: "", value: "" })
    const appended = variableArray.fields.length
    setOpenId(variableArray.fields[appended]?.id ?? null)
  }

  const validateName = (value: string, index: number): string | null => {
    if (!value) return t("userVariable_name_required")
    if (!isValidVariableName(value)) return t("userVariable_name_invalid")
    if (isReservedVariableName(value)) return t("userVariable_name_reserved")
    const duplicated = watchedFields.some(
      (field: { name?: string }, i: number) =>
        i !== index && field?.name === value,
    )
    if (duplicated) return t("userVariable_name_duplicate")
    return null
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
              <VariableRow
                key={field.id}
                fieldName={`${name}.${index}`}
                variableName={watchedFields[index]?.name ?? ""}
                value={watchedFields[index]?.value ?? ""}
                error={
                  watchedFields[index]?.name !== undefined
                    ? validateName(watchedFields[index]?.name ?? "", index)
                    : null
                }
                open={openId === field.id}
                onOpenChange={(open) => setOpenId(open ? field.id : null)}
                onChangeName={(v) => setValue(`${name}.${index}.name`, v)}
                onChangeValue={(v) => setValue(`${name}.${index}.value`, v)}
                onRemove={() => {
                  if (openId === field.id) setOpenId(null)
                  variableArray.remove(index)
                }}
                // Only variables defined earlier resolve inside this one, so the
                // insert menu offers exactly those.
                precedingVariables={watchedFields
                  .slice(0, index)
                  .filter((v: { name?: string }) => v?.name)}
              />
            ))}

            {variableArray.fields.length < MAX_VARIABLES ? (
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
            ) : (
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

type VariableRowProps = {
  fieldName: string
  variableName: string
  value: string
  error: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChangeName: (value: string) => void
  onChangeValue: (value: string) => void
  onRemove: () => void
  precedingVariables: Array<{ name: string; value: string }>
}

const VariableRow = ({
  fieldName,
  variableName,
  value,
  error,
  open,
  onOpenChange,
  onChangeName,
  onChangeValue,
  onRemove,
  precedingVariables,
}: VariableRowProps) => {
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(collapsibleCss.collapse, "rounded-md border bg-white")}
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        <CollapsibleTrigger
          type="button"
          className="flex flex-1 items-center gap-1.5 text-left"
        >
          <ChevronRight
            size={16}
            className={cn(collapsibleCss.iconRight, "stroke-gray-500 shrink-0")}
          />
          <Braces size={14} className="stroke-gray-500 shrink-0" />
          <span
            className={cn(
              "font-mono text-sm truncate",
              variableName ? "text-gray-700" : "text-gray-400",
            )}
          >
            {variableName ? `{{${variableName}}}` : t("userVariable_unnamed")}
          </span>
          {!open && value && (
            <span className="text-xs text-gray-400 truncate">
              {convSymbolsToReadableKeys(value)}
            </span>
          )}
        </CollapsibleTrigger>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("userVariable_remove")}
          className="p-1.5 rounded-md transition hover:bg-red-100 group/remove-button"
        >
          <Trash2
            size={16}
            className="stroke-gray-500 group-hover/remove-button:stroke-red-500"
          />
        </button>
      </div>

      <CollapsibleContent className={collapsibleCss.CollapsibleContent}>
        <div className="space-y-2 border-t px-2 py-2">
          <FormControl>
            <Input
              placeholder={t("userVariable_name")}
              value={variableName}
              onChange={(e) => onChangeName(e.target.value)}
              className={cn(error && "border-red-500")}
              inputClassName="text-sm lg:text-sm font-mono"
            />
          </FormControl>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="relative">
            <InputMenu
              targetElm={textarea}
              className="w-fit absolute -top-9 right-0"
              hideFilePaste
              userVariables={precedingVariables}
            />
            <FormControl>
              <Textarea
                id={fieldName}
                placeholder={t("userVariable_value")}
                rows={5}
                value={convSymbolsToReadableKeys(value)}
                onChange={(e) =>
                  onChangeValue(convReadableKeysToSymbols(e.target.value))
                }
                ref={setTextarea}
                className="max-h-80 text-sm"
              />
            </FormControl>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
