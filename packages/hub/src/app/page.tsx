"use client"

import { useEffect } from "react"
import { useLocale } from "@/hooks/useLocale"

export default function Home() {
  const { switchBrowserLocale } = useLocale()

  useEffect(() => {
    switchBrowserLocale()
  }, [switchBrowserLocale])

  // This page is just a redirect to the browser locale
  return null
}
