import { describe, it, expect } from 'vitest'
import { buildSearchIndex } from '@core/search/BuildSearchIndex'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { sampleNotes } from '../fixtures/notes'

describe('buildSearchIndex', () => {
  it('produces one entry per note', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const index = await buildSearchIndex(repo)
    expect(index.length).toBe(sampleNotes.length)
  })

  it('serializes date to ISO string or null', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const index = await buildSearchIndex(repo)
    const kotlin = index.find((e) => e.slug === 'kotlin')
    expect(kotlin?.date).toBe('2024-01-05T00:00:00.000Z')
    const undated = index.find((e) => e.slug === 'no-date')
    expect(undated?.date).toBeNull()
  })

  it('preserves rawText for full-text search', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const index = await buildSearchIndex(repo)
    const kotlin = index.find((e) => e.slug === 'kotlin')
    expect(kotlin?.rawText).toContain('Kotlin')
  })

  it('preserves parents array', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const index = await buildSearchIndex(repo)
    const coroutines = index.find((e) => e.slug === 'coroutines')
    expect(coroutines?.parents).toEqual(['Kotlin'])
  })
})
