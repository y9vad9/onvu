import type { NoteRepository } from '@core/NoteRepository'
import type { Note } from '@core/Note'

export interface Mentions {
  linked: Note[]
  unlinked: Note[]
}

export async function getMentions(
  repo: NoteRepository,
  note: Note,
): Promise<Mentions> {
  const all = await repo.listAll()
  const linked: Note[] = []
  const unlinked: Note[] = []

  for (const other of all) {
    if (other.slug === note.slug) continue
    const linksToNote = other.outgoingLinks.some(
      (l) => l.kind === 'internal' && l.slug === note.slug,
    )
    if (linksToNote) {
      linked.push(other)
      continue
    }
    const mentionsTitle = other.rawText.toLowerCase().includes(note.title.toLowerCase())
    if (mentionsTitle) {
      unlinked.push(other)
    }
  }

  return { linked, unlinked }
}
