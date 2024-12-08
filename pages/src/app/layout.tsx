import type { Metadata } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'
import localFont from 'next/font/local'
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
    <html lang="en">
      <GoogleTagManager gtmId="GTM-5RLTNM22" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50`}
      >
        {children}
      </body>
    </html>
  )
}
