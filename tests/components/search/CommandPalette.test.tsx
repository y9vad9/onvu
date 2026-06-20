import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { CommandPalette } from '@components/search/CommandPalette'
import { useSearchStore } from '@store/searchStore'
import { useTabStore } from '@store/tabStore'
import { getRouterMock } from '../../utils/nextRouter'

const INDEX = [
  { slug: 'kotlin', title: 'Kotlin', preview: 'JVM lang', parents: ['Engineering'], rawText: '', date: null, coverImage: null },
  { slug: 'coroutines', title: 'Kotlin Coroutines', preview: 'Suspending', parents: ['Engineering'], rawText: '', date: null, coverImage: null },
  { slug: 'next', title: 'Next.js', preview: 'React framework', parents: ['Frontend'], rawText: '', date: null, coverImage: null },
]

beforeEach(() => {
  useSearchStore.setState({ isOpen: true, query: '' })
  useTabStore.setState({ tabs: [], activeSlug: null })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => INDEX,
  } as Response))
})

describe('CommandPalette', () => {
  it('renders results once the index has loaded', async () => {
    render(<CommandPalette />)
    await waitFor(() => {
      expect(screen.getByText('Kotlin')).toBeInTheDocument()
    })
  })

  it('filters by parent:filter syntax', async () => {
    render(<CommandPalette />)
    await waitFor(() => expect(screen.getByText('Kotlin')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('placeholder'), {
      target: { value: 'parent:Frontend' },
    })
    await waitFor(() => {
      expect(screen.queryByText('Kotlin')).not.toBeInTheDocument()
      expect(screen.getByText('Next.js')).toBeInTheDocument()
    })
  })

  it('Enter on a highlighted note navigates via router', async () => {
    const { router } = await getRouterMock()
    render(<CommandPalette />)
    await waitFor(() => expect(screen.getByText('Kotlin')).toBeInTheDocument())
    const input = screen.getByPlaceholderText('placeholder')
    fireEvent.change(input, { target: { value: 'kotlin' } })
    await waitFor(() => expect(screen.getByText('Kotlin')).toBeInTheDocument())
    fireEvent.keyDown(input, { key: 'Enter' })
    // The first note result is highlighted after typing — Enter routes to it.
    expect(router.push).toHaveBeenCalledWith(expect.stringContaining('/en/notes/'))
  })

  it('Ctrl+Enter pins a note as a new tab and navigates', async () => {
    const { router } = await getRouterMock()
    render(<CommandPalette />)
    await waitFor(() => expect(screen.getByText('Kotlin')).toBeInTheDocument())
    const input = screen.getByPlaceholderText('placeholder')
    fireEvent.change(input, { target: { value: 'kotlin' } })
    await waitFor(() => expect(screen.getByText('Kotlin')).toBeInTheDocument())
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
    expect(router.push).toHaveBeenCalled()
    expect(useTabStore.getState().tabs.length).toBeGreaterThan(0)
  })

  it('Escape closes the palette', async () => {
    render(<CommandPalette />)
    await waitFor(() => expect(screen.getByText('Kotlin')).toBeInTheDocument())
    fireEvent.keyDown(screen.getByPlaceholderText('placeholder'), { key: 'Escape' })
    expect(useSearchStore.getState().isOpen).toBe(false)
  })
})
