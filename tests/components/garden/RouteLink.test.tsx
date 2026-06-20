import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { RouteLink } from '@components/garden/RouteLink'
import { useTabStore, INDEX_TAB_SLUG } from '@store/tabStore'
import { getRouterMock } from '../../utils/nextRouter'

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeSlug: null })
})

describe('RouteLink', () => {
  it('plain click rewrites the active note tab with the route', () => {
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { getByText } = render(
      <RouteLink
        href="/en/notes"
        routeSlug={INDEX_TAB_SLUG}
        routeTitle="Welcome"
        routeKind="index"
      >
        Garden
      </RouteLink>,
    )
    fireEvent.click(getByText('Garden'))
    expect(useTabStore.getState().tabs[0]).toMatchObject({
      slug: INDEX_TAB_SLUG,
      kind: 'index',
    })
  })

  it('Ctrl-click pins the route as a new tab alongside the existing one', async () => {
    const { router } = await getRouterMock()
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { getByText } = render(
      <RouteLink
        href="/en/notes"
        routeSlug={INDEX_TAB_SLUG}
        routeTitle="Welcome"
        routeKind="index"
      >
        Garden
      </RouteLink>,
    )
    fireEvent.click(getByText('Garden'), { ctrlKey: true })
    expect(router.push).toHaveBeenCalledWith('/en/notes')
    expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual([
      'a',
      INDEX_TAB_SLUG,
    ])
  })

  it('does not pin a tab when there are no existing tabs (plain click)', () => {
    const { getByText } = render(
      <RouteLink
        href="/en/notes"
        routeSlug={INDEX_TAB_SLUG}
        routeTitle="Welcome"
        routeKind="index"
      >
        Garden
      </RouteLink>,
    )
    fireEvent.click(getByText('Garden'))
    // No active tab, no current — replaceActive just tracks focus, doesn't
    // create a tab from nothing.
    expect(useTabStore.getState().tabs).toEqual([])
    expect(useTabStore.getState().activeSlug).toBe(INDEX_TAB_SLUG)
  })
})
