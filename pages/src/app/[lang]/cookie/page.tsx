import ReactMarkdown from 'react-markdown'
import css from '@/app/page.module.css'
import { LangProps } from '@/types'
import { getDict } from '@/features/locale'

import en from './en'
import ja from './ja'
import pt_PT from './pt-PT'
import pt_BR from './pt-BR'
import id from './id'
import ms from './ms'
import zh_CN from './zh-CN'
import ru from './ru'
import it from './it'
import ko from './ko'
import fr from './fr'
import hi from './hi'
import es from './es'
import de from './de'

const LocaleMap = {
  en,
  ja,
  'pt-PT': pt_PT,
  'pt-BR': pt_BR,
  id,
  ms,
  'zh-CN': zh_CN,
  ru,
  it,
  ko,
  fr,
  hi,
  es,
  de,
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
