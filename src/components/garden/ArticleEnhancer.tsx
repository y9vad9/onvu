'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useTabScrollRestore } from '@hooks/useTabScrollRestore'
import { useTabStore } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'

/**
 * Adds client-side enhancements to a rendered article:
 *  - Copy buttons on `<pre>` code blocks
 *  - Lightbox overlay on image click
 *  - Reading progress bar (updates `#reading-progress` width)
 *  - Per-tab scroll position restoration
 *
 * The component renders nothing into the article — it manipulates the DOM
 * after the article HTML has been mounted by the server component above.
 */
export function ArticleEnhancer({
  slug,
  containerSelector = 'article .prose',
}: {
  slug: string
  containerSelector?: string
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams<{ locale: string }>()

  useTabScrollRestore(slug)

  // Intercept clicks on wiki links inside the article body. These are raw
  // anchors emitted by the rehype pipeline (with data-note-slug) rather
  // than React `NoteLink` components, so without delegation the browser
  // does a full document navigation — which resets the page, blows away
  // tab state and feels like a hard reload. Route them through the
  // tabStore instead so they behave like NoteLink clicks: plain click
  // rewrites the active tab, Cmd/Ctrl-click pins as a new tab.
  useEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    function onClick(e: Event) {
      const me = e as MouseEvent
      // Let the browser handle modifier-less middle / right clicks normally
      // when they're not navigations we manage.
      const target = me.target as HTMLElement | null
      const anchor = target?.closest('a') as HTMLAnchorElement | null
      if (!anchor || !container!.contains(anchor)) return

      const noteSlug = anchor.getAttribute('data-note-slug')
      if (!noteSlug) return
      // Broken wiki links are rendered as anchors with a marker class; let
      // them no-op rather than navigating to a 404.
      if (anchor.classList.contains('wikilink-broken')) {
        me.preventDefault()
        return
      }
      // Modifier-aware behavior: shift / alt clicks go through the browser
      // (open in window / save link). Same skip for non-left clicks.
      if (me.button !== 0 && me.button !== 1) return
      if (me.shiftKey || me.altKey) return

      const href = anchor.getAttribute('href') || `/${params.locale}/notes/${noteSlug}`
      const title = anchor.textContent?.trim() || noteSlug

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

      me.preventDefault()

      if (me.button === 1) {
        // Middle-click: pin in background, don't navigate.
        useTabStore.getState().openInNewTab(
          { slug: noteSlug, title },
          current,
        )
        return
      }
      if (me.metaKey || me.ctrlKey) {
        useTabStore.getState().openInNewTab(
          { slug: noteSlug, title },
          current,
        )
        router.push(href)
        return
      }
      useTabStore.getState().replaceActive(
        { slug: noteSlug, title },
        currentSlug,
      )
      router.push(href)
    }

    // Middle-click usually fires `auxclick`, not `click` — listen to both so
    // both gestures route through the tab store.
    container.addEventListener('click', onClick)
    container.addEventListener('auxclick', onClick)
    return () => {
      container.removeEventListener('click', onClick)
      container.removeEventListener('auxclick', onClick)
    }
  }, [containerSelector, router, params.locale])

  // Reading progress bar — driven by the inner scroll container.
  useEffect(() => {
    const bar = document.getElementById('reading-progress')
    const scroller = document.getElementById('notes-scroll')
    if (!bar || !scroller) return
    function update() {
      const scrollTop = scroller!.scrollTop
      const docHeight = scroller!.scrollHeight - scroller!.clientHeight
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      bar!.style.width = `${pct}%`
    }
    scroller.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      scroller.removeEventListener('scroll', update)
      if (bar) bar.style.width = '0%'
    }
  }, [slug])

  // Code copy buttons + image lightbox handlers
  useEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const cleanups: Array<() => void> = []

    // Code blocks
    const codeBlocks = container.querySelectorAll('pre')
    for (const pre of Array.from(codeBlocks)) {
      if (pre.dataset.enhanced) continue
      pre.dataset.enhanced = '1'

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'code-copy-btn'
      btn.setAttribute('aria-label', 'Copy code')
      btn.textContent = 'Copy'

      const onClick = async () => {
        const code = pre.querySelector('code')?.textContent ?? ''
        try {
          await navigator.clipboard.writeText(code)
          btn.textContent = 'Copied!'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = 'Copy'
            btn.classList.remove('copied')
          }, 1500)
        } catch {
          btn.textContent = 'Failed'
        }
      }
      btn.addEventListener('click', onClick)
      pre.style.position = 'relative'
      pre.appendChild(btn)

      cleanups.push(() => {
        btn.removeEventListener('click', onClick)
        btn.remove()
        delete pre.dataset.enhanced
      })
    }

    // Images
    const images = container.querySelectorAll('img')
    for (const img of Array.from(images)) {
      if (img.dataset.enhanced) continue
      // Inline images are text-flow ornaments — never open them in a lightbox.
      if (img.classList.contains('inline-image')) continue
      img.dataset.enhanced = '1'

      const onClick = () => setLightboxSrc(img.getAttribute('src'))
      img.addEventListener('click', onClick)
      img.style.cursor = 'zoom-in'

      cleanups.push(() => {
        img.removeEventListener('click', onClick)
        delete img.dataset.enhanced
      })
    }

    return () => { for (const fn of cleanups) fn() }
  }, [slug, containerSelector])

  // Lightbox keyboard handling
  useEffect(() => {
    if (!lightboxSrc) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxSrc(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxSrc])

  if (!lightboxSrc || typeof document === 'undefined') return null

  // Portal to <body> so the overlay escapes the body card's sticky stacking
  // context — otherwise the sticky header (z-40) and panels can overlap it,
  // and the backdrop-blur only blurs the content inside the card.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-fg/70 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
      onClick={() => setLightboxSrc(null)}
      role="dialog"
      aria-label="Image preview"
    >
      <button
        onClick={() => setLightboxSrc(null)}
        className="absolute top-4 right-4 p-2 rounded-lg bg-bg/80 hover:bg-bg text-fg transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lightboxSrc}
        alt=""
        className="max-w-full max-h-full object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  )
}
