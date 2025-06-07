import ReactMarkdown from 'react-markdown'
import css from '@/app/page.module.css'
import { LangProps } from '@/types'
import { getDict } from '@/features/locale'

import en from './en'
import ja from './ja'
import de from './de'
import es from './es'
import fr from './fr'
import hi from './hi'
import id from './id'
import it from './it'
import ko from './ko'
import ms from './ms'
import pt_BR from './pt-BR'
import pt_PT from './pt-PT'
import ru from './ru'
import zh_CN from './zh-CN'

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
  'pt-BR': pt_BR,
  'pt-PT': pt_PT,
  ru,
  'zh-CN': zh_CN,
} as const

type Props = LangProps

export default async function PrivacyPolicy({
  params,
}: {
  params: Promise<Props>
}) {
  const { lang } = await params
  const t = getDict(lang).about
  const policy = LocaleMap[lang]
  return (
    <section className="w-full lg:w-[700px]">
      <h1 className={`${css.pageTitleBold} text-center mt-8`}>{t.privacy}</h1>
      <ReactMarkdown className="mt-8 prose pros-stone">{policy}</ReactMarkdown>
    </section>
  )
}
