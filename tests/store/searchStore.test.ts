import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchStore } from '@store/searchStore'

beforeEach(() => {
  useSearchStore.setState({ isOpen: false, query: '' })
})

describe('searchStore', () => {
  it('open() flips isOpen and seeds the query', () => {
    useSearchStore.getState().open('kotlin')
    const s = useSearchStore.getState()
    expect(s.isOpen).toBe(true)
    expect(s.query).toBe('kotlin')
  })

  it('open() without an initial query defaults to empty', () => {
    useSearchStore.getState().open()
    expect(useSearchStore.getState().query).toBe('')
  })

  it('close() resets both open state and query', () => {
    useSearchStore.setState({ isOpen: true, query: 'lingering' })
    useSearchStore.getState().close()
    expect(useSearchStore.getState()).toMatchObject({ isOpen: false, query: '' })
  })

  it('setQuery() updates only the query', () => {
    useSearchStore.setState({ isOpen: true, query: 'old' })
    useSearchStore.getState().setQuery('new')
    expect(useSearchStore.getState()).toMatchObject({ isOpen: true, query: 'new' })
  })
})
