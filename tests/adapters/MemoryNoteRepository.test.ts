import { describe, it, expect } from 'vitest'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { sampleNotes } from '../fixtures/notes'

describe('MemoryNoteRepository', () => {
  it('getBySlug returns the matching note', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const note = await repo.getBySlug('kotlin')
    expect(note?.slug).toBe('kotlin')
  })

  it('getBySlug returns null for unknown slug', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    expect(await repo.getBySlug('nope')).toBeNull()
  })

  it('listAll returns all notes', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const all = await repo.listAll()
    expect(all.length).toBe(sampleNotes.length)
  })

  it('listByParent is case-insensitive', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    expect((await repo.listByParent('kotlin')).length).toBe(3)
    expect((await repo.listByParent('KOTLIN')).length).toBe(3)
  })
})
