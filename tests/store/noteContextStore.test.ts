import { describe, it, expect, beforeEach } from 'vitest'
import { useNoteContextStore } from '@store/noteContextStore'

const fullValue = {
  currentSlug: 'k',
  currentTitle: 'Kotlin',
  headings: [{ id: 'h', depth: 2 as const, text: 'h' }],
  series: null,
  backlinks: [{ slug: 'a', title: 'A' }],
  outgoing: [
    { slug: 'x', title: 'X', isExternal: false, href: '/en/notes/x' },
  ],
}

beforeEach(() => {
  useNoteContextStore.getState().clearContext()
})

describe('noteContextStore', () => {
  it('setContext fills every field', () => {
    useNoteContextStore.getState().setContext(fullValue)
    const state = useNoteContextStore.getState()
    expect(state.currentSlug).toBe('k')
    expect(state.currentTitle).toBe('Kotlin')
    expect(state.headings).toHaveLength(1)
    expect(state.backlinks).toEqual([{ slug: 'a', title: 'A' }])
    expect(state.outgoing).toHaveLength(1)
  })

  it('clearContext resets every field to the empty value', () => {
    useNoteContextStore.getState().setContext(fullValue)
    useNoteContextStore.getState().clearContext()
    const state = useNoteContextStore.getState()
    expect(state.currentSlug).toBeNull()
    expect(state.currentTitle).toBeNull()
    expect(state.headings).toEqual([])
    expect(state.backlinks).toEqual([])
    expect(state.outgoing).toEqual([])
  })
})
