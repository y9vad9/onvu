import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { RouteTabSync } from '@components/garden/RouteTabSync'
import { useTabStore, INDEX_TAB_SLUG, GRAPH_TAB_SLUG } from '@store/tabStore'

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeSlug: null })
})

describe('RouteTabSync', () => {
  it('does NOT auto-pin the route — empty tabs stay empty', () => {
    render(
      <RouteTabSync slug={INDEX_TAB_SLUG} title="Welcome" kind="index" />,
    )
    expect(useTabStore.getState().tabs).toEqual([])
    // But the active slug must point at the route so the tab bar would
    // highlight it if the user did pin it later.
    expect(useTabStore.getState().activeSlug).toBe(INDEX_TAB_SLUG)
  })

  it('refreshes the title of an existing tab on locale change', () => {
    useTabStore.setState({
      tabs: [{ slug: INDEX_TAB_SLUG, title: 'Welcome', scrollY: 0, kind: 'index' }],
      activeSlug: null,
    })
    render(
      <RouteTabSync slug={INDEX_TAB_SLUG} title="Сад" kind="index" />,
    )
    expect(useTabStore.getState().tabs[0].title).toBe('Сад')
    expect(useTabStore.getState().activeSlug).toBe(INDEX_TAB_SLUG)
  })

  it('handles the graph kind the same way', () => {
    useTabStore.setState({
      tabs: [{ slug: GRAPH_TAB_SLUG, title: 'Old', scrollY: 0, kind: 'graph' }],
      activeSlug: null,
    })
    render(
      <RouteTabSync slug={GRAPH_TAB_SLUG} title="Knowledge Graph" kind="graph" />,
    )
    expect(useTabStore.getState().tabs[0].title).toBe('Knowledge Graph')
    expect(useTabStore.getState().activeSlug).toBe(GRAPH_TAB_SLUG)
  })
})
