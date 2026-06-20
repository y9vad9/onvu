import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '@hooks/useMediaQuery'

interface FakeMql {
  matches: boolean
  listeners: Array<(e: MediaQueryListEvent) => void>
  addEventListener: (type: string, cb: (e: MediaQueryListEvent) => void) => void
  removeEventListener: (type: string, cb: (e: MediaQueryListEvent) => void) => void
  trigger: (matches: boolean) => void
}

let lastMql: FakeMql | null = null

function makeMql(matches: boolean): FakeMql {
  const mql: FakeMql = {
    matches,
    listeners: [],
    addEventListener: (_t, cb) => mql.listeners.push(cb),
    removeEventListener: (_t, cb) => {
      mql.listeners = mql.listeners.filter((l) => l !== cb)
    },
    trigger: (next) => {
      mql.matches = next
      for (const cb of mql.listeners) cb({ matches: next } as MediaQueryListEvent)
    },
  }
  return mql
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => {
    lastMql = makeMql(false)
    void q
    return lastMql
  })
})

describe('useMediaQuery', () => {
  it('returns false at first paint (SSR-safe default)', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 800px)'))
    // The initial useState(false) runs synchronously before the effect.
    expect(result.current).toBe(false)
  })

  it('reflects the mql state after mount', () => {
    vi.stubGlobal('matchMedia', () => {
      lastMql = makeMql(true)
      return lastMql
    })
    const { result } = renderHook(() => useMediaQuery('(min-width: 800px)'))
    expect(result.current).toBe(true)
  })

  it('updates when the mql fires a change event', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 800px)'))
    act(() => lastMql!.trigger(true))
    expect(result.current).toBe(true)
  })

  it('removes its listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 800px)'))
    expect(lastMql!.listeners).toHaveLength(1)
    unmount()
    expect(lastMql!.listeners).toHaveLength(0)
  })
})
