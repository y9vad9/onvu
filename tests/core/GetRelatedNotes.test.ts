import { describe, it, expect } from 'vitest'
import { getRelatedNotes } from '@core/GetRelatedNotes'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { makeNote, sampleNotes } from '../fixtures/notes'

describe('getRelatedNotes', () => {
  it('returns notes sharing at least one parent', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const coroutines = sampleNotes.find((n) => n.slug === 'coroutines')!
    const related = await getRelatedNotes(repo, coroutines, 5)
    const slugs = related.map((n) => n.slug)
    expect(slugs).toContain('flows')
    expect(slugs).toContain('suspend-funcs')
    expect(slugs).not.toContain('coroutines') // does not return itself
  })

  it('respects the count parameter', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const coroutines = sampleNotes.find((n) => n.slug === 'coroutines')!
    const related = await getRelatedNotes(repo, coroutines, 1)
    expect(related.length).toBe(1)
  })

  it('defaults to 2 results', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const coroutines = sampleNotes.find((n) => n.slug === 'coroutines')!
    const related = await getRelatedNotes(repo, coroutines)
    expect(related.length).toBeLessThanOrEqual(2)
  })

  it('returns empty array for notes with no parents', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const kotlin = sampleNotes.find((n) => n.slug === 'kotlin')!
    expect(await getRelatedNotes(repo, kotlin)).toEqual([])
  })

  it('sorts by overlap count (most shared parents first)', async () => {
    const notes = [
      makeNote({ slug: 'target', title: 'T', parents: ['A', 'B'] }),
      makeNote({ slug: 'two-shared', title: 'X', parents: ['A', 'B'] }),
      makeNote({ slug: 'one-shared', title: 'Y', parents: ['A'] }),
    ]
    const repo = new MemoryNoteRepository(notes)
    const related = await getRelatedNotes(repo, notes[0], 5)
    expect(related[0].slug).toBe('two-shared')
    expect(related[1].slug).toBe('one-shared')
  })
})
