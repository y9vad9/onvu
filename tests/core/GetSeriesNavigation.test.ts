import { describe, it, expect } from 'vitest'
import { getSeriesNavigation } from '@core/GetSeriesNavigation'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { sampleNotes } from '../fixtures/notes'

describe('getSeriesNavigation', () => {
  it('returns null for notes not in a series', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const kotlin = sampleNotes.find((n) => n.slug === 'kotlin')!
    expect(await getSeriesNavigation(repo, kotlin)).toBeNull()
  })

  it('returns prev=null, next=second note for first in series', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const first = sampleNotes.find((n) => n.slug === 'coroutines')! // order 1
    const nav = await getSeriesNavigation(repo, first)
    expect(nav).not.toBeNull()
    expect(nav?.prev).toBeNull()
    expect(nav?.next?.slug).toBe('flows')
  })

  it('returns prev and next for middle note', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const middle = sampleNotes.find((n) => n.slug === 'flows')! // order 2
    const nav = await getSeriesNavigation(repo, middle)
    expect(nav?.prev?.slug).toBe('coroutines')
    expect(nav?.next?.slug).toBe('suspend-funcs')
  })

  it('returns next=null for last note in series', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const last = sampleNotes.find((n) => n.slug === 'suspend-funcs')! // order 3
    const nav = await getSeriesNavigation(repo, last)
    expect(nav?.prev?.slug).toBe('flows')
    expect(nav?.next).toBeNull()
  })

  it('lists all notes in the series sorted by order', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const flows = sampleNotes.find((n) => n.slug === 'flows')!
    const nav = await getSeriesNavigation(repo, flows)
    expect(nav?.series.notes.map((n) => n.slug)).toEqual([
      'coroutines',
      'flows',
      'suspend-funcs',
    ])
  })
})
