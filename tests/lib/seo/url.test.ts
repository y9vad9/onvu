import { describe, it, expect } from 'vitest'
import { absoluteUrl, localizedPath, noteUrl, siteUrl } from '@lib/seo/url'

describe('seo/url', () => {
  it('siteUrl strips trailing slashes', () => {
    expect(siteUrl().endsWith('/')).toBe(false)
  })

  it('absoluteUrl prepends siteUrl and normalises leading slash', () => {
    expect(absoluteUrl('/notes')).toBe(`${siteUrl()}/notes`)
    expect(absoluteUrl('notes')).toBe(`${siteUrl()}/notes`)
  })

  it('absoluteUrl passes through fully-qualified URLs', () => {
    expect(absoluteUrl('https://example.com/x')).toBe('https://example.com/x')
  })

  it('localizedPath prefixes once', () => {
    expect(localizedPath('en', '/notes')).toBe('/en/notes')
    expect(localizedPath('en', 'notes')).toBe('/en/notes')
    expect(localizedPath('en', '/en/notes')).toBe('/en/notes')
    expect(localizedPath('en')).toBe('/en')
  })

  it('noteUrl composes everything', () => {
    expect(noteUrl('en', 'foo')).toBe(`${siteUrl()}/en/notes/foo`)
  })
})
