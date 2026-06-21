'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { SiteConfig } from '@config/site'

/**
 * Distributes the locale-merged site config to client components without
 * forcing them to import `site.config.ts` directly (which would always
 * give them the base, not the per-locale resolved version).
 *
 * The provider is mounted once at the `[locale]/layout.tsx` boundary
 * where the server has already awaited `loadSiteConfig(locale)`; from
 * there every client component reaches the resolved config via
 * `useSiteConfig()`.
 */
const Ctx = createContext<SiteConfig | null>(null)

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig
  children: ReactNode
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSiteConfig(): SiteConfig {
  const v = useContext(Ctx)
  if (!v) {
    throw new Error(
      'useSiteConfig() called outside <SiteConfigProvider>. Wrap the tree in [locale]/layout.tsx with the provider populated from loadSiteConfig(locale).',
    )
  }
  return v
}
