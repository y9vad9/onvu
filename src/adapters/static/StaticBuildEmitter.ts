import fs from 'node:fs/promises'
import path from 'node:path'
import type { NoteRepository } from '@core/NoteRepository'
import type { Locale } from '@config/site'
import { buildSearchIndex } from '@core/search/BuildSearchIndex'
import { buildMentionGraph } from '@core/graph/BuildMentionGraph'

const OUT_ROOT = path.join(process.cwd(), 'public', '_static')

const emitted = new Set<Locale>()

/**
 * Emits per-locale JSON snapshots used by the static client. Each locale
 * gets its own subfolder: `public/_static/<locale>/{notes-index,search-index,graph}.json`.
 */
export async function emitStaticData(
  repo: NoteRepository,
  locale: Locale,
): Promise<void> {
  if (emitted.has(locale)) return
  emitted.add(locale)

  const outDir = path.join(OUT_ROOT, locale)
  await fs.mkdir(outDir, { recursive: true })

  const [notes, searchIndex, graph] = await Promise.all([
    repo.listAll(),
    buildSearchIndex(repo),
    buildMentionGraph(repo),
  ])

  const serializedNotes = notes.map((n) => ({
    ...n,
    date: n.date?.toISOString() ?? null,
  }))

  await Promise.all([
    fs.writeFile(
      path.join(outDir, 'notes-index.json'),
      JSON.stringify(serializedNotes),
    ),
    fs.writeFile(
      path.join(outDir, 'search-index.json'),
      JSON.stringify(searchIndex),
    ),
    fs.writeFile(
      path.join(outDir, 'graph.json'),
      JSON.stringify(graph),
    ),
  ])
}
