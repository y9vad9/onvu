import type { Metadata } from 'next'
import { config as siteConfig } from '~/site.config'
import { routing } from '@i18n/routing'
import { absoluteUrl, localizedPath, siteUrl } from './url'

/**
 * Build the base metadata block applied to every page. Routes spread the
 * result of this and override only what's specific to them (canonical,
 * page-specific title/description, article fields, etc).
 */
export function baseMetadata({
  locale,
  path = '/',
}: {
  locale: string
  path?: string
}): Metadata {
  const canonical = absoluteUrl(localizedPath(locale, path))
  const languages: Record<string, string> = {
    'x-default': absoluteUrl(localizedPath(routing.defaultLocale, path)),
  }
  for (const l of routing.locales) {
    languages[l] = absoluteUrl(localizedPath(l, path))
  }

  const ogImage = siteConfig.seo?.defaultOgImage
  const twitterHandle = siteConfig.seo?.twitterHandle

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      template: `%s | ${siteConfig.owner.name}`,
      default: siteConfig.owner.name,
    },
    description: siteConfig.owner.bio,
    alternates: { canonical, languages },
    openGraph: {
      siteName: siteConfig.owner.name,
      locale,
      type: 'website',
      url: canonical,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      site: twitterHandle,
      creator: twitterHandle,
      images: ogImage ? [ogImage] : undefined,
    },
    verification: siteConfig.seo?.verification
      ? {
          google: siteConfig.seo.verification.google,
          other: {
            ...(siteConfig.seo.verification.bing
              ? { 'msvalidate.01': siteConfig.seo.verification.bing }
              : {}),
            ...(siteConfig.seo.verification.yandex
              ? { 'yandex-verification': siteConfig.seo.verification.yandex }
              : {}),
          },
        }
      : undefined,
  }
}
