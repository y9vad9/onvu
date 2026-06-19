import type { NoteRepository } from '@core/NoteRepository'
import type { Note } from '@core/Note'
import type { Series } from '@core/Series'

export interface SeriesNavigation {
  series: Series
  prev: Note | null
  next: Note | null
}

export async function getSeriesNavigation(
  repo: NoteRepository,
  note: Note,
): Promise<SeriesNavigation | null> {
  if (!note.series) return null

  const all = await repo.listAll()
  const seriesNotes = all
    .filter((n) => n.series === note.series && n.order !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (seriesNotes.length === 0) return null

  const idx = seriesNotes.findIndex((n) => n.slug === note.slug)

  return {
    series: {
      name: note.series,
      notes: seriesNotes.map((n) => ({
        slug: n.slug,
        title: n.title,
        order: n.order ?? 0,
      })),
    },
    prev: idx > 0 ? seriesNotes[idx - 1] : null,
    next: idx < seriesNotes.length - 1 ? seriesNotes[idx + 1] : null,
  }
}
