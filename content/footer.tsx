'use client'

import { useTranslations } from 'next-intl'
import { useSiteConfig } from '@lib/config/SiteConfigProvider'

/**
 * Footer body — edit freely. This file is user-owned (see `.gitattributes`).
 *
 * Examples:
 *  - Add a "Built with Onvu" credit: append a `<span>` to the copy.
 *  - Add a row of social icons: import `HeroSocials` from
 *    `../src/components/portfolio/Hero` and render it with your own list.
 *  - Add columns of links: replace the `<footer>` body with a grid.
 */
export function FooterBody() {
  const t = useTranslations('footer')
  const siteConfig = useSiteConfig()
  const year = new Date().getFullYear()
  return (
    <footer className="py-6 text-center text-sm text-muted border-t border-border mt-auto">
      {t('copyright', { year, name: siteConfig.owner.name })}
    </footer>
  )
}
