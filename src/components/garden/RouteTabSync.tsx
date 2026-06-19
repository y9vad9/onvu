'use client'

import { useEffect } from 'react'
import { useTabStore, type TabKind } from '@store/tabStore'
import { useTabScrollRestore } from '@hooks/useTabScrollRestore'

/**
 * Keep the tab bar honest while the user is on a singleton route (garden
 * index, global graph), and persist its scroll position across tab
 * switches like notes do.
 *
 * Behaviour mirrors how notes work: arriving at the page does NOT auto-pin
 * a tab — that would clutter the bar with destinations the user didn't
 * choose to keep open. The user opts in to a persistent tab via
 * Cmd/Ctrl+click (or middle-click) on a link to the route. Once a tab
 * exists, we keep its title up-to-date (locale changes) and activate it
 * while the user is viewing the page.
 *
 * Note pages use NoteContextProvider for the equivalent active-tab sync
 * and ArticleEnhancer for the scroll-restore part.
 */
export function RouteTabSync({
  slug,
  title,
  kind,
}: {
  slug: string
  title: string
  kind: Exclude<TabKind, 'note'>
}) {
  useEffect(() => {
    const state = useTabStore.getState()
    const existing = state.tabs.find((t) => t.slug === slug)
    if (existing) {
      // Refresh title (e.g. user switched languages while the tab was open)
      // and focus the tab so the bar reflects the current view.
      if (existing.title !== title || existing.kind !== kind) {
        useTabStore.setState({
          tabs: state.tabs.map((t) =>
            t.slug === slug ? { ...t, title, kind } : t,
          ),
        })
      }
      state.setActiveTab(slug)
    } else {
      // No pinned tab for this route — just track the active slug so any
      // future ensureTab/openInNewTab gestures know what the current view
      // is. The tab bar correctly shows no highlight in this state.
      state.setActiveTab(slug)
    }
  }, [slug, title, kind])
  useTabScrollRestore(slug)
  return null
}
