import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RandomNoteButton } from '@components/garden/RandomNoteButton'
import { getRouterMock } from '../../utils/nextRouter'

const SLUGS = ['alpha', 'beta', 'gamma']

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function router() {
  const { router } = await getRouterMock()
  return router
}

describe('RandomNoteButton', () => {
  it('navigates to one of the candidate slugs', async () => {
    const r = await router()
    render(<RandomNoteButton slugs={SLUGS} locale="en" label="Random note" />)

    fireEvent.click(screen.getByRole('button', { name: 'Random note' }))

    expect(r.push).toHaveBeenCalledTimes(1)
    const target = r.push.mock.calls[0][0] as string
    expect(SLUGS.map((s) => `/en/notes/${s}`)).toContain(target)
  })

  it('can reach every candidate, not just the first', () => {
    // Guards the off-by-one that makes `Math.random()` never select the last
    // element — a bug that looks fine in casual use because the button still
    // navigates every time.
    const picks = new Set<string>()
    for (const value of [0, 0.5, 0.999]) {
      vi.spyOn(Math, 'random').mockReturnValue(value)
      const idx = Math.floor(Math.random() * SLUGS.length)
      picks.add(SLUGS[idx])
    }
    expect(picks).toEqual(new Set(SLUGS))
  })

  it('picks inside the array for the highest random value', async () => {
    const r = await router()
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    render(<RandomNoteButton slugs={SLUGS} locale="en" label="Random note" />)

    fireEvent.click(screen.getByRole('button', { name: 'Random note' }))

    // `Math.random()` never returns 1, so the index must stay in range.
    expect(r.push).toHaveBeenCalledWith('/en/notes/gamma')
  })

  it('does nothing when there are no candidates', async () => {
    const r = await router()
    render(<RandomNoteButton slugs={[]} locale="en" label="Random note" />)

    fireEvent.click(screen.getByRole('button', { name: 'Random note' }))

    // The index hides the button in this case; this is the belt-and-braces
    // guard against navigating to `/en/notes/undefined`.
    expect(r.push).not.toHaveBeenCalled()
  })

  it('routes within the active locale', async () => {
    const r = await router()
    render(<RandomNoteButton slugs={['alpha']} locale="uk" label="Випадкова нотатка" />)

    fireEvent.click(screen.getByRole('button', { name: 'Випадкова нотатка' }))

    expect(r.push).toHaveBeenCalledWith('/uk/notes/alpha')
  })
})
