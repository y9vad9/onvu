import { config as siteConfig } from '~/site.config'

/** Canonical origin without trailing slash. Reads `seo.siteUrl`, falls back to env, then localhost. */
export function siteUrl(): string {
  const raw =
    siteConfig.seo?.siteUrl ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  if (!path) return siteUrl()
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path
  const normalised = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl()}${normalised}`
}

/** Prepend a locale prefix once and only once. */
export function localizedPath(locale: string, path = '/'): string {
  const trimmed = path.replace(/^\/+/, '')
  const prefix = `${locale}/`
  if (trimmed.startsWith(prefix) || trimmed === locale) {
    return `/${trimmed}`
  }
  return trimmed === '' ? `/${locale}` : `/${locale}/${trimmed}`
}

export function noteUrl(locale: string, slug: string): string {
  return absoluteUrl(localizedPath(locale, `notes/${slug}`))
}
