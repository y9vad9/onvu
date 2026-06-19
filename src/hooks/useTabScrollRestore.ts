'use client'

import { useLayoutEffect, useRef } from 'react'
import { useTabStore } from '@store/tabStore'

/**
 * Persists the user's scroll position in the shared `#notes-scroll`
 * container against the given tab slug, and restores it on mount.
 *
 * The hook is shared by every page that lives inside the notes layout —
 * individual note pages (via ArticleEnhancer) as well as the garden index
 * and global graph routes — so flipping between tabs returns the user to
 * exactly where they were on each one.
 *
 * Implementation notes are worth keeping in mind if you change this:
 *  - useLayoutEffect (not useEffect): when the slug changes, React commits
 *    the new page's DOM, then the browser eventually dispatches a "clamp"
 *    scroll event because the shared scroller's scrollTop no longer fits
 *    the (often shorter) new content. With a passive effect, that scroll
 *    event sometimes fires before cleanup and pollutes the saved value
 *    with the clamped 0. Layout effects run synchronously inside the
 *    commit, before any browser-dispatched scroll events.
 *  - lastScrollRef: cleanup persists this ref rather than reading
 *    scroller.scrollTop, for the same reason — by the time cleanup runs
 *    the DOM value has already been clamped.
 *  - restoringRef + ResizeObserver: the article body streams in after
 *    mount, so the saved offset is initially unreachable. Reapply the
 *    scroll on every content growth until either the target is reachable,
 *    the deadline elapses, or the user takes over.
 */
export function useTabScrollRestore(slug: string) {
  const lastScrollRef = useRef(0)
  const restoringRef = useRef(false)

  useLayoutEffect(() => {
    const scroller = document.getElementById('notes-scroll')
    if (!scroller) return
    const hash = window.location.hash ? window.location.hash.slice(1) : ''
    let hashInterval: number | null = null
    let restoreRO: ResizeObserver | null = null
    let restoreDeadline: number | null = null
    const stopRestore = () => {
      if (restoreRO) { restoreRO.disconnect(); restoreRO = null }
      if (restoreDeadline !== null) {
        window.clearTimeout(restoreDeadline)
        restoreDeadline = null
      }
      restoringRef.current = false
    }

    if (hash) {
      let attempts = 0
      hashInterval = window.setInterval(() => {
        const el = document.getElementById(decodeURIComponent(hash))
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.clearInterval(hashInterval!)
          hashInterval = null
        } else if (++attempts > 20) {
          window.clearInterval(hashInterval!)
          hashInterval = null
        }
      }, 50)
    } else {
      const stored = useTabStore.getState().getScrollPosition(slug)
      lastScrollRef.current = stored
      scroller.scrollTop = 0
      if (stored > 0) {
        restoringRef.current = true
        const apply = () => {
          if (!restoreRO) return
          const maxScroll = scroller.scrollHeight - scroller.clientHeight
          scroller.scrollTop = Math.min(stored, Math.max(0, maxScroll))
          if (maxScroll >= stored) stopRestore()
        }
        restoreRO = new ResizeObserver(apply)
        restoreRO.observe(scroller)
        if (scroller.firstElementChild) restoreRO.observe(scroller.firstElementChild)
        restoreDeadline = window.setTimeout(stopRestore, 1500)
        requestAnimationFrame(apply)
      }
    }

    function onScroll() {
      if (restoringRef.current) return
      lastScrollRef.current = scroller!.scrollTop
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('wheel', stopRestore, { passive: true })
    scroller.addEventListener('touchstart', stopRestore, { passive: true })
    scroller.addEventListener('keydown', stopRestore)

    return () => {
      if (hashInterval !== null) window.clearInterval(hashInterval)
      stopRestore()
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('wheel', stopRestore)
      scroller.removeEventListener('touchstart', stopRestore)
      scroller.removeEventListener('keydown', stopRestore)
      useTabStore.getState().saveScrollPosition(slug, lastScrollRef.current)
    }
  }, [slug])
}
