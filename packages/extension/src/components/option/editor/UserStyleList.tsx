import { useEffect, useState, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Paintbrush, Save } from "lucide-react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip } from "@/components/Tooltip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EditButton } from "@/components/option/EditButton"
import { RemoveButton } from "@/components/option/RemoveButton"

import { userStyleSchema, UserStyleType, UserStylesType } from "@/types/schema"

import { STYLE_VARIABLE } from "@/const"
import { cn, hyphen2Underscore } from "@/lib/utils"
import { Attributes } from "@/services/option/userStyles"
import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type UnitMap = Record<STYLE_VARIABLE, string | undefined>
const Units: UnitMap = {
  [STYLE_VARIABLE.BACKGROUND_COLOR]: undefined,
  [STYLE_VARIABLE.BORDER_COLOR]: undefined,
  [STYLE_VARIABLE.FONT_SCALE]: undefined,
  [STYLE_VARIABLE.FONT_COLOR]: undefined,
  [STYLE_VARIABLE.IMAGE_SCALE]: undefined,
  [STYLE_VARIABLE.PADDING_SCALE]: undefined,
  [STYLE_VARIABLE.POPUP_DELAY]: "ms",
  [STYLE_VARIABLE.POPUP_DURATION]: "ms",
}

const DefaultValue = {
  name: STYLE_VARIABLE.FONT_SCALE,
  value: "",
} as const

const isValidStyle = (variable: string): variable is STYLE_VARIABLE => {
  return Object.values(STYLE_VARIABLE).includes(variable as STYLE_VARIABLE)
}

const isEditable = (variable: STYLE_VARIABLE) => {
  return (
    variable !== STYLE_VARIABLE.POPUP_DELAY &&
    variable !== STYLE_VARIABLE.POPUP_DURATION
  )
}

type UserStyleListProps = {
  control: any
}

export const UserStyleList = ({ control }: UserStyleListProps) => {
  const [dialogOpen, _setDialogOpen] = useState(false)
  const editorRef = useRef<UserStyleType>(DefaultValue)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const array = useFieldArray<UserStylesType, "userStyles", "_id">({
    name: "userStyles",
    control: control,
    keyName: "_id",
  })

  const selectedList = array.fields.map((field) => field.name)
  const selectedAll = selectedList.length === Object.keys(STYLE_VARIABLE).length
  const defaultName =
    Object.values(STYLE_VARIABLE).find((opt) => !selectedList.includes(opt)) ??
    STYLE_VARIABLE.FONT_SCALE

  const setDialogOpen = (open: boolean) => {
    if (!open) {
      editorRef.current = {
        name: defaultName,
        value: "",
      }
    }
    _setDialogOpen(open)
  }

  const upsert = (variable: UserStyleType) => {
    const index = array.fields.findIndex(
      (field) => field.name === variable.name,
    )
    if (index === -1) {
      array.append(variable)
    } else {
      array.update(index, variable)
    }
  }

  return (
    <FormField
      control={control}
      name="userStyles"
      render={() => (
        <FormItem>
          <div className="relative h-6">
            <Button
              type="button"
              variant="outline"
              className="absolute bottom-0 left-[100%] translate-x-[-105%] px-2 rounded-md transition font-mono hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group"
              onClick={() => {
                editorRef.current = {
                  name: defaultName,
                  value: Attributes[defaultName].default,
                }
                setDialogOpen(true)
              }}
              ref={addButtonRef}
              disabled={selectedAll}
            >
              <Paintbrush />
              {t("userStyles")
                .split(" ")
                .map((w) => (
                  <span key={w}>{w}</span>
                ))}
            </Button>
            <Tooltip
              positionElm={addButtonRef.current}
              text={t("userStyles_tooltip")}
            />
          </div>
          <FormControl>
            <ul className="">
              {array.fields
                .filter((f) => isEditable(f.name))
                .filter((f) => isValidStyle(f.name))
                .map((field, index) => (
                  <li
                    key={field._id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1",
                      index !== 0 ? "border-t" : "",
                    )}
                  >
                    <p className="text-base font-mono flex-1 p-2">
                      <span className="inline-block w-1/2">
                        {t(
                          `userStyles_option_${hyphen2Underscore(field.name)}`,
                        )}
                      </span>
                      <span className="inline-block w-1/2 text-center">
                        {field.value}
                      </span>
                    </p>
                    <div className="flex gap-0.5 items-center">
                      <EditButton
                        onClick={() => {
                          editorRef.current = field
                          setDialogOpen(true)
                        }}
                      />
                      <RemoveButton
                        title={`${field.name}: ${field.value}`}
                        onRemove={() => array.remove(index)}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          </FormControl>
          <UserStyleDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={upsert}
            variable={editorRef.current}
            exclude={selectedList}
          />
        </FormItem>
      )}
    />
  )
}

type UserStyleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (variable: UserStyleType) => void
  variable: UserStyleType & { _id?: string }
  exclude: STYLE_VARIABLE[]
}

export const UserStyleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  variable,
  exclude,
}: UserStyleDialogProps) => {
  const isUpdate = variable._id != null
  const form = useForm<UserStyleType>({
    resolver: zodResolver(userStyleSchema),
    mode: "onChange",
    defaultValues: variable,
  })
  const { reset, watch, setValue } = form
  const variableName = watch("name")
  const attr = Attributes[variableName]

  useEffect(() => {
    reset(variable)
  }, [variable])

  useEffect(() => {
    if (!isUpdate) {
      setValue("value", Attributes[variableName]?.default)
    }
  }, [variableName])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <Paintbrush />
              {t("userStyles_add")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>{t("userStyles_add_desc")}</DialogDescription>
          <Form {...form}>
            <div id="UserStyleDialog" className="flex gap-2 mt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    {isUpdate ? (
                      <div>
                        <FormLabel>{t("userStyles_name")}</FormLabel>
                        <p className="py-2 h-10 mt-2 text-base">
                          {t(
                            `userStyles_option_${hyphen2Underscore(field.value)}`,
                          )}
                        </p>
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormLabel>{t("userStyles_name")}</FormLabel>
                        <FormControl>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder={t("userStyles_value")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(STYLE_VARIABLE)
                            .filter((opt) => isEditable(opt))
                            .filter((opt) => !exclude.includes(opt))
                            .map((opt) => (
                              <SelectItem
                                value={opt}
                                key={opt}
                                className="hover:bg-gray-100"
                              >
                                {t(
                                  `userStyles_option_${hyphen2Underscore(opt)}`,
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormDescription className="m-1">
                      {t(`userStyles_desc_${hyphen2Underscore(field.value)}`)}
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>{t("userStyles_value")}</FormLabel>
                    <FormControl>
                      <Input
                        className="mt-2"
                        unit={Units[variableName]}
                        {...field}
                        {...attr}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="lg" type="button" variant="secondary">
                {t("labelCancel")}
              </Button>
            </DialogClose>
            <Button
              size="lg"
              type="button"
              onClick={form.handleSubmit((data) => {
                onSubmit(data)
                onOpenChange(false)
              })}
            >
              <Save />
              {isUpdate ? t("labelUpdate") : t("labelSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
