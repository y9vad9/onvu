import { useTabStore, type TabKind } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'

export interface CurrentTabAnchor {
  /** Tab-shaped object suitable for passing to openInNewTab as `current`. */
  current: { slug: string; title: string; kind?: TabKind } | null
  /** Slug to pass to replaceActive as `currentSlug`. */
  currentSlug: string | null
}

/**
 * Resolves "what tab is the user on right now" from the two stores that
 * track it. The tab store is the source of truth because it knows about
 * all three tab kinds (note, index, graph); the note-context store only
 * knows about notes and is used as a fallback when no tab is pinned (e.g.
 * the user came in via a direct link).
 *
 * Used by NoteLink, RouteLink and the ArticleEnhancer wiki-link delegate.
 * Centralising it ensures all three honour the same precedence — the bug
 * where graph/welcome tabs failed to participate came from one of the
 * three reading only the note-context store.
 */
export function getCurrentTabAnchor(): CurrentTabAnchor {
  const tabState = useTabStore.getState()
  const activeSlug = tabState.activeSlug
  const activeTab = activeSlug
    ? tabState.tabs.find((t) => t.slug === activeSlug)
    : null
  const noteCtx = useNoteContextStore.getState()
  const current = activeTab
    ? { slug: activeTab.slug, title: activeTab.title, kind: activeTab.kind }
    : noteCtx.currentSlug && noteCtx.currentTitle
      ? { slug: noteCtx.currentSlug, title: noteCtx.currentTitle }
      : null
  return {
    current,
    currentSlug: activeSlug ?? noteCtx.currentSlug,
  }
}
