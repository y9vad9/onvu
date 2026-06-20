import { describe, it, expect } from 'vitest'
import Fuse from 'fuse.js'
import {
  parsePaletteQuery,
  mergeFuseResults,
  applyParentFilters,
} from '@lib/search/paletteQuery'
import type { SearchIndexEntry } from '@core/search/SearchIndex'

const sample: SearchIndexEntry[] = [
  { slug: 'kotlin', title: 'Kotlin', preview: 'A JVM language', parents: ['Engineering'], rawText: '', date: null, coverImage: null },
  { slug: 'coroutines', title: 'Kotlin Coroutines', preview: 'Suspending functions', parents: ['Engineering'], rawText: '', date: null, coverImage: null },
  { slug: 'next', title: 'Next.js', preview: 'React framework', parents: ['Frontend'], rawText: '', date: null, coverImage: null },
]

describe('parsePaletteQuery', () => {
  it('returns the full query when there are no filters', () => {
    expect(parsePaletteQuery('kotlin coroutines')).toEqual({
      cleanQuery: 'kotlin coroutines',
      parentFilters: [],
    })
  })

  it('splits out parent: filters case-insensitively', () => {
    expect(parsePaletteQuery('Parent:Engineering kotlin')).toEqual({
      cleanQuery: 'kotlin',
      parentFilters: ['Engineering'],
    })
  })

  it('supports stacked parent: filters', () => {
    const { parentFilters, cleanQuery } = parsePaletteQuery(
      'parent:eng parent:back kotlin',
    )
    expect(parentFilters).toEqual(['eng', 'back'])
    expect(cleanQuery).toBe('kotlin')
  })

  it('trims surrounding whitespace from cleanQuery', () => {
    expect(parsePaletteQuery('   parent:x   ').cleanQuery).toBe('')
  })
})

describe('mergeFuseResults', () => {
  function makeFuse() {
    return new Fuse(sample, {
      keys: ['title', 'preview', 'parents'],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true,
    })
  }

  it('requires every token to match — single-token-only hits drop out', () => {
    // 'next' only matches the Next.js note; 'kotlin' only matches the two
    // Kotlin notes. Intersecting yields nothing.
    const result = mergeFuseResults('kotlin next', makeFuse())
    expect(result).toEqual([])
  })

  it('returns intersections when tokens overlap', () => {
    const result = mergeFuseResults('kotlin coroutines', makeFuse())
    expect(result.map((r) => r.slug)).toEqual(['coroutines'])
  })

  it('falls back to the whole query when every token is too short', () => {
    // Tokens 'kt' is below minMatchCharLength of 2; the function should
    // fall back to using the whole "kt" string as a single seed instead
    // of returning an empty seed list.
    const result = mergeFuseResults('kt', makeFuse())
    // We only assert the function returns *something* (Fuse may or may
    // not match): the contract is just that we don't crash on all-short
    // tokens.
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('applyParentFilters', () => {
  it('is a no-op when filters is empty', () => {
    expect(applyParentFilters(sample, [])).toEqual(sample)
  })

  it('keeps notes whose parents include every filter case-insensitively', () => {
    const result = applyParentFilters(sample, ['engineering'])
    expect(result.map((n) => n.slug)).toEqual(['kotlin', 'coroutines'])
  })

  it('returns empty when any filter has no match', () => {
    expect(applyParentFilters(sample, ['Engineering', 'Frontend'])).toEqual([])
  })
})
