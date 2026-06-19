import type { MetadataRoute } from 'next'
import { createRepository } from '@adapters/createRepositories'
import { listAllNotes } from '@core/ListNotes'
import { routing } from '@i18n/routing'
import { config as siteConfig } from '~/site.config'
import { absoluteUrl, localizedPath } from '@lib/seo/url'

const NOINDEX = new Set(siteConfig.seo?.noindexPaths ?? ['/notes/graph'])

function languagesFor(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const l of routing.locales) out[l] = absoluteUrl(localizedPath(l, path))
  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    entries.push({
      url: absoluteUrl(localizedPath(locale, '/')),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: languagesFor('/') },
    })
    if (!NOINDEX.has('/notes')) {
      entries.push({
        url: absoluteUrl(localizedPath(locale, '/notes')),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: languagesFor('/notes') },
      })
    }
  }

  const perLocaleNotes = await Promise.all(
    routing.locales.map(async (locale) => {
      const notes = await listAllNotes(createRepository(locale))
      return notes
        .filter((n) => !n.noindex && !NOINDEX.has(`/notes/${n.slug}`))
        .map((n) => ({
          url: absoluteUrl(localizedPath(locale, `/notes/${n.slug}`)),
          lastModified: n.updated ?? n.date ?? now,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
          alternates: { languages: languagesFor(`/notes/${n.slug}`) },
        }))
    }),
  )

  return [...entries, ...perLocaleNotes.flat()]
}
