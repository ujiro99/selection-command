import ReactMarkdown from 'react-markdown'
import css from '@/app/page.module.css'
import { LangProps } from '@/types'
import { getDict } from '@/features/locale'

import en from './en'
import ja from './ja'

const LocaleMap = {
  en,
  ja,
} as const

type Props = LangProps

export default async function Cookie({ params }: { params: Promise<Props> }) {
  const { lang } = await params
  const t = getDict(lang).about
  const policy = LocaleMap[lang]
  return (
    <section className="w-full lg:w-[700px]">
      <h1 className={`${css.pageTitleBold} text-center mt-8`}>{t.cookie}</h1>
      <ReactMarkdown className="mt-8 prose pros-stone">{policy}</ReactMarkdown>
    </section>
  )
}
