import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { NoteLink } from '@components/garden/NoteLink'
import { useTabStore } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'
import { getRouterMock } from '../../utils/nextRouter'

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeSlug: null })
  useNoteContextStore.getState().clearContext()
})

describe('NoteLink', () => {
  it('plain click rewrites the active tab', () => {
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { getByText } = render(
      <NoteLink slug="b" title="B" href="/en/notes/b">
        Go to B
      </NoteLink>,
    )
    fireEvent.click(getByText('Go to B'))
    expect(useTabStore.getState().tabs[0].slug).toBe('b')
  })

  it('Ctrl-click opens in a new tab and pushes via router', async () => {
    const { router } = await getRouterMock()
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { getByText } = render(
      <NoteLink slug="b" title="B" href="/en/notes/b?q=x">
        B
      </NoteLink>,
    )
    fireEvent.click(getByText('B'), { ctrlKey: true })
    expect(router.push).toHaveBeenCalledWith('/en/notes/b?q=x')
    expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual(['a', 'b'])
  })

  it('forwards the user-supplied onClick when not prevented', async () => {
    let called = false
    const { getByText } = render(
      <NoteLink slug="b" title="B" href="/en/notes/b" onClick={() => { called = true }}>
        B
      </NoteLink>,
    )
    fireEvent.click(getByText('B'))
    expect(called).toBe(true)
  })
})
