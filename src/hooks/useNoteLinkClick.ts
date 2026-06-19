'use client'

import { useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTabStore } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'

/**
 * Returns an onClick handler for a `<Link>` that points to a note.
 *
 * Behavior:
 * - Plain left-click: navigate, and if the currently-viewed note has a tab,
 *   rewrite that tab to point at the target. The current tab position is
 *   preserved; no new tab is created.
 * - Cmd/Ctrl+click (or middle-click): keep the current tab as-is, append a
 *   new tab for the target, and focus it. If the current view isn't a tab
 *   yet, pin it as one first so it stays accessible in the tab bar.
 */
export function useNoteLinkClick(slug: string, title: string) {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  return useCallback(
    (e: React.MouseEvent) => {
      // Prefer tabStore.activeSlug as the "current view" anchor — it tracks
      // both note pages (via NoteContextProvider) AND the singleton route
      // tabs (garden index, global graph) via RouteTabSync. The note
      // context store only knows about notes, so on a graph/welcome tab
      // its currentSlug is null and replaceActive would have nothing to
      // rewrite.
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
      const currentSlug = activeSlug ?? noteCtx.currentSlug

      // Honour whatever href the underlying <Link> declared — search results
      // and other surfaces add query strings (?q=…&hit=…) that the
      // destination uses to highlight the match. Reconstructing the URL from
      // `slug` alone would silently drop them, so Ctrl/Cmd-click lost the
      // search context that plain click preserved.
      const anchor = e.currentTarget as HTMLAnchorElement
      const href =
        anchor.getAttribute('href') || `/${params.locale}/notes/${slug}`

      if (e.button === 1) {
        e.preventDefault()
        useTabStore.getState().openInNewTab({ slug, title }, current)
        return
      }
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        useTabStore.getState().openInNewTab({ slug, title }, current)
        router.push(href)
        return
      }
      // Plain click: let <Link> navigate, but rewrite the active tab.
      useTabStore.getState().replaceActive({ slug, title }, currentSlug)
    },
    [slug, title, router, params],
  )
}
