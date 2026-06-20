import { describe, it, expect, beforeEach } from 'vitest'
import {
  useTabStore,
  tabHref,
  INDEX_TAB_SLUG,
  GRAPH_TAB_SLUG,
} from '@store/tabStore'

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeSlug: null })
})

describe('tabStore', () => {
  describe('openTab', () => {
    it('adds a new tab and sets it as active', () => {
      useTabStore.getState().openTab('foo', 'Foo')
      const state = useTabStore.getState()
      expect(state.tabs.length).toBe(1)
      expect(state.tabs[0]).toEqual({ slug: 'foo', title: 'Foo', scrollY: 0, kind: 'note' })
      expect(state.activeSlug).toBe('foo')
    })

    it('does not duplicate existing tab but switches to it', () => {
      useTabStore.getState().openTab('foo', 'Foo')
      useTabStore.getState().openTab('bar', 'Bar')
      useTabStore.getState().openTab('foo', 'Foo')
      const state = useTabStore.getState()
      expect(state.tabs.length).toBe(2)
      expect(state.activeSlug).toBe('foo')
    })
  })

  describe('closeTab', () => {
    it('removes the tab from the list', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().closeTab('a')
      expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual(['b'])
    })

    it('moves active to the previous tab when closing active', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().openTab('c', 'C')
      // b is in the middle, c is active
      useTabStore.getState().closeTab('c')
      expect(useTabStore.getState().activeSlug).toBe('b')
    })

    it('sets activeSlug to null when last tab is closed', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().closeTab('a')
      expect(useTabStore.getState().tabs).toEqual([])
      expect(useTabStore.getState().activeSlug).toBeNull()
    })

    it('does not change active when closing a non-active tab', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().openTab('c', 'C')
      // c is active; close b
      useTabStore.getState().closeTab('b')
      expect(useTabStore.getState().activeSlug).toBe('c')
    })
  })

  describe('scroll position', () => {
    it('saves and restores per-tab scroll', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().saveScrollPosition('a', 500)
      useTabStore.getState().saveScrollPosition('b', 1200)
      expect(useTabStore.getState().getScrollPosition('a')).toBe(500)
      expect(useTabStore.getState().getScrollPosition('b')).toBe(1200)
    })

    it('returns 0 for unknown slugs', () => {
      expect(useTabStore.getState().getScrollPosition('nope')).toBe(0)
    })
  })

  describe('openInNewTab', () => {
    it('does not duplicate when target equals current view', () => {
      // Regression: Ctrl+Enter on the already-viewed note used to push two
      // entries with the same slug, causing React's duplicate-key warning.
      useTabStore.getState().openInNewTab(
        { slug: 'about', title: 'About' },
        { slug: 'about', title: 'About' },
      )
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['about'])
      expect(state.activeSlug).toBe('about')
    })

    it('pins current and appends target as a new tab', () => {
      useTabStore.getState().openInNewTab(
        { slug: 'b', title: 'B' },
        { slug: 'a', title: 'A' },
      )
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['a', 'b'])
      expect(state.activeSlug).toBe('b')
    })

    it('focuses an existing tab instead of duplicating', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().openInNewTab(
        { slug: 'a', title: 'A' },
        { slug: 'b', title: 'B' },
      )
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['a', 'b'])
      expect(state.activeSlug).toBe('a')
    })
  })

  describe('setActiveTab', () => {
    it('updates the active slug', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().setActiveTab('a')
      expect(useTabStore.getState().activeSlug).toBe('a')
    })
  })

  describe('replaceActive', () => {
    it('rewrites the active tab to the target when current is in tabs', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      // Active is 'b' after the second openTab.
      useTabStore.getState().replaceActive({ slug: 'c', title: 'C' }, 'b')
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['a', 'c'])
      expect(state.activeSlug).toBe('c')
    })

    it('focuses an existing tab if the target already has one', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().openTab('b', 'B')
      useTabStore.getState().replaceActive({ slug: 'a', title: 'A' }, 'b')
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['a', 'b'])
      expect(state.activeSlug).toBe('a')
    })

    it('only updates activeSlug when current is not pinned', () => {
      useTabStore.getState().openTab('a', 'A')
      // 'unrelated' isn't in tabs — should just track focus.
      useTabStore.getState().replaceActive({ slug: 'b', title: 'B' }, 'unrelated')
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['a'])
      expect(state.activeSlug).toBe('b')
    })

    it('only updates activeSlug when currentSlug is null', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore.getState().replaceActive({ slug: 'b', title: 'B' }, null)
      const state = useTabStore.getState()
      expect(state.tabs.map((t) => t.slug)).toEqual(['a'])
      expect(state.activeSlug).toBe('b')
    })

    it('preserves the target kind when rewriting', () => {
      useTabStore.getState().openTab('a', 'A')
      useTabStore
        .getState()
        .replaceActive({ slug: GRAPH_TAB_SLUG, title: 'Graph', kind: 'graph' }, 'a')
      const state = useTabStore.getState()
      expect(state.tabs[0]).toMatchObject({ slug: GRAPH_TAB_SLUG, kind: 'graph' })
    })
  })

  describe('ensureTab', () => {
    it('creates a tab when none exists and focuses it', () => {
      useTabStore
        .getState()
        .ensureTab({ slug: INDEX_TAB_SLUG, title: 'Welcome', kind: 'index' })
      const state = useTabStore.getState()
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0].kind).toBe('index')
      expect(state.activeSlug).toBe(INDEX_TAB_SLUG)
    })

    it('refreshes title and kind on an existing tab without duplicating', () => {
      useTabStore
        .getState()
        .ensureTab({ slug: INDEX_TAB_SLUG, title: 'Welcome', kind: 'index' })
      useTabStore.getState().setActiveTab('other')
      useTabStore
        .getState()
        .ensureTab({ slug: INDEX_TAB_SLUG, title: 'Сад', kind: 'index' })
      const state = useTabStore.getState()
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0].title).toBe('Сад')
      expect(state.activeSlug).toBe(INDEX_TAB_SLUG)
    })

    it('leaves identical entries untouched (object identity preserved)', () => {
      useTabStore
        .getState()
        .ensureTab({ slug: INDEX_TAB_SLUG, title: 'Welcome', kind: 'index' })
      const before = useTabStore.getState().tabs
      useTabStore
        .getState()
        .ensureTab({ slug: INDEX_TAB_SLUG, title: 'Welcome', kind: 'index' })
      expect(useTabStore.getState().tabs).toBe(before)
    })
  })

  describe('openInNewTab with kind', () => {
    it('persists the kind onto the new tab', () => {
      useTabStore.getState().openInNewTab(
        { slug: GRAPH_TAB_SLUG, title: 'Graph', kind: 'graph' },
        null,
      )
      expect(useTabStore.getState().tabs[0].kind).toBe('graph')
    })

    it('defaults kind=note when not specified', () => {
      useTabStore.getState().openInNewTab(
        { slug: 'x', title: 'X' },
        null,
      )
      expect(useTabStore.getState().tabs[0].kind).toBe('note')
    })

    it('preserves the current view\'s kind when pinning it as a tab', () => {
      useTabStore.getState().openInNewTab(
        { slug: 'note-a', title: 'A' },
        { slug: GRAPH_TAB_SLUG, title: 'Graph', kind: 'graph' },
      )
      const tabs = useTabStore.getState().tabs
      const pinned = tabs.find((t) => t.slug === GRAPH_TAB_SLUG)
      expect(pinned?.kind).toBe('graph')
    })
  })

  describe('tabHref', () => {
    it('routes index tabs to /<locale>/notes', () => {
      expect(tabHref({ slug: INDEX_TAB_SLUG, kind: 'index' }, 'en')).toBe('/en/notes')
    })
    it('routes graph tabs to /<locale>/notes/graph', () => {
      expect(tabHref({ slug: GRAPH_TAB_SLUG, kind: 'graph' }, 'uk')).toBe('/uk/notes/graph')
    })
    it('routes note tabs to /<locale>/notes/<slug>', () => {
      expect(tabHref({ slug: 'kotlin', kind: 'note' }, 'en')).toBe('/en/notes/kotlin')
    })
  })
})
