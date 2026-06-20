import { describe, it, expect } from 'vitest'
import { getMentions } from '@core/GetMentions'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { makeNote } from '../fixtures/notes'

describe('getMentions', () => {
  it('classifies notes with explicit outgoing link as linked mentions', async () => {
    const notes = [
      makeNote({ slug: 'target', title: 'Target_unique', rawText: 'content' }),
      makeNote({ slug: 'a', title: 'A', outgoingLinks: [{ kind: 'internal', slug: 'target' }], rawText: 'has link' }),
    ]
    const repo = new MemoryNoteRepository(notes)
    const result = await getMentions(repo, notes[0])
    expect(result.linked.map((n) => n.slug)).toEqual(['a'])
    expect(result.unlinked).toEqual([])
  })

  it('classifies notes mentioning the title without a link as unlinked', async () => {
    const notes = [
      makeNote({ slug: 'target', title: 'Target_unique', rawText: 'content' }),
      makeNote({ slug: 'b', title: 'B', rawText: 'casually mentions Target_unique in prose' }),
    ]
    const repo = new MemoryNoteRepository(notes)
    const result = await getMentions(repo, notes[0])
    expect(result.unlinked.map((n) => n.slug)).toEqual(['b'])
    expect(result.linked).toEqual([])
  })

  it('does not return the note itself', async () => {
    const note = makeNote({ slug: 'self', title: 'Self_unique', rawText: 'I am Self_unique' })
    const repo = new MemoryNoteRepository([note])
    const result = await getMentions(repo, note)
    expect(result.linked).toEqual([])
    expect(result.unlinked).toEqual([])
  })

  it('prefers linked classification when both link and title mention exist', async () => {
    const notes = [
      makeNote({ slug: 'target', title: 'Target_unique', rawText: 'content' }),
      makeNote({
        slug: 'c',
        title: 'C',
        outgoingLinks: [{ kind: 'internal', slug: 'target' }],
        rawText: 'Target_unique is mentioned and linked',
      }),
    ]
    const repo = new MemoryNoteRepository(notes)
    const result = await getMentions(repo, notes[0])
    expect(result.linked.map((n) => n.slug)).toEqual(['c'])
    expect(result.unlinked).toEqual([])
  })
})
