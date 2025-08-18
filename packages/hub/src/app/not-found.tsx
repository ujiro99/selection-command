"use client"

import { Image } from "@/components/Image"
import { useLocale } from "@/hooks/useLocale"
import { getDict } from "@/features/locale"

export default function NotFound() {
  const { browserLang } = useLocale()
  const t = getDict(browserLang).notFound

  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex items-center gap-1.5 text-3xl font-[family-name:var(--font-geist-mono)] font-medium">
        <h1 className="text-4xl">404 {t.title}</h1>
      </header>
      <div className="flex felx-row items-center justify-center w-full text-center font-[family-name:var(--font-geist-mono)]">
        <p className="text-2xl mt-[-60px] whitespace-break-spaces">
          {t.message}
        </p>
        <Image
          src="/ozigi_suit_man_simple.png"
          alt="404 Not found"
          className="ml-8"
          width={80}
          height={280}
          loading="lazy"
        />
      </div>
    </div>
  )
}
