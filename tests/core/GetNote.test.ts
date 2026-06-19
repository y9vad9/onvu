import { describe, it, expect } from 'vitest'
import { getNote } from '@core/GetNote'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { sampleNotes } from '../fixtures/notes'

describe('getNote', () => {
  it('returns the note matching the slug', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const note = await getNote(repo, 'kotlin')
    expect(note).not.toBeNull()
    expect(note?.title).toBe('Kotlin')
  })

  it('returns null when slug is unknown', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    expect(await getNote(repo, 'missing')).toBeNull()
  })
})
