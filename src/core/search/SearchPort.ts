import type { SearchIndexEntry } from '@core/search/SearchIndex'

export interface SearchResult {
  entry: SearchIndexEntry
  matches: string[]
}

export interface SearchPort {
  search(query: string, parentFilter?: string[]): Promise<SearchResult[]>
  searchFullText(query: string): Promise<SearchResult[]>
}
