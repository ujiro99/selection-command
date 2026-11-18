"use client"

import { Globe } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { Labels } from "@/features/locale"
import type { LangType } from "@/types"
import css from "./LocaleSelector.module.css"

export function LocaleSelector(): JSX.Element {
  const { lang, switchLocale } = useLocale()

  return (
    <label className={css.root}>
      <Globe size={16} className={css.icon} aria-hidden="true" />
      <select
        className={css.select}
        value={lang}
        onChange={(e) => switchLocale(e.target.value as LangType)}
        aria-label="Languages"
      >
        {Object.entries(Labels).map(([key, name]) => (
          <option value={key} key={key}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}
