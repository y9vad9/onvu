export interface SearchIndexEntry {
  slug: string
  title: string
  preview: string
  rawText: string
  parents: string[]
  date: string | null
  coverImage: string | null
}
