import { Footer } from '@/components/layout/Footer'
import { Languages } from '@/features/locale'
import { LangProps } from '@/types'
import { Header } from '@/components/layout/Header'

import css from '@/app/page.module.css'

export function generateStaticParams() {
  return Languages.map((lang) => ({ lang }))
}

type Props = {
  children: React.ReactNode
  params: Promise<LangProps>
}

export default async function LangLayout(props: Props) {
  const { children, params } = props
  const { lang } = await params
  return (
    <div className={css.container}>
      <Header lang={lang} />
      {children}
      <Footer />
    </div>
  )
}
