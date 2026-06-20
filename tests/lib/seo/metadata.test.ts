import { describe, it, expect } from 'vitest'
import { baseMetadata } from '@lib/seo/metadata'
import { routing } from '@i18n/routing'

describe('baseMetadata', () => {
  it('emits a canonical and an entry per locale (plus x-default)', () => {
    const meta = baseMetadata({ locale: 'en', path: '/notes' })
    const langs = (meta.alternates?.languages ?? {}) as Record<string, string>
    expect(langs['x-default']).toMatch(new RegExp(`${routing.defaultLocale}/notes$`))
    for (const l of routing.locales) {
      expect(langs[l]).toMatch(new RegExp(`/${l}/notes$`))
    }
    expect(meta.alternates?.canonical).toMatch(/\/en\/notes$/)
  })

  it('sets a title template and a sensible default', () => {
    const meta = baseMetadata({ locale: 'en' })
    expect(meta.title).toMatchObject({ template: expect.stringMatching(/%s \| /) })
  })

  it('opens graph + twitter card derived from locale and config', () => {
    const meta = baseMetadata({ locale: 'uk', path: '/notes/foo' })
    const og = meta.openGraph as { locale?: string; type?: string } | undefined
    const tw = meta.twitter as { card?: string } | undefined
    expect(og?.locale).toBe('uk')
    expect(og?.type).toBe('website')
    expect(tw?.card).toBe('summary_large_image')
  })

  it('uses metadataBase from the siteUrl helper', () => {
    const meta = baseMetadata({ locale: 'en' })
    expect(meta.metadataBase).toBeInstanceOf(URL)
  })
})
