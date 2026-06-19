import { describe, it, expect } from 'vitest'
import { getCategories, getEpics } from '@core/GetCategories'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { sampleNotes } from '../fixtures/notes'

describe('getCategories', () => {
  it('aggregates each parent name with its mention count', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const cats = await getCategories(repo)
    const kotlin = cats.find((c) => c.name === 'Kotlin')
    expect(kotlin?.mentionCount).toBe(3) // coroutines, flows, suspend-funcs
  })

  it('marks a category as epic when an epic note with matching title exists', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const cats = await getCategories(repo)
    const kotlin = cats.find((c) => c.name === 'Kotlin')
    expect(kotlin?.isEpic).toBe(true)
    expect(kotlin?.slug).toBe('kotlin')
  })

  it('sorts categories by mention count descending', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const cats = await getCategories(repo)
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i - 1].mentionCount).toBeGreaterThanOrEqual(cats[i].mentionCount)
    }
  })
})

describe('getEpics', () => {
  it('returns only categories that have a matching epic note', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const epics = await getEpics(repo)
    const names = epics.map((e) => e.name).sort()
    expect(names).toEqual(['Kotlin', 'Web Development'])
  })
})
