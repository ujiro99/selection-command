import { Footer } from "@/components/layout/Footer"
import {
  isSupportedLang,
  DefaultLanguage,
  Languages,
  type LanguageType,
} from "@/features/locale"
import { Header } from "@/components/layout/Header"
import { CookieConsent } from "@/components/CookieConsent"

import css from "@/app/page.module.css"

export function generateStaticParams() {
  return Languages.map((lang) => ({ lang }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function LangLayout(props: Props) {
  const { children, params } = props
  const { lang: langParam } = await params
  const lang: LanguageType = isSupportedLang(langParam)
    ? langParam
    : DefaultLanguage
  return (
    <div className={css.container}>
      <Header lang={lang} />
      {children}
      <Footer lang={lang} />
      <CookieConsent lang={lang} />
    </div>
  )
}
