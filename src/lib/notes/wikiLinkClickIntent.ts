import type { TabKind } from '@store/tabStore'

export interface ClickEventLike {
  button: number
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export interface AnchorMeta {
  /** Slug parsed from data-note-slug. Empty/null bails the intent to 'ignore'. */
  noteSlug: string | null
  /** href attribute (or any fallback URL the caller computed). */
  href: string
  /** Visible link text — used as the tab title when we pin. */
  title: string
  /** Whether the rendered anchor was marked wikilink-broken. */
  broken: boolean
}

export interface IntentContext {
  current: { slug: string; title: string; kind?: TabKind } | null
  currentSlug: string | null
}

export type WikiLinkIntent =
  | { kind: 'ignore' }                        // not our concern; bubble
  | { kind: 'broken' }                        // preventDefault, no-op
  | { kind: 'browser' }                       // let the browser handle (shift / alt / right click)
  | { kind: 'replace'; target: { slug: string; title: string }; currentSlug: string | null; href: string }
  | { kind: 'open-new-tab'; target: { slug: string; title: string }; current: IntentContext['current']; href: string }
  | { kind: 'open-background'; target: { slug: string; title: string }; current: IntentContext['current'] }

/**
 * Pure decision function for what should happen when the user clicks a
 * rendered wiki anchor (an `<a data-note-slug>` inside note bodies).
 * Extracted from the DOM-bound handler in ArticleEnhancer so the matrix
 * of (button × modifier × broken × no-slug) can be unit-tested without
 * jsdom event plumbing.
 *
 * The caller (ArticleEnhancer) translates the returned intent into the
 * appropriate tabStore action + router.push:
 *   - 'ignore' / 'browser': do nothing, let the event bubble.
 *   - 'broken': preventDefault, no navigation.
 *   - 'replace': replaceActive + router.push.
 *   - 'open-new-tab': openInNewTab + router.push.
 *   - 'open-background': openInNewTab only (middle-click pin).
 */
export function decideWikiClickIntent(
  e: ClickEventLike,
  anchor: AnchorMeta,
  ctx: IntentContext,
): WikiLinkIntent {
  if (!anchor.noteSlug) return { kind: 'ignore' }
  if (anchor.broken) return { kind: 'broken' }
  // Modifier-aware fall-throughs: shift / alt clicks open in a new
  // window or trigger save-as in the browser. Right-clicks invoke the
  // context menu. We don't want to intercept those.
  if (e.button !== 0 && e.button !== 1) return { kind: 'browser' }
  if (e.shiftKey || e.altKey) return { kind: 'browser' }

  const target = { slug: anchor.noteSlug, title: anchor.title }
  if (e.button === 1) {
    return { kind: 'open-background', target, current: ctx.current }
  }
  if (e.metaKey || e.ctrlKey) {
    return { kind: 'open-new-tab', target, current: ctx.current, href: anchor.href }
  }
  return { kind: 'replace', target, currentSlug: ctx.currentSlug, href: anchor.href }
}
