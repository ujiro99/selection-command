import data from "@/data/analytics.json"
import { Separator } from "@/components/ui/separator"
import { LocaleSelector } from "@/components/LocaleSelector"
import { LangProps } from "@/types"

type Props = LangProps

export function Footer(props: Props): JSX.Element {
  const { lang } = props
  const { updated } = data
  const updatedDate = new Date(updated)
  return (
    <footer className="w-full mt-8">
      <Separator />
      <div className="flex flex-col gap-4 items-center py-8 text-stone-500">
        <p className="text-center">
          <span>© 2024 Selection Command</span>
          <br />
          <span className="text-stone-500 text-xs" data-updated={updated}>
            Last Updated: {updatedDate.toLocaleDateString(lang)}
          </span>
        </p>
      </div>
      <LocaleSelector />
    </footer>
  )
}
