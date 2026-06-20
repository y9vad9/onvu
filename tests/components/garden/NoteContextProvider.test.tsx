import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { NoteContextProvider } from '@components/garden/NoteContextProvider'
import { useNoteContextStore } from '@store/noteContextStore'
import { useTabStore } from '@store/tabStore'

beforeEach(() => {
  useNoteContextStore.getState().clearContext()
  useTabStore.setState({ tabs: [], activeSlug: null })
})

const ctx = {
  currentSlug: 'kotlin',
  currentTitle: 'Kotlin',
  headings: [],
  series: null,
  backlinks: [],
  outgoing: [],
}

describe('NoteContextProvider', () => {
  it('populates the context store on mount', () => {
    render(<NoteContextProvider value={ctx} />)
    expect(useNoteContextStore.getState().currentSlug).toBe('kotlin')
  })

  it('syncs activeSlug to the current note', () => {
    render(<NoteContextProvider value={ctx} />)
    expect(useTabStore.getState().activeSlug).toBe('kotlin')
  })

  it('clears the context on unmount', () => {
    const { unmount } = render(<NoteContextProvider value={ctx} />)
    unmount()
    expect(useNoteContextStore.getState().currentSlug).toBeNull()
  })
})
