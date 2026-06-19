'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LOCALES, DEFAULT_LOCALE } from '@i18n/routing'
import type { Locale } from '@config/site'

export default function LocaleFreeRedirect() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()

  useEffect(() => {
    let locale: Locale = DEFAULT_LOCALE
    try {
      const localeStored = localStorage.getItem('locale') as Locale | null
      if (localeStored && LOCALES.includes(localeStored)) {
        locale = localeStored
      } else {
        const browserLang = navigator.language.split('-')[0] as Locale
        if (LOCALES.includes(browserLang)) locale = browserLang
      }
    } catch {
      // localStorage not available
    }
    router.replace(`/${locale}/notes/${params.slug}`)
  }, [router, params.slug])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-muted text-sm">Redirecting…</span>
    </div>
  )
}
