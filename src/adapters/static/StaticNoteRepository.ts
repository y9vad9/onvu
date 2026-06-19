import type { NoteRepository } from '@core/NoteRepository'
import type { Note } from '@core/Note'
import type { Locale } from '@config/site'

interface SerializedNote extends Omit<Note, 'date'> {
  date: string | null
}

function deserialize(n: SerializedNote): Note {
  return { ...n, date: n.date ? new Date(n.date) : null }
}

export class StaticNoteRepository implements NoteRepository {
  private notes: Map<string, Note> | null = null

  constructor(private readonly locale: Locale) {}

  private async load(): Promise<Map<string, Note>> {
    if (this.notes) return this.notes
    const res = await fetch(`/api/notes-index?locale=${encodeURIComponent(this.locale)}`, {
      cache: 'force-cache',
    })
    if (!res.ok) throw new Error('Failed to load static notes index')
    const raw: SerializedNote[] = await res.json()
    this.notes = new Map(raw.map((n) => [n.slug, deserialize(n)]))
    return this.notes
  }

  async getBySlug(slug: string): Promise<Note | null> {
    const map = await this.load()
    return map.get(slug) ?? null
  }

  async listAll(): Promise<Note[]> {
    const map = await this.load()
    return Array.from(map.values())
  }

  async listByParent(parent: string): Promise<Note[]> {
    const all = await this.listAll()
    return all.filter((n) =>
      n.parents.some((p) => p.toLowerCase() === parent.toLowerCase()),
    )
  }
}
