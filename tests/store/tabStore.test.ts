import { describe, it, expect, beforeEach } from 'vitest'
import { useTabStore } from '@store/tabStore'

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
})
