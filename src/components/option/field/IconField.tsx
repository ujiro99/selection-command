import React, { useState, useRef } from "react"
import { useController } from "react-hook-form"
import { FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MenuImage } from "@/components/menu/MenuImage"
import { isEmpty, isValidSVG } from "@/lib/utils"
import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type IconField = {
  control: any
  nameUrl: string
  nameSvg: string
  formLabel: string
  placeholder?: string
  description?: string
}

import { useFavicon } from "@/hooks/option/useFavicon"

export const IconField = ({
  control,
  nameUrl,
  nameSvg,
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
  const errUrl = stateUrl.errors[nameUrl]
  const errSvg = stateSvg.errors[nameSvg]

  return (
    <div className="flex items-center gap-1">
      <div className="w-2/6">
        <FormLabel>{formLabel}</FormLabel>
        {description && <FormDescription>{description}</FormDescription>}
      </div>
      <div className="w-4/6 relative">
        <IconUrlInput
          fieldUrl={fieldUrl}
          fieldSvg={fieldSvg}
          placeholder={placeholder}
        />
        <FormMessage />
        {(errUrl || errSvg) && (
          <p className="text-[0.8rem] font-medium text-destructive">
            {errUrl && <span>{`${errUrl.message}`}</span>}
            {errSvg && <span>{`${errSvg.message}`}</span>}
          </p>
        )}
      </div>
    </div>
  )
}

type IconUrlInputType = {
  fieldUrl: any
  fieldSvg: any
  placeholder?: string
  onAutoFill?: (value: string) => void
}

const IconUrlInput = ({
  fieldUrl,
  fieldSvg,
  placeholder,
}: IconUrlInputType) => {
  const { isLoading } = useFavicon()
  const svgRef = useRef<HTMLDivElement | null>(null)
  const hasUrl = !isEmpty(fieldUrl.value)
  const value = hasUrl ? fieldUrl.value : fieldSvg.value

  if (svgRef.current) {
    svgRef.current.innerHTML = fieldSvg.value
  }

  return isLoading ? (
    <Loading />
  ) : (
    <div>
      <MenuImage
        className="absolute top-[0.7em] left-[0.8em] w-6 h-6 rounded"
        src={fieldUrl.value}
        svg={fieldSvg.value}
        alt="Preview of image"
      />
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
