import { useState } from "react"
import { Control, useFieldArray, useFormContext } from "react-hook-form"
import {
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { InputMenu } from "@/components/pageAction/InputPopup"
import { RemoveDialog } from "@/components/option/RemoveDialog"
import {
  convSymbolsToReadableKeys,
  convReadableKeysToSymbols,
  templateReferencesVariable,
} from "@/services/pageAction"
import { cn } from "@/lib/utils"
import {
  userVariableSchema,
  USER_VARIABLE_NAME_MAX_LENGTH,
} from "@/types/schema"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

export const MAX_VARIABLES = 5
export const MAX_VARIABLE_NAME_LENGTH = USER_VARIABLE_NAME_MAX_LENGTH

/**
 * A variable the surrounding context suggests creating, such as `Prompt` when
 * the page action starts on an AI service.
 */
export type VariableSuggestion = {
  /** Name given to the variable when the suggestion is accepted. */
  name: string
  /** Display name of what recommends it; absent when merely offered. */
  recommendedBy?: string | null
}

type UserVariablesFieldProps = {
  control: Control<any>
  name: string
  formLabel: string
  description?: string
  suggestion?: VariableSuggestion
  /**
   * Templates outside this field that may reference the variables, such as the
   * page action step values. References are left as literal `{{Name}}` at
   * runtime, so removing or renaming a referenced variable silently breaks
   * them unless the user is warned first.
   */
  referencingTemplates?: Array<string>
}

export const UserVariablesField = ({
  control,
  name,
  formLabel,
  description,
  suggestion,
  referencingTemplates,
}: UserVariablesFieldProps) => {
  const { watch, setValue } = useFormContext()
  const variableArray = useFieldArray({ name, control })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [pendingNewIndex, setPendingNewIndex] = useState<number | null>(null)
  const [removeIndex, setRemoveIndex] = useState<number | null>(null)
  const watchedFields = watch(name) || []
  const isFull = variableArray.fields.length >= MAX_VARIABLES

  const suggestionPresent =
    suggestion != null &&
    watchedFields.some(
      (field: { name?: string }) => field?.name === suggestion.name,
    )

  const addVariable = (initialName = "") => {
    if (isFull) return
    const appendedIndex = variableArray.fields.length
    variableArray.append({ name: initialName, value: "" })
    setPendingNewIndex(appendedIndex)
    setEditIndex(appendedIndex)
  }

  const validateName = (value: string, index: number): string | null => {
    const result = userVariableSchema.safeParse({ name: value, value: "" })
    if (!result.success) {
      const nameIssue = result.error.issues.find(
        (issue) => issue.path[0] === "name",
      )
      if (nameIssue) return nameIssue.message
    }
    const duplicated = watchedFields.some(
      (field: { name?: string }, i: number) =>
        i !== index && field?.name === value,
    )
    if (duplicated) return t("userVariable_name_duplicate")
    return null
  }

  /**
   * Counts the places that reference `{{variableName}}`: the surrounding
   * templates plus every other variable's value.
   */
  const countReferences = (variableName: string, index: number): number => {
    if (!variableName) return 0
    const templates = [
      ...(referencingTemplates ?? []),
      ...watchedFields
        .filter((_: unknown, i: number) => i !== index)
        .map((field: { value?: string }) => field?.value ?? ""),
    ]
    return templates.filter((template) =>
      templateReferencesVariable(template, variableName),
    ).length
  }

  const removeVariable = (index: number) => {
    setEditIndex((currentIndex) => {
      if (currentIndex == null || currentIndex < index) {
        return currentIndex
      }
      return currentIndex === index ? null : currentIndex - 1
    })
    variableArray.remove(index)
    setPendingNewIndex((pendingIndex) => {
      if (pendingIndex == null || pendingIndex < index) {
        return pendingIndex
      }
      return pendingIndex === index ? null : pendingIndex - 1
    })
  }

  // Removing a referenced variable is confirmed first; an unused one goes away
  // straight away.
  const requestRemove = (index: number) => {
    if (countReferences(watchedFields[index]?.name ?? "", index) > 0) {
      setRemoveIndex(index)
    } else {
      removeVariable(index)
    }
  }

  const removeName = removeIndex != null ? watchedFields[removeIndex]?.name : ""
  const removeCount =
    removeIndex != null ? countReferences(removeName ?? "", removeIndex) : 0

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="w-4/6">
            <div className="flex flex-wrap items-center gap-2">
              {variableArray.fields.map((field, index) => (
                <VariableBadge
                  key={field.id}
                  fieldName={`${name}.${index}`}
                  variableName={watchedFields[index]?.name ?? ""}
                  value={watchedFields[index]?.value ?? ""}
                  open={editIndex === index}
                  onOpenChange={(open) => setEditIndex(open ? index : null)}
                  onDismiss={() => {
                    setEditIndex(null)
                    if (pendingNewIndex === index) {
                      variableArray.remove(index)
                      setPendingNewIndex(null)
                    }
                  }}
                  validateName={(value) => validateName(value, index)}
                  onSubmit={(variableName, value) => {
                    setValue(`${name}.${index}.name`, variableName)
                    setValue(`${name}.${index}.value`, value)
                    setPendingNewIndex(null)
                    setEditIndex(null)
                  }}
                  onRemove={() => requestRemove(index)}
                  referenceCount={countReferences(
                    watchedFields[index]?.name ?? "",
                    index,
                  )}
                  // Only variables defined earlier resolve inside this one, so the
                  // insert menu offers exactly those.
                  precedingVariables={watchedFields
                    .slice(0, index)
                    .filter((v: { name?: string }) => v?.name)}
                />
              ))}

              {suggestion && !suggestionPresent && !isFull && (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addVariable(suggestion.name)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 px-3 font-mono text-sm text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100"
                  >
                    <Plus size={14} />
                    {suggestion.name}
                  </button>
                  {suggestion.recommendedBy && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      <Sparkles size={12} className="stroke-emerald-600" />
                      {t("userVariable_recommended", [
                        suggestion.recommendedBy,
                      ])}
                    </span>
                  )}
                </div>
              )}

              {!isFull && (
                <button
                  type="button"
                  onClick={() => addVariable()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-3 font-mono text-sm text-gray-900 transition hover:border-gray-300 hover:bg-gray-100"
                >
                  <Plus size={14} />
                  {t("userVariable_add")}
                </button>
              )}
            </div>

            {isFull && (
              <p className="text-sm text-gray-500 text-center">
                {t("userVariable_max_reached", [`${MAX_VARIABLES}`])}
              </p>
            )}

            <RemoveDialog
              open={removeIndex != null}
              onOpenChange={(open) => !open && setRemoveIndex(null)}
              onRemove={() => {
                if (removeIndex != null) removeVariable(removeIndex)
                setRemoveIndex(null)
              }}
              description={t("userVariable_remove_inUse", [`${removeCount}`])}
              portal
            >
              <p className="font-mono text-base text-gray-700">{`{{${removeName}}}`}</p>
            </RemoveDialog>
          </div>
        </FormItem>
      )}
    />
  )
}

