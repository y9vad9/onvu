import { getRequestConfig } from 'next-intl/server'
import type { AbstractIntlMessages } from 'next-intl'
import { routing } from './routing'
import type { Locale } from '@config/site'
import { deepMerge } from '@lib/deepMerge'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }

  // Built-in messages: the framework ships strings for `en` (and a few
  // other locales out of the box). If the user added a new locale to
  // `site.config.ts` but didn't add `messages/<locale>.json`, we fall back
  // to the primary locale's strings rather than crashing.
  let defaultMessages: AbstractIntlMessages
  try {
    defaultMessages = (
      (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages
    )
  } catch {
    defaultMessages = (
      (await import(`../../messages/${routing.defaultLocale}.json`)).default as AbstractIntlMessages
    )
  }

  // User overrides: anything in `content/i18n/<locale>.json` wins over the
  // framework defaults. Users can also add brand-new locales here without
  // touching the framework `messages/` folder.
  let userMessages: AbstractIntlMessages = {}
  try {
    userMessages = (
      await import(`../../content/i18n/${locale}.json`)
    ).default as AbstractIntlMessages
  } catch {
    // No overrides for this locale — that's fine
  }

  return {
    locale,
    messages: deepMerge(defaultMessages, userMessages),
  }
})
