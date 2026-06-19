import { describe, it, expect } from 'vitest'
import { deepMerge } from '@lib/deepMerge'

describe('deepMerge', () => {
  it('overrides one nested key without losing siblings', () => {
    const base = { home: { notes: 'Notes', work: 'Work', projects: 'Projects' } }
    const override = { home: { notes: 'Writing' } }
    expect(deepMerge(base, override)).toEqual({
      home: { notes: 'Writing', work: 'Work', projects: 'Projects' },
    })
  })

  it('passes through user-only top-level keys', () => {
    const base = { a: 1 }
    const override = { b: 2 }
    expect(deepMerge(base, override)).toEqual({ a: 1, b: 2 })
  })

  it('replaces primitives rather than merging them', () => {
    expect(deepMerge({ x: 'old' }, { x: 'new' })).toEqual({ x: 'new' })
    expect(deepMerge({ x: 1 }, { x: 'now-a-string' })).toEqual({ x: 'now-a-string' })
  })

  it('replaces arrays wholesale', () => {
    expect(deepMerge({ list: [1, 2, 3] }, { list: [9] })).toEqual({ list: [9] })
  })

  it('leaves base unmutated', () => {
    const base = { nested: { a: 1 } }
    deepMerge(base, { nested: { b: 2 } })
    expect(base).toEqual({ nested: { a: 1 } })
  })
})