type VariableBadgeProps = {
  fieldName: string
  variableName: string
  value: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDismiss: () => void
  validateName: (value: string) => string | null
  onSubmit: (name: string, value: string) => void
  onRemove: () => void
  precedingVariables: Array<{ name: string; value: string }>
  /** How many templates reference this variable under its current name. */
  referenceCount: number
}

const VariableBadge = ({
  fieldName,
  variableName,
  value,
  open,
  onOpenChange,
  onDismiss,
  validateName,
  onSubmit,
  onRemove,
  precedingVariables,
  referenceCount,
}: VariableBadgeProps) => {
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)
  const [draftName, setDraftName] = useState(variableName)
  const [draftValue, setDraftValue] = useState(value)
  const [hasInteracted, setHasInteracted] = useState(false)
  const error = validateName(draftName)
  const visibleError = hasInteracted ? error : null
  // Existing references keep the old name, so renaming leaves them unresolved.
  const renameWarning =
    !error && draftName !== variableName && referenceCount > 0
      ? t("userVariable_rename_inUse", [`${referenceCount}`])
      : null

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftName(variableName)
      setDraftValue(value)
      setHasInteracted(false)
    } else {
      onDismiss()
      return
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = () => {
    if (error) return
    onSubmit(draftName, draftValue)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="group/variable inline-flex h-9 px-1 max-w-full items-center rounded-xl border border-gray-300 bg-white shadow-sm transition hover:border-gray-400 hover:shadow">
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(
              "min-w-0 truncate py-1 pl-3 font-mono text-sm flex-1",
              variableName ? "text-gray-700" : "text-gray-400",
            )}
          >
            {variableName ? `{{${variableName}}}` : t("userVariable_unnamed")}
          </button>
        </DialogTrigger>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          aria-label={t("userVariable_remove")}
          className={cn(
            "grid size-6 place-items-center rounded-full opacity-0 transition hover:bg-red-100 focus:opacity-100 group-hover/variable:opacity-100 basis-[0%]",
            "group-hover/variable:basis-auto",
          )}
        >
          <Trash2 size={14} className="stroke-gray-500 hover:stroke-red-500" />
        </button>
      </div>

      <DialogPortal portal>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              <Pencil size={18} />
              {t("userVariables")}
            </DialogTitle>
            <DialogDescription>
              {t("userVariable_dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <FormLabel htmlFor={`${fieldName}.name`}>
                {t("userVariable_name")}
              </FormLabel>
              <FormDescription>{t("userVariable_name_desc")}</FormDescription>
              <FormControl>
                <Input
                  id={`${fieldName}.name`}
                  placeholder={t("userVariable_name")}
                  value={draftName}
                  onChange={(event) => {
                    setDraftName(event.target.value)
                    setHasInteracted(true)
                  }}
                  maxLength={MAX_VARIABLE_NAME_LENGTH}
                  showRemainingCount
                  remainingCountLabel={t("userVariable_name_remaining")}
                  className={cn(visibleError && "border-red-500")}
                  inputClassName="text-sm lg:text-sm font-mono"
                />
              </FormControl>
              <FormMessage>{visibleError}</FormMessage>
              {renameWarning && (
                <p className="flex items-start gap-1.5 text-sm text-amber-600">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                  {renameWarning}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <FormLabel htmlFor={`${fieldName}.value`} className="min-w-0">
                  {t("userVariable_value_label")}
                </FormLabel>
                <InputMenu
                  targetElm={textarea}
                  className="w-fit shrink-0"
                  hideFilePaste
                  userVariables={precedingVariables}
                />
              </div>
              <FormControl>
                <Textarea
                  id={`${fieldName}.value`}
                  placeholder={t("userVariable_value")}
                  rows={5}
                  value={convSymbolsToReadableKeys(draftValue)}
                  onChange={(event) => {
                    setDraftValue(convReadableKeysToSymbols(event.target.value))
                    setHasInteracted(true)
                  }}
                  ref={setTextarea}
                  className="max-h-80 text-sm"
                />
              </FormControl>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("labelCancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={error != null}
            >
              <Save size={16} className="mr-0.5" />
              {t("labelSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
