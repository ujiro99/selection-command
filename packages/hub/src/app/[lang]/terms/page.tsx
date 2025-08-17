import React from "react"
import ReactMarkdown from "react-markdown"
import css from "@/app/page.module.css"
import { LangProps } from "@/types"
import { getDict } from "@/features/locale"

import en from "./en"
import ja from "./ja"
import de from "./de"
import es from "./es"
import fr from "./fr"
import hi from "./hi"
import id from "./id"
import it from "./it"
import ko from "./ko"
import ms from "./ms"
import ptBR from "./pt-BR"
import ptPT from "./pt-PT"
import ru from "./ru"
import zhCN from "./zh-CN"

const LocaleMap = {
  en,
  ja,
  de,
  es,
  fr,
  hi,
  id,
  it,
  ko,
  ms,
  "pt-BR": ptBR,
  "pt-PT": ptPT,
  ru,
  "zh-CN": zhCN,
} as const

type Props = LangProps

export default async function Terms({ params }: { params: Promise<Props> }) {
  const { lang } = await params
  const t = getDict(lang).about
  const terms = LocaleMap[lang]

  return (
    <section className="w-full lg:w-[700px]">
      <h1 className={`${css.pageTitleBold} text-center mt-8`}>{t.terms}</h1>
      <ReactMarkdown className="mt-8 prose pros-stone">{terms}</ReactMarkdown>
    </section>
  )
}
