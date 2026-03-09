import { CommandList } from "@/components/layout/CommandList"
import { CommandShare } from "@/components/CommandShare"
import {
  isSupportedLang,
  DefaultLanguage,
  type LanguageType,
} from "@/features/locale"

import css from "@/app/page.module.css"

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang: LanguageType = isSupportedLang(langParam)
    ? langParam
    : DefaultLanguage
  return (
    <main className={css.main}>
      <div className={css.menu}>
        <div />
        <CommandShare lang={lang} />
      </div>
      <CommandList />
    </main>
  )
}
