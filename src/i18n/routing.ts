import { defineRouting } from 'next-intl/routing'
import { config as siteConfig } from '~/site.config'
import type { Locale } from '@config/site'

export const LOCALES: Locale[] = siteConfig.locales.supported
export const DEFAULT_LOCALE: Locale = siteConfig.locales.primary

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
})
