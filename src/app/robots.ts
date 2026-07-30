import type { MetadataRoute } from 'next'
import { config as siteConfig } from '~/site.config'
import { siteUrl } from '@lib/seo/url'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const disallow = siteConfig.seo?.noindexPaths ?? ['/notes/graph']
  // No llms.txt pointer here on purpose: Next's robots route emits a fixed
  // set of directives and cannot carry comments, and llms.txt lives at a
  // fixed well-known path anyway — an agent finds it the same way it finds
  // this file. Mirrors are advertised per-page via `rel="alternate"`.
  return {
    rules: { userAgent: '*', allow: '/', disallow },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  }
}
