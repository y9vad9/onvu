import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@components/shell/Header'
import { Footer } from '@components/shell/Footer'
import { ThemeProvider } from '@components/shell/ThemeProvider'
import { LandingBody } from '~/content/landing'
import { JsonLd } from '@components/seo/JsonLd'
import { breadcrumbsJsonLd, itemListJsonLd } from '@lib/seo/jsonLd'
import { baseMetadata } from '@lib/seo/metadata'
import { createRepository } from '@adapters/createRepositories'
import { listFeaturedNotes } from '@core/ListNotes'
import { config as siteConfig } from '~/site.config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    ...baseMetadata({ locale, path: '/' }),
    title: { absolute: `${siteConfig.owner.name} — ${t('notes')}` },
  }
}

/**
 * Thin shell. To customise what appears on the landing page,
 * edit `content/landing.tsx` — that file is treated as content
 * and will not be overwritten by upstream updates.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const featured = await listFeaturedNotes(
    createRepository(locale),
    siteConfig.navigation.featuredNotes,
  )

  return (
    <ThemeProvider>
      <JsonLd
        data={[
          breadcrumbsJsonLd([{ name: siteConfig.owner.name, href: `/${locale}` }]),
          itemListJsonLd(
            featured.map((n) => ({ slug: n.slug, title: n.title, date: n.date })),
            locale,
            t('notes'),
          ),
        ]}
      />
      <Header />
      <LandingBody locale={locale} />
      <Footer />
    </ThemeProvider>
  )
}
