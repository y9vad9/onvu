export interface Heading {
  id: string
  text: string
  depth: 1 | 2 | 3 | 4
}

export type OutgoingLink =
  | { kind: 'internal'; slug: string }
  | { kind: 'external'; href: string }

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
  /**
   * Every link out of this note in the order the author wrote them in the
   * body — internal note refs and external URLs interleaved. Used directly
   * for the right-side "Outgoing" panel so the visible order matches the
   * reading order; consumers that only care about internal links (mention
   * graph, backlinks) filter on `kind === 'internal'`.
   */
  outgoingLinks: OutgoingLink[]
  rawText: string
  readingTimeMinutes: number
}
