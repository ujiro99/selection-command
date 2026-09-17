import React, { useState } from "react"
import type { CSSProperties } from "react"
import { useController } from "react-hook-form"
import { FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { MenuImage } from "@/components/menu/MenuImage"
import { InfoTooltip } from "./InfoTooltip"
import { useFavicon } from "@/hooks/option/useFavicon"
import { useGlobalIconColor } from "@/hooks/option/useGlobalIconColor"
import { popupContext, usePopupContext } from "@/hooks/usePopupContext"
import { isEmpty, isValidSVG, cn } from "@/lib/utils"
import { shouldPreserveIconColor } from "@/lib/favicon"
import { t as _t } from "@/services/i18n"
import type { CommandFolder } from "@/types"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

/** Form field name of the manual exclusion flag, tied to the stored property. */
const EXCLUDE_FIELD_NAME =
  "excludeFromGlobalIconColor" satisfies keyof CommandFolder

type IconField = {
  control: any
  nameUrl: string
  nameSvg: string
  nameExclude?: string
  formLabel: string
  placeholder?: string
  description?: string
}

export const IconField = ({
  control,
  nameUrl,
  nameSvg,
  nameExclude = EXCLUDE_FIELD_NAME,
  formLabel,
  description,
  placeholder,
}: IconField) => {
  const { field: fieldUrl, formState: stateUrl } = useController({
    name: nameUrl,
    control,
  })
  const { field: fieldSvg, formState: stateSvg } = useController({
    name: nameSvg,
    control,
  })
  const { field: fieldExclude } = useController({
    name: nameExclude,
    control,
  })
  const errUrl = stateUrl.errors[nameUrl]
  const errSvg = stateSvg.errors[nameSvg]

  return (
    <div className="flex items-start gap-1">
      <div className="w-2/6 pt-2">
        <FormLabel>{formLabel}</FormLabel>
        {description && <FormDescription>{description}</FormDescription>}
      </div>
      <div className="w-4/6 relative space-y-2">
        <IconUrlInput
          fieldUrl={fieldUrl}
          fieldSvg={fieldSvg}
          excludeFromGlobalIconColor={!!fieldExclude?.value}
          placeholder={placeholder}
        />
        <FormMessage />
        {(errUrl || errSvg) && (
          <p className="text-[0.8rem] font-medium text-destructive">
            {errUrl && <span>{`${errUrl.message}`}</span>}
            {errSvg && <span>{`${errSvg.message}`}</span>}
          </p>
        )}
        <GlobalIconColorToggle
          name={nameExclude}
          field={fieldExclude}
          iconUrl={fieldUrl?.value}
        />
      </div>
    </div>
  )
}

type GlobalIconColorToggleProps = {
  name: string
  field: { value?: boolean; onChange: (value: boolean) => void }
  iconUrl?: string
}

/**
 * Lets the user keep an icon's original colors. Icons detected as favicons or
 * brand assets are preserved automatically and cannot be toggled off.
 */
const GlobalIconColorToggle = ({
  name,
  field,
  iconUrl,
}: GlobalIconColorToggleProps) => {
  const isAutoPreserved = shouldPreserveIconColor({ url: iconUrl })

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-1.5">
        <FormLabel
          htmlFor={name}
          className={cn(
            "text-sm font-normal",
            isAutoPreserved
              ? "cursor-default text-muted-foreground"
              : "cursor-pointer",
          )}
        >
          {t("excludeFromGlobalIconColor")}
        </FormLabel>
        {isAutoPreserved && (
          <span
            data-testid="favicon-automatic-badge"
            className="text-[11px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium leading-none"
          >
            {t("excludeFromGlobalIconColor_automatic")}
          </span>
        )}
        <InfoTooltip
          testId="exclude-icon-color-info"
          text={
            isAutoPreserved
              ? t("excludeFromGlobalIconColor_favicon_desc")
              : t("excludeFromGlobalIconColor_desc")
          }
        />
      </div>
      <Switch
        id={name}
        aria-label={t("excludeFromGlobalIconColor")}
        disabled={isAutoPreserved}
        checked={isAutoPreserved || !!field?.value}
        onCheckedChange={field?.onChange}
      />
    </div>
  )
}

type IconUrlInputType = {
  fieldUrl: any
  fieldSvg: any
  excludeFromGlobalIconColor?: boolean
  placeholder?: string
  onAutoFill?: (value: string) => void
}

const IconUrlInput = ({
  fieldUrl,
  fieldSvg,
  excludeFromGlobalIconColor,
  placeholder,
}: IconUrlInputType) => {
  const { isLoading } = useFavicon()
  const popup = usePopupContext()
  const { iconColor, hasIconColor } = useGlobalIconColor()
  const hasUrl = !isEmpty(fieldUrl.value)
  const value = hasUrl ? fieldUrl.value : fieldSvg.value

  return isLoading ? (
    <Loading />
  ) : (
    // The preview is rendered outside the popup, so the icon color variable
    // MenuImage paints with has to be provided here.
    <div style={{ "--sc-icon-color": iconColor } as CSSProperties}>
      <popupContext.Provider value={{ ...popup, hasIconColor }}>
        <MenuImage
          className="absolute top-[0.7em] left-[0.8em] w-6 h-6 rounded"
          src={fieldUrl.value}
          svg={fieldSvg.value}
          alt="Preview of image"
          excludeFromGlobalIconColor={excludeFromGlobalIconColor}
        />
      </popupContext.Provider>
      <UrlOrSvgInput
        value={value}
        placeholder={placeholder}
        onChange={(value) => {
          fieldUrl.onChange(value.url)
          fieldSvg.onChange(value.svg)
        }}
      />
    </div>
  )
}

const Loading = () => (
  <div className="cursor-wait w-full h-10 border border-input shadow-sm bg-gray-100 animate-pulse rounded-md" />
)

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

type FormValues = {
  url: string
  svg: string
}

type UrlOrSvgInputProps = {
  value: string
  placeholder?: string
  onChange: (value: FormValues) => void
}

const UrlOrSvgInput = ({
  value,
  placeholder,
  onChange,
}: UrlOrSvgInputProps) => {
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputText = event.target.value
    if (isValidUrl(inputText)) {
      onChange({ url: inputText, svg: "" })
    } else if (isValidSVG(inputText)) {
      onChange({ url: "", svg: inputText })
    } else {
      onChange({ url: inputText, svg: "" })
      if (inputText.length > 0) {
        setError(t("icon_error"))
      }
      return
    }
    setError(null)
  }

  return (
    <>
      <Input
        type="text"
        value={value || ""}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-10"
      />
      {error && (
        <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
      )}
    </>
  )
}
