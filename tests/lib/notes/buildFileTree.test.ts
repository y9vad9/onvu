import { describe, it, expect } from 'vitest'
import { buildFileTree } from '@lib/notes/buildFileTree'

describe('buildFileTree', () => {
  it('returns standalone notes as their own entries', () => {
    const result = buildFileTree([
      { slug: 'a', title: 'Alpha', series: null, order: null },
      { slug: 'b', title: 'Beta', series: null, order: null },
    ])
    expect(result).toEqual([
      { slug: 'a', displayTitle: 'Alpha', isSeries: false },
      { slug: 'b', displayTitle: 'Beta', isSeries: false },
    ])
  })

  it('collapses a series to a single entry titled by the series name', () => {
    const result = buildFileTree([
      { slug: 'p2', title: 'Part 2', series: 'Concurrency', order: 2 },
      { slug: 'p1', title: 'Part 1', series: 'Concurrency', order: 1 },
    ])
    expect(result).toEqual([
      { slug: 'p1', displayTitle: 'Concurrency', isSeries: true },
    ])
  })

  it('places series entries before standalones', () => {
    const result = buildFileTree([
      { slug: 'lone', title: 'Lone', series: null, order: null },
      { slug: 's1', title: 'S Part 1', series: 'Sigma', order: 1 },
    ])
    expect(result.map((e) => e.slug)).toEqual(['s1', 'lone'])
  })

  it('uses the lowest-order series member as the link target', () => {
    const result = buildFileTree([
      { slug: 'mid', title: 'Mid', series: 'X', order: 5 },
      { slug: 'first', title: 'First', series: 'X', order: 1 },
      { slug: 'last', title: 'Last', series: 'X', order: 10 },
    ])
    expect(result[0]).toEqual({ slug: 'first', displayTitle: 'X', isSeries: true })
  })

  it('treats missing order as 0 when sorting series members', () => {
    const result = buildFileTree([
      { slug: 'no-order', title: 'No order', series: 'Y', order: null },
      { slug: 'ordered', title: 'Ordered', series: 'Y', order: 3 },
    ])
    // null becomes 0, so 'no-order' sorts first.
    expect(result[0].slug).toBe('no-order')
  })
})
