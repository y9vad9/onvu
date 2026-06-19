export interface SeriesEntry {
  slug: string
  title: string
  order: number
}

export interface Series {
  name: string
  notes: SeriesEntry[]
}
