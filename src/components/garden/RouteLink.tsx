'use client'

import Link from 'next/link'
import { forwardRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTabStore, type TabKind } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'

type LinkProps = React.ComponentProps<typeof Link>

interface RouteLinkProps extends Omit<LinkProps, 'onClick'> {
  /** Sentinel slug for this route (INDEX_TAB_SLUG or GRAPH_TAB_SLUG). */
  routeSlug: string
  routeTitle: string
  routeKind: Exclude<TabKind, 'note'>
  onClick?: (e: React.MouseEvent) => void
}

/**
 * A Next.js Link to a singleton route (garden index, global graph) that
 * mirrors NoteLink's behaviour: plain click just navigates; Cmd/Ctrl+click
 * (or middle-click) pins the destination as a tab so the user can park it
 * alongside their notes. Without Cmd/Ctrl, the route does NOT pin itself —
 * mirrors how notes behave from in-app links.
 */
export const RouteLink = forwardRef<HTMLAnchorElement, RouteLinkProps>(
  function RouteLink(
    { routeSlug, routeTitle, routeKind, onClick, ...rest },
    ref,
  ) {
    const router = useRouter()
    const params = useParams<{ locale: string }>()
    return (
      <Link
        {...rest}
        ref={ref}
        onClick={(e) => {
          // For "what's the current tab?" we use tabStore.activeSlug —
          // noteContextStore only knows about notes, so when the user is
          // on the graph or welcome tab itself, its currentSlug is null
          // and replaceActive can't find anything to rewrite.
          const tabState = useTabStore.getState()
          const activeSlug = tabState.activeSlug
          const activeTab = activeSlug
            ? tabState.tabs.find((t) => t.slug === activeSlug)
            : null
          const ctx = useNoteContextStore.getState()
          const current = activeTab
            ? {
                slug: activeTab.slug,
                title: activeTab.title,
                kind: activeTab.kind,
              }
            : ctx.currentSlug && ctx.currentTitle
              ? { slug: ctx.currentSlug, title: ctx.currentTitle }
              : null

          const anchor = e.currentTarget as HTMLAnchorElement
          const href = anchor.getAttribute('href') || ''

          if (e.button === 1) {
            e.preventDefault()
            useTabStore.getState().openInNewTab(
              { slug: routeSlug, title: routeTitle, kind: routeKind },
              current,
            )
          } else if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            useTabStore.getState().openInNewTab(
              { slug: routeSlug, title: routeTitle, kind: routeKind },
              current,
            )
            if (href) router.push(href)
          } else {
            // Plain click: let <Link> navigate, but rewrite the currently
            // active tab to point at this route — same semantics as
            // NoteLink's plain-click flow. Without this, clicking Garden or
            // Graph from a note tab would leave the old tab still pinned
            // but unhighlighted (URL says one thing, tab bar says another).
            useTabStore.getState().replaceActive(
              { slug: routeSlug, title: routeTitle, kind: routeKind },
              activeSlug,
            )
          }
          if (!e.defaultPrevented) onClick?.(e)
        }}
      />
    )
  },
)
