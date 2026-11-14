import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Languages } from "@/features/locale"

import css from "@/app/page.module.css"

type Props = {
  children: React.ReactNode
}

export function generateStaticParams() {
  return Languages.map((lang) => ({ lang }))
}

export default async function LangLayout(props: Props) {
  const { children } = props
  return (
    <div className={css.container}>
      <Header />
      {children}
      <Footer />
    </div>
  )
}
