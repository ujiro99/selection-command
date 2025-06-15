import type { Metadata } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'
import localFont from 'next/font/local'
import { LanguageProvider } from '@/components/LanguageProvider'

import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Selection Command Hub',
  description: 'A site for sharing Selection commands',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html>
      <head>
        {/* Google Search Console verification */}
        <meta
          name="google-site-verification"
          content="MhXlQWtyoEkz6jOLkdC4V2aXrZVn1xWFDyV3slv5QBA"
        />
        <GoogleTagManager gtmId="GTM-5RLTNM22" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50  text-stone-700`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
