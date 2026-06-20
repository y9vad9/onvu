import { describe, it, expect } from 'vitest'
import robots from '../../src/app/robots'

describe('robots', () => {
  it('emits a single rules block allowing /', () => {
    const r = robots()
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/' })
  })

  it('disallows the configured noindex paths (default includes /notes/graph)', () => {
    const r = robots()
    const disallow = Array.isArray((r.rules as { disallow: unknown }).disallow)
      ? ((r.rules as { disallow: string[] }).disallow)
      : [(r.rules as { disallow: string }).disallow]
    expect(disallow).toContain('/notes/graph')
  })

  it('points at the sitemap', () => {
    const r = robots()
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})
