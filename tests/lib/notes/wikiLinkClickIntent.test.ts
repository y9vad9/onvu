import { describe, it, expect } from 'vitest'
import {
  decideWikiClickIntent,
  type AnchorMeta,
  type ClickEventLike,
  type IntentContext,
} from '@lib/notes/wikiLinkClickIntent'

const anchor = (over: Partial<AnchorMeta> = {}): AnchorMeta => ({
  noteSlug: 'target',
  href: '/en/notes/target',
  title: 'Target',
  broken: false,
  ...over,
})

const event = (over: Partial<ClickEventLike> = {}): ClickEventLike => ({
  button: 0,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...over,
})

const ctx: IntentContext = {
  current: { slug: 'a', title: 'A', kind: 'note' },
  currentSlug: 'a',
}

describe('decideWikiClickIntent', () => {
  it('ignores when noteSlug is missing', () => {
    expect(decideWikiClickIntent(event(), anchor({ noteSlug: null }), ctx))
      .toEqual({ kind: 'ignore' })
  })

  it('flags broken wiki links so the caller can preventDefault', () => {
    expect(decideWikiClickIntent(event(), anchor({ broken: true }), ctx))
      .toEqual({ kind: 'broken' })
  })

  it('lets the browser handle right-clicks', () => {
    expect(decideWikiClickIntent(event({ button: 2 }), anchor(), ctx).kind)
      .toBe('browser')
  })

  it('lets the browser handle shift / alt clicks', () => {
    expect(decideWikiClickIntent(event({ shiftKey: true }), anchor(), ctx).kind)
      .toBe('browser')
    expect(decideWikiClickIntent(event({ altKey: true }), anchor(), ctx).kind)
      .toBe('browser')
  })

  it('returns replace on plain left click', () => {
    const out = decideWikiClickIntent(event(), anchor(), ctx)
    expect(out).toEqual({
      kind: 'replace',
      target: { slug: 'target', title: 'Target' },
      currentSlug: 'a',
      href: '/en/notes/target',
    })
  })

  it('returns open-new-tab on Ctrl-click', () => {
    const out = decideWikiClickIntent(event({ ctrlKey: true }), anchor(), ctx)
    expect(out.kind).toBe('open-new-tab')
    if (out.kind === 'open-new-tab') {
      expect(out.current).toEqual(ctx.current)
      expect(out.target).toEqual({ slug: 'target', title: 'Target' })
    }
  })

  it('returns open-new-tab on Cmd-click', () => {
    expect(decideWikiClickIntent(event({ metaKey: true }), anchor(), ctx).kind)
      .toBe('open-new-tab')
  })

  it('returns open-background on middle-click (button=1)', () => {
    const out = decideWikiClickIntent(event({ button: 1 }), anchor(), ctx)
    expect(out.kind).toBe('open-background')
    if (out.kind === 'open-background') {
      expect(out.current).toEqual(ctx.current)
    }
  })

  it('passes a null current through when no tab is active', () => {
    const out = decideWikiClickIntent(
      event({ ctrlKey: true }),
      anchor(),
      { current: null, currentSlug: null },
    )
    if (out.kind === 'open-new-tab') expect(out.current).toBeNull()
  })
})
