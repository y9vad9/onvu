export interface FileTreeNote {
  slug: string
  title: string
  series: string | null
  order: number | null
}

export interface FileTreeEntry {
  slug: string
  displayTitle: string
  isSeries: boolean
}

/**
 * Collapses a flat note list into the entries shown in the Explorer's
 * "Files" tab. Each series becomes a single entry (whose slug is the
 * lowest-order member, used as the link target) and each standalone note
 * is its own entry. Order is: all series first, then standalones in input
 * order — matches the rendered list.
 *
 * Extracted from ExplorerPanel so the logic can be tested without
 * rendering React.
 */
export function buildFileTree(notes: FileTreeNote[]): FileTreeEntry[] {
  const seriesMap = new Map<string, FileTreeNote[]>()
  const standalone: FileTreeNote[] = []

  for (const note of notes) {
    if (note.series) {
      if (!seriesMap.has(note.series)) seriesMap.set(note.series, [])
      seriesMap.get(note.series)!.push(note)
    } else {
      standalone.push(note)
    }
  }

  const entries: FileTreeEntry[] = []
  for (const [name, notesInSeries] of Array.from(seriesMap.entries())) {
    const sorted = notesInSeries
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const first = sorted[0]
    entries.push({ slug: first.slug, displayTitle: name, isSeries: true })
  }
  for (const note of standalone) {
    entries.push({ slug: note.slug, displayTitle: note.title, isSeries: false })
  }
  return entries
}
