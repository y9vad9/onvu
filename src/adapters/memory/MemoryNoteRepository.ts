import type { NoteRepository } from '@core/NoteRepository'
import type { Note } from '@core/Note'

export class MemoryNoteRepository implements NoteRepository {
  constructor(private readonly notes: Note[]) {}

  async getBySlug(slug: string): Promise<Note | null> {
    return this.notes.find((n) => n.slug === slug) ?? null
  }

  async listAll(): Promise<Note[]> {
    return [...this.notes]
  }

  async listByParent(parent: string): Promise<Note[]> {
    return this.notes.filter((n) =>
      n.parents.some((p) => p.toLowerCase() === parent.toLowerCase()),
    )
  }
}
