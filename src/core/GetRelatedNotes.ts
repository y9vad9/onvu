import type { NoteRepository } from '@core/NoteRepository'
import type { Note } from '@core/Note'

export async function getRelatedNotes(
  repo: NoteRepository,
  note: Note,
  count = 2,
): Promise<Note[]> {
  if (note.parents.length === 0) return []

  const candidates = new Map<string, number>()
  for (const parent of note.parents) {
    const siblings = await repo.listByParent(parent)
    for (const sibling of siblings) {
      if (sibling.slug === note.slug) continue
      candidates.set(sibling.slug, (candidates.get(sibling.slug) ?? 0) + 1)
    }
  }

  const all = await repo.listAll()
  const noteMap = new Map(all.map((n) => [n.slug, n]))

  return Array.from(candidates.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      const noteA = noteMap.get(a[0])
      const noteB = noteMap.get(b[0])
      if (!noteA?.date || !noteB?.date) return 0
      return noteB.date.getTime() - noteA.date.getTime()
    })
    .slice(0, count)
    .map(([slug]) => noteMap.get(slug))
    .filter((n): n is Note => n !== undefined)
}
