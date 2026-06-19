import type { NoteRepository } from '@core/NoteRepository'
import type { Category } from '@core/Category'

export async function getCategories(repo: NoteRepository): Promise<Category[]> {
  const notes = await repo.listAll()

  const mentionCount = new Map<string, number>()
  for (const note of notes) {
    for (const parent of note.parents) {
      mentionCount.set(parent, (mentionCount.get(parent) ?? 0) + 1)
    }
  }

  const epicNotes = notes.filter((n) => n.isEpic)
  const epicByTitle = new Map(epicNotes.map((n) => [n.title.toLowerCase(), n]))

  const seen = new Set<string>()
  const categories: Category[] = []

  for (const [name, count] of Array.from(mentionCount.entries())) {
    if (seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())

    const epicNote = epicByTitle.get(name.toLowerCase())
    categories.push({
      name,
      slug: epicNote?.slug ?? null,
      isEpic: !!epicNote,
      icon: null,
      mentionCount: count,
      preview: epicNote?.preview ?? null,
    })
  }

  return categories.sort((a, b) => b.mentionCount - a.mentionCount)
}

export async function getEpics(repo: NoteRepository): Promise<Category[]> {
  const all = await getCategories(repo)
  return all.filter((c) => c.isEpic)
}
