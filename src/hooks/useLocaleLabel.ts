'use client'

import { useLocale, useMessages } from 'next-intl'

/**
 * Resolves a locale code to its display name in the current UI language.
 * Prefers a translation from the `language` namespace if present, otherwise
 * falls back to `Intl.DisplayNames` so users can add brand-new locales to
 * `site.config.ts` without also writing translation files.
 */
export function useLocaleLabel(): (target: string) => string {
  const messages = useMessages() as Record<string, Record<string, string> | undefined>
  const current = useLocale()
  return (target: string) => {
    const fromMessages = messages.language?.[target]
    if (fromMessages) return fromMessages
    try {
      return new Intl.DisplayNames([current], { type: 'language' }).of(target) ?? target
    } catch {
      return target
    }
  }
}
