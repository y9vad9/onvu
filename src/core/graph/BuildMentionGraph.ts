import type { NoteRepository } from '@core/NoteRepository'
import type { MentionGraph, GraphNode, GraphEdge } from '@core/graph/MentionGraph'
import type { Note } from '@core/Note'

function parentNoteSlug(parent: string, notesByTitle: Map<string, Note>): string | null {
  return notesByTitle.get(parent.toLowerCase())?.slug ?? null
}

export async function buildMentionGraph(
  repo: NoteRepository,
): Promise<MentionGraph> {
  const notes = await repo.listAll()
  const slugSet = new Set(notes.map((n) => n.slug))
  const notesByTitle = new Map(notes.map((n) => [n.title.toLowerCase(), n]))
  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  function addEdge(source: string, target: string, type: GraphEdge['type']): void {
    const key = `${source}\x00${target}\x00${type}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ source, target, type })
  }

  // Pre-lowercase titles for unlinked mention scan
  const titleByNote = notes.map((n) => ({ note: n, lowerTitle: n.title.toLowerCase() }))

  for (const note of notes) {
    // Explicit outgoing links
    const outgoingSet = new Set(note.outgoingLinks)
    for (const target of note.outgoingLinks) {
      if (slugSet.has(target)) addEdge(note.slug, target, 'link')
    }

    // Parent references (epic notes)
    for (const parent of note.parents) {
      const parentSlug = parentNoteSlug(parent, notesByTitle)
      if (parentSlug && parentSlug !== note.slug) {
        addEdge(note.slug, parentSlug, 'parent')
      }
    }

    // Unlinked mentions: scan this note's rawText for other notes' titles
    const lowerText = note.rawText.toLowerCase()
    for (const { note: other, lowerTitle } of titleByNote) {
      if (other.slug === note.slug) continue
      if (outgoingSet.has(other.slug)) continue // already a linked edge
      if (lowerTitle.length < 3) continue // skip very short titles to avoid noise
      if (lowerText.includes(lowerTitle)) {
        addEdge(note.slug, other.slug, 'link')
      }
    }
  }

  // Connection count per node
  const connectionCount = new Map<string, number>()
  for (const note of notes) connectionCount.set(note.slug, 0)
  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1)
  }

  const nodes: GraphNode[] = notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    connectionCount: connectionCount.get(note.slug) ?? 0,
    isEpic: note.isEpic,
  }))

  return { nodes, edges }
}
