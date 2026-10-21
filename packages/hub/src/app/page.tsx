import type { Metadata } from "next"
import { MovedNotice } from "@/components/MovedNotice"

export const metadata: Metadata = {
  title: "Moved | Selection Command Hub",
}

export default function RootPage(): JSX.Element {
  return <MovedNotice />
}
