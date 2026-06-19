'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from 'next-intl'
import type { SearchIndexEntry } from '@core/search/SearchIndex'

interface PreviewState {
  slug: string
  title: string
  preview: string
  coverImage: string | null
  date: string | null
  x: number
  y: number
  placement: 'above' | 'below'
}

const indexCache = new Map<string, Promise<Map<string, SearchIndexEntry>>>()

function loadIndex(locale: string): Promise<Map<string, SearchIndexEntry>> {
  let p = indexCache.get(locale)
  if (!p) {
    p = fetch(`/api/search-index?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: SearchIndexEntry[]) => new Map(rows.map((r) => [r.slug, r])))
      .catch(() => new Map<string, SearchIndexEntry>())
    indexCache.set(locale, p)
  }
  return p
}

/**
 * Watches the article container for hover events on links that point to
 * notes and shows a small floating card with the target note's title and
 * preview. Designed to be mounted once per article view.
 */
export function NoteLinkPreview({
  containerSelector = 'article .prose',
}: {
  containerSelector?: string
}) {
  const [state, setState] = useState<PreviewState | null>(null)
  const hoverTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  const locale = useLocale()

  useEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    function slugFromHref(a: HTMLAnchorElement): string | null {
      const explicit = a.getAttribute('data-note-slug')
      if (explicit) return explicit
      const href = a.getAttribute('href') ?? ''
      const m = href.match(/^(?:\/[a-z]{2})?\/notes\/([^#?/]+)/)
      return m ? m[1] : null
    }

    function position(a: HTMLAnchorElement): Pick<PreviewState, 'x' | 'y' | 'placement'> {
      const r = a.getBoundingClientRect()
      const viewportH = window.innerHeight
      const spaceBelow = viewportH - r.bottom
      const placement: 'above' | 'below' = spaceBelow > 200 ? 'below' : 'above'
      return {
        x: r.left + r.width / 2,
        y: placement === 'below' ? r.bottom + 8 : r.top - 8,
        placement,
      }
    }

    async function show(a: HTMLAnchorElement) {
      const slug = slugFromHref(a)
      if (!slug) return
      if (a.classList.contains('wikilink-broken')) return
      const idx = await loadIndex(locale)
      const entry = idx.get(slug)
      if (!entry) return
      const pos = position(a)
      setState({
        slug: entry.slug,
        title: entry.title,
        preview: entry.preview,
        coverImage: entry.coverImage,
        date: entry.date,
        ...pos,
      })
    }

    function onEnter(e: Event) {
      const target = e.target as HTMLElement
      const a = target.closest('a')
      if (!(a instanceof HTMLAnchorElement)) return
      if (!container!.contains(a)) return
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
      hoverTimer.current = window.setTimeout(() => show(a), 350)
    }

    function onLeave(e: Event) {
      const target = e.target as HTMLElement
      const a = target.closest('a')
      if (!(a instanceof HTMLAnchorElement)) return
      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current)
        hoverTimer.current = null
      }
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => setState(null), 180)
    }

    container.addEventListener('mouseover', onEnter)
    container.addEventListener('mouseout', onLeave)
    return () => {
      container.removeEventListener('mouseover', onEnter)
      container.removeEventListener('mouseout', onLeave)
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [containerSelector, locale])

  if (!state || typeof document === 'undefined') return null

  const transform =
    state.placement === 'below'
      ? 'translate(-50%, 0)'
      : 'translate(-50%, -100%)'

  return createPortal(
    <div
      role="tooltip"
      className="fixed z-[60] w-72 max-w-[80vw] pointer-events-none animate-[fadeIn_120ms_ease]"
      style={{ left: state.x, top: state.y, transform }}
    >
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {state.coverImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={state.coverImage}
            alt=""
            className="w-full aspect-video object-cover bg-bg"
          />
        )}
        <div className="p-3">
          <p className="text-sm font-semibold text-fg line-clamp-2">{state.title}</p>
          {state.preview && (
            <p className="text-xs text-muted mt-1 line-clamp-3">{state.preview}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
