import type { NoteRepository } from '@core/NoteRepository'
import type { SearchIndexEntry } from '@core/search/SearchIndex'

export async function buildSearchIndex(
  repo: NoteRepository,
): Promise<SearchIndexEntry[]> {
  const notes = await repo.listAll()
  return notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    preview: note.preview,
    rawText: note.rawText,
    parents: note.parents,
    date: note.date ? note.date.toISOString() : null,
    coverImage: note.coverImage,
  }))
}
