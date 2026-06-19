import { describe, it, expect } from 'vitest'
import { buildMentionGraph } from '@core/graph/BuildMentionGraph'
import { MemoryNoteRepository } from '@adapters/memory/MemoryNoteRepository'
import { makeNote, sampleNotes } from '../fixtures/notes'

describe('buildMentionGraph', () => {
  it('produces one node per note', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const graph = await buildMentionGraph(repo)
    expect(graph.nodes.length).toBe(sampleNotes.length)
    expect(new Set(graph.nodes.map((n) => n.slug)).size).toBe(sampleNotes.length)
  })

  it('emits link edges from outgoingLinks', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const graph = await buildMentionGraph(repo)
    const linkEdges = graph.edges.filter((e) => e.type === 'link')
    expect(linkEdges).toContainEqual({ source: 'coroutines', target: 'flows', type: 'link' })
    expect(linkEdges).toContainEqual({ source: 'flows', target: 'coroutines', type: 'link' })
  })

  it('emits parent edges by resolving parent name to epic note title', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const graph = await buildMentionGraph(repo)
    const parentEdges = graph.edges.filter((e) => e.type === 'parent')
    expect(parentEdges).toContainEqual({ source: 'coroutines', target: 'kotlin', type: 'parent' })
    expect(parentEdges).toContainEqual({ source: 'nextjs', target: 'web-dev', type: 'parent' })
  })

  it('does not emit parent edge for unknown parent names', async () => {
    const notes = [
      makeNote({ slug: 'a', title: 'A', parents: ['Unknown'] }),
      makeNote({ slug: 'b', title: 'B' }),
    ]
    const graph = await buildMentionGraph(new MemoryNoteRepository(notes))
    expect(graph.edges.filter((e) => e.type === 'parent')).toEqual([])
  })

  it('emits unlinked mention edges when one note rawText contains another title', async () => {
    const notes = [
      makeNote({ slug: 'foo', title: 'Foo', rawText: 'Foo content' }),
      makeNote({ slug: 'bar', title: 'Bar', rawText: 'This mentions Foo in plain text' }),
    ]
    const graph = await buildMentionGraph(new MemoryNoteRepository(notes))
    const linkEdges = graph.edges.filter((e) => e.type === 'link')
    expect(linkEdges).toContainEqual({ source: 'bar', target: 'foo', type: 'link' })
  })

  it('does not duplicate an edge when both explicit link and unlinked mention exist', async () => {
    const notes = [
      makeNote({ slug: 'foo', title: 'Foo', rawText: 'Foo' }),
      makeNote({
        slug: 'bar',
        title: 'Bar',
        outgoingLinks: ['foo'],
        rawText: 'Links to Foo and also mentions Foo in text',
      }),
    ]
    const graph = await buildMentionGraph(new MemoryNoteRepository(notes))
    const edges = graph.edges.filter(
      (e) => e.source === 'bar' && e.target === 'foo' && e.type === 'link',
    )
    expect(edges.length).toBe(1)
  })

  it('skips very short titles to avoid noise', async () => {
    const notes = [
      makeNote({ slug: 'ab', title: 'AB', rawText: 'short title' }),
      makeNote({ slug: 'other', title: 'Other', rawText: 'AB is everywhere' }),
    ]
    const graph = await buildMentionGraph(new MemoryNoteRepository(notes))
    expect(graph.edges.filter((e) => e.target === 'ab')).toEqual([])
  })

  it('counts connections symmetrically per node', async () => {
    const notes = [
      makeNote({ slug: 'a', title: 'A_unique_title', outgoingLinks: ['b'] }),
      makeNote({ slug: 'b', title: 'B_unique_title', outgoingLinks: ['a'] }),
    ]
    const graph = await buildMentionGraph(new MemoryNoteRepository(notes))
    expect(graph.nodes.find((n) => n.slug === 'a')?.connectionCount).toBe(2)
    expect(graph.nodes.find((n) => n.slug === 'b')?.connectionCount).toBe(2)
  })

  it('ignores outgoing links to non-existent notes', async () => {
    const notes = [
      makeNote({ slug: 'a', title: 'A_unique_title', outgoingLinks: ['ghost'] }),
    ]
    const graph = await buildMentionGraph(new MemoryNoteRepository(notes))
    expect(graph.edges).toEqual([])
  })

  it('marks epic nodes correctly', async () => {
    const repo = new MemoryNoteRepository(sampleNotes)
    const graph = await buildMentionGraph(repo)
    const kotlinNode = graph.nodes.find((n) => n.slug === 'kotlin')
    expect(kotlinNode?.isEpic).toBe(true)
    const coroutinesNode = graph.nodes.find((n) => n.slug === 'coroutines')
    expect(coroutinesNode?.isEpic).toBe(false)
  })
})
