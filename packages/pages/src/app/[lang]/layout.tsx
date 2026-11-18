import { Languages } from "@/features/locale"

type Props = {
  children: React.ReactNode
}

export function generateStaticParams() {
  return Languages.map((lang) => ({ lang }))
}

/**
 * Language segment. Site pages get the header and footer from the (site)
 * group; store images render bare at 1280x800.
 */
export default function LangLayout(props: Props) {
  return props.children
}
