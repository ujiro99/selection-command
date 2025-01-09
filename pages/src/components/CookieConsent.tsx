'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { CookieIcon, ChevronsRight } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { LangProps } from '@/types'
import { getDict } from '@/features/locale'

const KEY = 'cookieConsent'

/**
 * Set a cookie.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} days - The number of days until the cookie expires.
 */
function setCookie(name: string, value: string, days: number) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000) // days -> milliseconds
  const expires = 'expires=' + date.toUTCString()
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict`
}

function getCookie(name: string) {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

type Props = LangProps

export function CookieConsent({ lang }: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [hide, setHide] = useState(false)
  const [consentMode, setConsentMode] = useState<boolean | null>(null)
  const about = getDict(lang).about
  const t = getDict(lang).cookieConsent

  const accept = () => {
    setCookie(KEY, 'true', 365)
    setConsentMode(true)
    setIsOpen(false)
    setTimeout(() => {
      setHide(true)
    }, 200)
  }

  const decline = () => {
    setCookie(KEY, 'false', 365)
    setConsentMode(false)
    setIsOpen(false)
    setTimeout(() => {
      setHide(true)
    }, 200)
  }

  useEffect(() => {
    const now = getCookie(KEY) === 'true'
    setConsentMode(now)
    try {
      setIsOpen(true)
      if (document.cookie.includes(`${KEY}=`)) {
        setIsOpen(false)
        setTimeout(() => {
          setHide(true)
        }, 200)
      }
    } catch (e) {
      console.debug('Error: ', e)
    }
  }, [])

  useEffect(() => {
    if (consentMode !== null) {
      const newValue = consentMode ? 'granted' : 'denied'
      console.debug('Consent mode: ', newValue)
      window.gtag('consent', 'update', {
        ad_storage: newValue,
        ad_user_data: newValue,
        ad_personalization: newValue,
        analytics_storage: newValue,
        functional_storage: newValue,
      })
    }
  }, [consentMode])

  return (
    <>
      <Script id="gtm-consent-mode">
        {`window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer?.push(arguments); }
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `}
      </Script>
      <div
        className={cn(
          'fixed z-[200] bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700',
          !isOpen
            ? 'transition-[opacity,transform] translate-y-8 opacity-0 duration-200'
            : 'transition-[opacity,transform] translate-y-0 opacity-100',
          hide && 'hidden',
        )}
      >
        <div className="m-3 p-1 dark:bg-card bg-background border border-border rounded-lg">
          <div className="flex items-center px-3 py-2 gap-2">
            <CookieIcon className="fill-orange-200" size={18} />
            <h1 className="text-lg font-medium">{t.title}</h1>
          </div>
          <div className="px-3">
            <p className="text-sm text-left text-stone-600">{t.message}</p>
            <Link
              className={cn('flex items-center mt-2', 'text-sm text-stone-600')}
              href={`/${lang}/cookie`}
            >
              <ChevronsRight className="inline mr-1" size={16} />
              <span>{about.cookie}</span>
            </Link>
          </div>
          <div className="px-8 pt-3 py-3 flex items-center gap-4">
            <Button
              onClick={accept}
              className="w-full h-9 rounded-full font-bold shadow-md"
            >
              {t.accept}
            </Button>
            <Button
              onClick={decline}
              className="w-full h-9 rounded-full"
              variant="outline"
            >
              {t.decline}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
