import { describe, it, expect, beforeEach } from 'vitest'

// We can't easily mock `~/site.config` (the module is resolved before
// vitest sets up its mocks for some import orderings), so this test
// suite leans on the real base config and just asserts the merge
// behaviour around it.
import { loadSiteConfig, __clearSiteConfigCache } from '@lib/config/loadConfig'

beforeEach(() => {
  __clearSiteConfigCache()
})

describe('loadSiteConfig', () => {
  it('returns the base config when no per-locale override exists', async () => {
    const cfg = await loadSiteConfig('xx-no-such-locale')
    // Pulled from site.config.ts — owner.name and locales should be set.
    expect(cfg.owner.name).toBeTruthy()
    expect(cfg.locales.supported.length).toBeGreaterThan(0)
  })

  it('caches per-locale results (identity preserved)', async () => {
    const a = await loadSiteConfig('xx-cache-test')
    const b = await loadSiteConfig('xx-cache-test')
    expect(a).toBe(b)
  })

  it('separate locales get separate cache entries', async () => {
    const a = await loadSiteConfig('xx-aaa')
    const b = await loadSiteConfig('xx-bbb')
    // Same shape (both fall through to base) but different cached
    // objects so future mutations don't bleed across locales.
    expect(a).not.toBe(b)
    expect(a.owner.name).toBe(b.owner.name)
  })

  it('cache clear forces a fresh merge', async () => {
    const a = await loadSiteConfig('xx-clear-test')
    __clearSiteConfigCache()
    const b = await loadSiteConfig('xx-clear-test')
    expect(a).not.toBe(b) // new merged object
    expect(a.owner.name).toBe(b.owner.name) // but same content
  })
})

