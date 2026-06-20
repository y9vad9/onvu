import type Fuse from 'fuse.js'
import type { SearchIndexEntry } from '@core/search/SearchIndex'

export interface ParsedPaletteQuery {
  cleanQuery: string
  parentFilters: string[]
}

/**
 * Splits the command palette input into:
 *   - parentFilters: every `parent:<value>` token
 *   - cleanQuery: the remaining text used for fuzzy search
 *
 * Authors can stack filters: `kotlin parent:engineering parent:backend`.
 */
export function parsePaletteQuery(query: string): ParsedPaletteQuery {
  const parts = query.split(/\s+/)
  const parentFilters: string[] = []
  const rest: string[] = []
  for (const part of parts) {
    const m = part.match(/^parent:(.+)$/i)
    if (m) parentFilters.push(m[1])
    else rest.push(part)
  }
  return { cleanQuery: rest.join(' ').trim(), parentFilters }
}

/**
 * Runs `fuse.search` for every whitespace-separated token in `cleanQuery`
 * (≥2 chars; falls back to the whole query if all tokens are too short),
 * then intersects the per-token result sets on slug and sums scores. A
 * lower combined score is better — items that match every token rank
 * first.
 *
 * The combined-score-then-sort approach matters: a single-token search
 * could otherwise return notes that match one rare term over notes that
 * match all of a multi-word query weakly.
 */
export function mergeFuseResults(
  cleanQuery: string,
  fuse: Fuse<SearchIndexEntry>,
): SearchIndexEntry[] {
  const tokens = cleanQuery.split(/\s+/).filter((t) => t.length >= 2)
  const seeds = tokens.length > 0 ? tokens : [cleanQuery]
  let merged: Map<string, { item: SearchIndexEntry; score: number }> | null = null
  for (const token of seeds) {
    const hits = fuse.search(token)
    const map = new Map<string, { item: SearchIndexEntry; score: number }>()
    for (const h of hits) {
      map.set(h.item.slug, { item: h.item, score: h.score ?? 1 })
    }
    if (merged === null) {
      merged = map
    } else {
      const next = new Map<string, { item: SearchIndexEntry; score: number }>()
      for (const [slug, prev] of merged) {
        const hit = map.get(slug)
        if (hit) next.set(slug, { item: prev.item, score: prev.score + hit.score })
      }
      merged = next
    }
    if (merged.size === 0) break
  }
  return Array.from((merged ?? new Map<string, { item: SearchIndexEntry; score: number }>()).values())
    .sort((a, b) => a.score - b.score)
    .map((r) => r.item)
}

/**
 * Applies the `parent:<value>` filters from `parsePaletteQuery` to a
 * candidate result list. Case-insensitive; every filter must match.
 */
export function applyParentFilters(
  results: SearchIndexEntry[],
  parentFilters: string[],
): SearchIndexEntry[] {
  if (parentFilters.length === 0) return results
  return results.filter((n) =>
    parentFilters.every((p) =>
      n.parents.some((np) => np.toLowerCase() === p.toLowerCase()),
    ),
  )
}
