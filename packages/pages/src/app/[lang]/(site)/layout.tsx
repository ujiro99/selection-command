import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

import css from "@/app/page.module.css"

type Props = {
  children: React.ReactNode
}

/** Site pages (such as the e2e test page) with the header and footer. */
export default function SiteLayout(props: Props) {
  const { children } = props
  return (
    <div className={css.container}>
      <Header />
      {children}
      <Footer />
    </div>
  )
}
