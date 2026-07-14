import Link from "next/link"
import { NEW_HUB_URL } from "@/const"
import { MousePointer, SquareArrowOutUpRight } from "lucide-react"

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-2xl sm:text-3xl font-medium">
        <Link
          href={NEW_HUB_URL}
          className="hover:opacity-80 transition-opacity duration-200"
        >
          Selection
          <span className="bg-[#1597C9]/20 mx-1.5 px-1.5 pb-0.5 sm:py-0.5 rounded-lg relative">
            Command
            <MousePointer
              className="absolute -bottom-4 -right-4 fill-white"
              size={26}
            />
          </span>
          <span className="font-extralight ml-1">Hub</span>
        </Link>
      </h1>
      <p className="text-stone-500 mt-2 text-base sm:text-lg">
        is now available at
        <Link
          href={NEW_HUB_URL}
          className="text-[#1597C9] underline underline-offset-4 hover:text-[#1597C9]/80 ml-3"
        >
          <SquareArrowOutUpRight className="inline size-4 mr-1" />
          {NEW_HUB_URL}
        </Link>
      </p>
    </div>
  )
}
