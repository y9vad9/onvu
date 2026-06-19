import type { NoteRepository } from '@core/NoteRepository'
import type { Locale } from '@config/site'
import { FileSystemNoteRepository } from './fs/FileSystemNoteRepository'

// Both modes use the FileSystem adapter during SSR/build.
// In static mode, emitStaticData() is called at build time to produce
// public/_static/*.json for client-side search and graph features.
// In server mode, the FS adapter is used on every request with no pre-build step.
const _repos = new Map<Locale, NoteRepository>()

/**
 * Returns a locale-scoped note repository. Each locale has its own folder
 * under `content/notes/<locale>/` and produces an independent note space —
 * separate slugs, separate wiki-link resolution, separate mention graph.
 */
export function createRepository(locale: Locale): NoteRepository {
  let repo = _repos.get(locale)
  if (!repo) {
    repo = new FileSystemNoteRepository(locale)
    _repos.set(locale, repo)
  }
  return repo
}
