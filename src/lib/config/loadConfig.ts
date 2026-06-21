import { config as baseConfig } from '~/site.config'
import type { SiteConfig } from '@config/site'
import { deepMerge } from '@lib/deepMerge'

/**
 * Locale-scoped site config resolution.
 *
 *   site.config.ts          — required, the base/default everything starts from.
 *   site.<locale>.config.ts — optional, exports a `Partial<SiteConfig>` that
 *                             deep-merges on top of the base for that locale.
 *
 * A user-facing string that should differ per locale (owner.bio, a job
 * title in home.workExperience[0].role, the description on a project)
 * goes in the per-locale file; anything that's the same everywhere
 * (logos, URLs, social handles, seo.twitterHandle) stays in the base.
 *
 * Both objects pass through `deepMerge`, so the per-locale file only
 * needs to mention keys that change — sibling fields keep their base
 * values, missing locales fall through to the base entirely.
 *
 * Results are cached per-locale; the merge is pure so repeated calls
 * during one render pass don't pay the cost twice.
 */

type PartialSiteConfig = Partial<SiteConfig>
const cache = new Map<string, SiteConfig>()

export async function loadSiteConfig(locale: string): Promise<SiteConfig> {
  const cached = cache.get(locale)
  if (cached) return cached

  let override: PartialSiteConfig = {}
  try {
    // Dynamic template-literal import — Next.js / webpack creates a chunk
    // per `site.*.config.{ts,js}` file it can find at build time, so the
    // file just has to exist at the root for this to resolve.
    const mod = (await import(/* webpackChunkName: "site-config-[request]" */ `~/site.${locale}.config`)) as {
      config?: PartialSiteConfig
      default?: PartialSiteConfig
    }
    override = (mod.config ?? mod.default ?? {}) as PartialSiteConfig
  } catch {
    // No override file for this locale — base config is fine.
  }

  const merged = deepMerge(
    baseConfig as unknown as Record<string, unknown>,
    override as unknown as Record<string, unknown>,
  ) as unknown as SiteConfig

  cache.set(locale, merged)
  return merged
}

/** Test helper — drop the cache so tests with different locales don't
 *  fight each other. Production code never needs this. */
export function __clearSiteConfigCache(): void {
  cache.clear()
}
