'use client'

import { create } from 'zustand'

/**
 * The tab bar models three kinds of destinations: individual notes, the
 * garden index page, and the global graph page. Index/graph are singletons —
 * the slug for those is a reserved sentinel so it never collides with a real
 * note slug (note slugs are lowercase alphanumeric + dashes).
 */
export type TabKind = 'note' | 'index' | 'graph'

export const INDEX_TAB_SLUG = '__index__'
export const GRAPH_TAB_SLUG = '__graph__'

export interface NoteTab {
  slug: string
  title: string
  scrollY: number
  kind: TabKind
}

export function tabHref(tab: Pick<NoteTab, 'slug' | 'kind'>, locale: string): string {
  switch (tab.kind) {
    case 'index':
      return `/${locale}/notes`
    case 'graph':
      return `/${locale}/notes/graph`
    default:
      return `/${locale}/notes/${tab.slug}`
  }
}

export type TabTarget = { slug: string; title: string; kind?: TabKind }

interface TabStore {
  tabs: NoteTab[]
  activeSlug: string | null
  openTab: (slug: string, title: string, kind?: TabKind) => void
  /**
   * Pin the currently-viewed entry as a tab (if not already a tab), then
   * append the target as a new tab and switch focus to it. This is the
   * Cmd/Ctrl+click behavior — current page stays accessible in the tab
   * bar, target opens beside it.
   */
  openInNewTab: (
    target: TabTarget,
    current: TabTarget | null,
  ) => void
  /**
   * Plain-click behavior. If the currently-viewed entry is in the tab bar,
   * rewrite that tab to point at the target (no new tab); otherwise just
   * change the active focus without touching the tab list. If the target
   * already has its own tab, switch focus to it.
   */
  replaceActive: (
    target: TabTarget,
    currentSlug: string | null,
  ) => void
  closeTab: (slug: string) => void
  setActiveTab: (slug: string) => void
  /**
   * Ensure a tab exists for the given destination (creating it if missing)
   * and focus it. Used by route components that should always appear in the
   * tab bar when the user is on them — currently the garden index and
   * global graph pages.
   */
  ensureTab: (target: TabTarget) => void
  saveScrollPosition: (slug: string, scrollY: number) => void
  getScrollPosition: (slug: string) => number
}

export const useTabStore = create<TabStore>()((set, get) => ({
  tabs: [],
  activeSlug: null,

  openTab: (slug, title, kind = 'note') => {
    const { tabs } = get()
    const exists = tabs.find((t) => t.slug === slug)
    if (exists) {
      set({ activeSlug: slug })
      return
    }
    set({ tabs: [...tabs, { slug, title, scrollY: 0, kind }], activeSlug: slug })
  },

  openInNewTab: (target, current) => {
    const { tabs } = get()
    const targetKind: TabKind = target.kind ?? 'note'

    // If the target already has a tab — or the user fired the "new tab"
    // gesture on the entry they're already viewing — just pin/focus it.
    // Without this guard we'd push two entries with the same slug and
    // React would warn about duplicate keys in the tab bar.
    const sameAsCurrent = current?.slug === target.slug
    if (sameAsCurrent || tabs.some((t) => t.slug === target.slug)) {
      const next = tabs.some((t) => t.slug === target.slug)
        ? tabs
        : [...tabs, { slug: target.slug, title: target.title, scrollY: 0, kind: targetKind }]
      set({ tabs: next, activeSlug: target.slug })
      return
    }

    // Make sure the currently-viewed entry is preserved as a tab before we
    // append the new one — otherwise opening a tab from a plain navigation
    // would lose the current view from the tab bar.
    const next = [...tabs]
    if (current && !next.some((t) => t.slug === current.slug)) {
      next.push({
        slug: current.slug,
        title: current.title,
        scrollY: 0,
        kind: current.kind ?? 'note',
      })
    }
    next.push({ slug: target.slug, title: target.title, scrollY: 0, kind: targetKind })
    set({ tabs: next, activeSlug: target.slug })
  },

  replaceActive: (target, currentSlug) => {
    const { tabs } = get()
    const targetKind: TabKind = target.kind ?? 'note'

    // Target already has its own tab — just focus it.
    const existing = tabs.find((t) => t.slug === target.slug)
    if (existing) {
      set({ activeSlug: target.slug })
      return
    }

    // Rewrite the tab matching the current pathname (preserves position),
    // falling back to the active tab if there's no exact match.
    const idx = currentSlug
      ? tabs.findIndex((t) => t.slug === currentSlug)
      : -1
    if (idx >= 0) {
      const next = tabs.slice()
      next[idx] = { slug: target.slug, title: target.title, scrollY: 0, kind: targetKind }
      set({ tabs: next, activeSlug: target.slug })
      return
    }

    // No tab for the current view — just track focus; don't create a tab.
    set({ activeSlug: target.slug })
  },

  ensureTab: (target) => {
    const { tabs } = get()
    const kind: TabKind = target.kind ?? 'note'
    const existing = tabs.find((t) => t.slug === target.slug)
    if (existing) {
      // Refresh the title in case the localised label changed (e.g. user
      // switched languages while the singleton tab was already pinned).
      const next =
        existing.title === target.title && existing.kind === kind
          ? tabs
          : tabs.map((t) =>
              t.slug === target.slug ? { ...t, title: target.title, kind } : t,
            )
      set({ tabs: next, activeSlug: target.slug })
      return
    }
    set({
      tabs: [...tabs, { slug: target.slug, title: target.title, scrollY: 0, kind }],
      activeSlug: target.slug,
    })
  },

  closeTab: (slug) => {
    const { tabs, activeSlug } = get()
    const idx = tabs.findIndex((t) => t.slug === slug)
    const newTabs = tabs.filter((t) => t.slug !== slug)
    let newActive = activeSlug
    if (activeSlug === slug) {
      newActive = newTabs[Math.max(0, idx - 1)]?.slug ?? newTabs[0]?.slug ?? null
    }
    set({ tabs: newTabs, activeSlug: newActive })
  },

  setActiveTab: (slug) => set({ activeSlug: slug }),

  saveScrollPosition: (slug, scrollY) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.slug === slug ? { ...t, scrollY } : t)),
    }))
  },

  getScrollPosition: (slug) => {
    return get().tabs.find((t) => t.slug === slug)?.scrollY ?? 0
  },
}))
