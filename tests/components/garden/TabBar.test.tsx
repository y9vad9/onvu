import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { TabBar } from '@components/garden/TabBar'
import { useTabStore, INDEX_TAB_SLUG, GRAPH_TAB_SLUG } from '@store/tabStore'
import { getRouterMock, setRouterState } from '../../utils/nextRouter'

beforeEach(async () => {
  useTabStore.setState({ tabs: [], activeSlug: null })
  await setRouterState({ pathname: '/en/notes/a', params: { locale: 'en' } })
})

describe('TabBar', () => {
  it('renders nothing when there are no tabs', () => {
    const { container } = render(<TabBar />)
    expect(container.firstChild).toBeNull()
  })

  it('navigates to the clicked tab', async () => {
    useTabStore.setState({
      tabs: [
        { slug: 'a', title: 'Alpha', scrollY: 0, kind: 'note' },
        { slug: 'b', title: 'Beta', scrollY: 0, kind: 'note' },
      ],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    render(<TabBar />)
    fireEvent.click(screen.getByText('Beta'))
    expect(router.push).toHaveBeenCalledWith('/en/notes/b')
    expect(useTabStore.getState().activeSlug).toBe('b')
  })

  it('routes index/graph tabs via tabHref, not /notes/<slug>', async () => {
    useTabStore.setState({
      tabs: [
        { slug: INDEX_TAB_SLUG, title: 'Welcome', scrollY: 0, kind: 'index' },
        { slug: GRAPH_TAB_SLUG, title: 'Graph', scrollY: 0, kind: 'graph' },
      ],
      activeSlug: INDEX_TAB_SLUG,
    })
    const { router } = await getRouterMock()
    render(<TabBar />)
    fireEvent.click(screen.getByText('Graph'))
    expect(router.push).toHaveBeenCalledWith('/en/notes/graph')
  })

  it('middle-click closes a tab', () => {
    useTabStore.setState({
      tabs: [
        { slug: 'a', title: 'Alpha', scrollY: 0, kind: 'note' },
        { slug: 'b', title: 'Beta', scrollY: 0, kind: 'note' },
      ],
      activeSlug: 'a',
    })
    render(<TabBar />)
    // testing-library doesn't expose fireEvent.auxClick; dispatch a real
    // native auxclick event so React's onAuxClick handler runs.
    screen.getByText('Alpha').dispatchEvent(
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )
    expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual(['b'])
  })

  it('navigates to the next tab when closing the active one', async () => {
    useTabStore.setState({
      tabs: [
        { slug: 'a', title: 'Alpha', scrollY: 0, kind: 'note' },
        { slug: 'b', title: 'Beta', scrollY: 0, kind: 'note' },
      ],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    render(<TabBar />)
    fireEvent.click(screen.getByLabelText('Close Alpha'))
    expect(router.push).toHaveBeenCalledWith('/en/notes/b')
  })

  it('navigates to /notes when closing the last tab', async () => {
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'Alpha', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    render(<TabBar />)
    fireEvent.click(screen.getByLabelText('Close Alpha'))
    expect(router.push).toHaveBeenCalledWith('/en/notes')
  })
})
