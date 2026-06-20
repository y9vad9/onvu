import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ArticleEnhancer } from '@components/garden/ArticleEnhancer'
import { useTabStore } from '@store/tabStore'
import { getRouterMock } from '../../utils/nextRouter'

function mountArticle(html: string) {
  document.body.innerHTML = `<article><div class="prose">${html}</div></article><div id="notes-scroll"></div>`
}

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeSlug: null })
  document.body.innerHTML = ''
})

describe('ArticleEnhancer wiki-link delegation', () => {
  it('plain click on a data-note-slug anchor rewrites the active tab and pushes via router', async () => {
    mountArticle(
      `<a class="wikilink" data-note-slug="target" href="/en/notes/target">Target</a>`,
    )
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    render(<ArticleEnhancer slug="a" />)
    const link = document.querySelector('a.wikilink')!
    fireEvent.click(link)
    expect(useTabStore.getState().tabs[0].slug).toBe('target')
    expect(router.push).toHaveBeenCalledWith('/en/notes/target')
  })

  it('Ctrl-click on a wiki link pins as a new tab and pushes via router', async () => {
    mountArticle(
      `<a class="wikilink" data-note-slug="target" href="/en/notes/target">T</a>`,
    )
    useTabStore.setState({
      tabs: [{ slug: 'a', title: 'A', scrollY: 0, kind: 'note' }],
      activeSlug: 'a',
    })
    const { router } = await getRouterMock()
    render(<ArticleEnhancer slug="a" />)
    fireEvent.click(document.querySelector('a.wikilink')!, { ctrlKey: true })
    expect(useTabStore.getState().tabs.map((t) => t.slug)).toEqual(['a', 'target'])
    expect(router.push).toHaveBeenCalledWith('/en/notes/target')
  })

  it('broken wiki links no-op (no navigation, no tab change)', async () => {
    mountArticle(
      `<a class="wikilink wikilink-broken" data-note-slug="missing" href="#">Missing</a>`,
    )
    const { router } = await getRouterMock()
    render(<ArticleEnhancer slug="a" />)
    fireEvent.click(document.querySelector('a.wikilink')!)
    expect(router.push).not.toHaveBeenCalled()
    expect(useTabStore.getState().tabs).toEqual([])
  })

  it('does not intercept anchors without data-note-slug', async () => {
    mountArticle(`<a href="https://external.example">External</a>`)
    const { router } = await getRouterMock()
    render(<ArticleEnhancer slug="a" />)
    fireEvent.click(document.querySelector('a')!)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('shift-click on a wiki link is left to the browser (no preventDefault)', async () => {
    mountArticle(
      `<a class="wikilink" data-note-slug="target" href="/en/notes/target">T</a>`,
    )
    const { router } = await getRouterMock()
    render(<ArticleEnhancer slug="a" />)
    const ev = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      shiftKey: true,
    })
    document.querySelector('a')!.dispatchEvent(ev)
    expect(router.push).not.toHaveBeenCalled()
    expect(ev.defaultPrevented).toBe(false)
  })
})
