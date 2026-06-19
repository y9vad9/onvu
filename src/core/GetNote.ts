import type { NoteRepository } from '@core/NoteRepository'
import type { Note } from '@core/Note'

export async function getNote(
  repo: NoteRepository,
  slug: string,
): Promise<Note | null> {
  return repo.getBySlug(slug)
}
