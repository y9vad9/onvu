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
    // Preserve any `#hash` and `?query` from the incoming URL when
    // bouncing through to the localised note page. Without this, a link
    // like `notes/education#section` written on a page like `/en` (which
    // resolves relatively to `/notes/education#section`) loses the hash
    // here and the destination loads at the top instead of scrolling to
    // the anchor.
    // Standard order: search first, then hash.
    const tail = window.location.search + window.location.hash
    router.replace(`/${locale}/notes/${params.slug}${tail}`)
  }, [router, params.slug])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-muted text-sm">Redirecting…</span>
    </div>
  )
}
