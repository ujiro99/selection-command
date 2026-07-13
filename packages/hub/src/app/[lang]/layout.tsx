import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

import css from "@/app/page.module.css"

type Props = {
  children: React.ReactNode
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
