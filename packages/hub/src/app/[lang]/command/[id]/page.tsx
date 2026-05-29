import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, House } from "lucide-react"
import { Image } from "@/components/Image"
import { CommandShare } from "@/components/CommandShare"
import { getCommands, getCommandById } from "@/features/command"
import {
  isSupportedLang,
  DefaultLanguage,
  type LanguageType,
} from "@/features/locale"
import { createCommandMetadata, defaultMetadata } from "@/features/metadata"
import { cn } from "@/lib/utils"
import commonCss from "@/lib/common.module.css"

import css from "@/app/page.module.css"

type Props = {
  lang: string
  id: string
}

export function generateStaticParams() {
  return getCommands().map((command) => ({ id: command.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Props>
}): Promise<Metadata> {
  const { lang: langParam, id } = await params
  const lang: LanguageType = isSupportedLang(langParam)
    ? langParam
    : DefaultLanguage
  const command = getCommandById(id)
  return command ? createCommandMetadata(command, lang) : defaultMetadata
}

export default async function Page({ params }: { params: Promise<Props> }) {
  const { lang: langParam, id } = await params
  const lang: LanguageType = isSupportedLang(langParam)
    ? langParam
    : DefaultLanguage
  const command = getCommandById(id)

  if (!command) {
    return (
      <main className={css.main}>
        <div className={css.menu}>
          <div>
            <Link href={`/${lang}`} className={cn(css.topLink, commonCss.hover)}>
              <ChevronLeft className="inline" />
              <House className="inline" size={16} />
              <span className="ml-0.5">Top</span>
            </Link>
          </div>
          <CommandShare lang={lang} />
        </div>
      </main>
    )
  }

  return (
    <main className={css.main}>
      <div className={css.menu}>
        <div>
          <Link href={`/${lang}`} className={cn(css.topLink, commonCss.hover)}>
            <ChevronLeft className="inline" />
            <House className="inline" size={16} />
            <span className="ml-0.5">Top</span>
          </Link>
        </div>
        <CommandShare lang={lang} />
      </div>
      <article className="w-full rounded-lg border border-stone-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Image
            src={command.iconUrl}
            alt={command.title}
            width={48}
            height={48}
            className="rounded-md"
          />
          <div>
            <h1 className="text-xl font-semibold">{command.title}</h1>
            <p className="text-sm text-stone-500">{command.id}</p>
          </div>
        </div>
        <p>{command.description}</p>
      </article>
    </main>
  )
}
