import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoteLinkClick } from '@hooks/useNoteLinkClick'
import { useTabStore } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'
import { getRouterMock } from '../utils/nextRouter'

interface MouseStub {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  preventDefault: ReturnType<typeof vi.fn>
  currentTarget: HTMLAnchorElement
}

function event(opts: Partial<MouseStub> & { href: string }): React.MouseEvent {
  const anchor = document.createElement('a')
  anchor.setAttribute('href', opts.href)
  return {
    button: opts.button ?? 0,
    metaKey: opts.metaKey ?? false,
    ctrlKey: opts.ctrlKey ?? false,
    preventDefault: opts.preventDefault ?? vi.fn(),
    currentTarget: anchor,
  } as unknown as React.MouseEvent
}

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeSlug: null })
  useNoteContextStore.getState().clearContext()
})

describe('useNoteLinkClick', () => {
  it('plain click rewrites the active tab', async () => {
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { result } = renderHook(() => useNoteLinkClick('b', 'B'))
    act(() =>
      result.current(event({ href: '/en/notes/b' })),
    )
    const state = useTabStore.getState()
    expect(state.tabs.map((t) => t.slug)).toEqual(['b'])
    expect(state.activeSlug).toBe('b')
  })

  it('Ctrl-click pins the current and appends the target as a new tab', async () => {
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    const { result } = renderHook(() => useNoteLinkClick('b', 'B'))
    act(() =>
      result.current(event({ href: '/en/notes/b?q=foo&hit=2', ctrlKey: true })),
    )
    expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual(['a', 'b'])
    expect(router.push).toHaveBeenCalledWith('/en/notes/b?q=foo&hit=2')
  })

  it('Cmd-click behaves the same as Ctrl-click', async () => {
    const { router } = await getRouterMock()
    const { result } = renderHook(() => useNoteLinkClick('b', 'B'))
    act(() =>
      result.current(event({ href: '/en/notes/b', metaKey: true })),
    )
    expect(router.push).toHaveBeenCalledWith('/en/notes/b')
    expect(useTabStore.getState().tabs.find((t) => t.slug === 'b')).toBeTruthy()
  })

  it('middle-click pins in background and does not navigate', async () => {
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    const { result } = renderHook(() => useNoteLinkClick('b', 'B'))
    act(() => result.current(event({ href: '/en/notes/b', button: 1 })))
    expect(router.push).not.toHaveBeenCalled()
    expect(useTabStore.getState().tabs.find((t) => t.slug === 'b')).toBeTruthy()
  })

  it('uses the active tab as "current" so graph/welcome anchors participate', async () => {
    useTabStore.setState({
      tabs: [{ slug: '__graph__', title: 'Graph', scrollY: 0, kind: 'graph' }],
      activeSlug: '__graph__',
    })
    const { result } = renderHook(() => useNoteLinkClick('b', 'B'))
    act(() => result.current(event({ href: '/en/notes/b', ctrlKey: true })))
    // The graph tab should still be pinned alongside the new note tab.
    expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual([
      '__graph__',
      'b',
    ])
  })
})
