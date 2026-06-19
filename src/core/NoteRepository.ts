import type { Note } from '@core/Note'

export interface NoteRepository {
  getBySlug(slug: string): Promise<Note | null>
  listAll(): Promise<Note[]>
  listByParent(parent: string): Promise<Note[]>
}
