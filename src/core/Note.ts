export interface Heading {
  id: string
  text: string
  depth: 1 | 2 | 3 | 4
}

export interface Note {
  slug: string
  title: string
  preview: string
  coverImage: string | null
  date: Date | null
  /** Optional last-revision date. Rendered as "Updated …" next to `date`. */
  updated: Date | null
  /** SEO meta description; overrides `preview` for OG and `<meta description>`. */
  description: string | null
  /** Topical tags, surfaced as `keywords` meta and Article JSON-LD. */
  tags: string[]
  /** Optional author override (defaults to siteConfig.owner.name). */
  author: string | null
  /** Excluded from indexing — robots noindex, sitemap, and feed. */
  noindex: boolean
  /** Explicit social card override (absolute or site-relative). */
  ogImage: string | null
  parents: string[]
  series: string | null
  order: number | null
  isArchived: boolean
  isEpic: boolean
  body: string
  headings: Heading[]
  outgoingLinks: string[]
  /** Absolute http(s) URLs the author linked to from the body. */
  outgoingExternalLinks: string[]
  rawText: string
  readingTimeMinutes: number
}
