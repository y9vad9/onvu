import type { MetadataRoute } from 'next'
import { config as siteConfig } from '~/site.config'
import { siteUrl } from '@lib/seo/url'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const disallow = siteConfig.seo?.noindexPaths ?? ['/notes/graph']
  return {
    rules: { userAgent: '*', allow: '/', disallow },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  }
}
