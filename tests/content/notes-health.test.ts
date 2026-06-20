import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { routing } from '@i18n/routing'
import { FileSystemNoteRepository } from '@adapters/fs/FileSystemNoteRepository'
import type { Locale } from '@config/site'

/**
 * Content-health tests. These walk the actual `content/notes/` tree and
 * assert the references an author writes are valid:
 *
 *   - Cover images and body images point at files that exist (after the
 *     pipeline materialises co-located assets into `public/notes-assets/`).
 *   - Embedded videos point at files that exist.
 *   - Internal links (plain `/notes/<slug>` refs or resolved wiki links)
 *     point at notes that exist. Broken wiki links — `[[Missing]]` — are
 *     intentionally allowed because they have a dedicated visual marker
 *     (`wikilink-broken`); they're an editorial signal, not a bug. Any
 *     OTHER form of dead internal link is treated as a failure.
 *   - External URLs are well-formed enough that `new URL(href)` accepts
 *     them. We don't hit the network — that's flaky and slow — but a
 *     syntactically bogus URL still gets caught.
 *
 * If a locale has no notes the suite skips gracefully, so adding a new
 * locale won't break CI before content lands.
 */

// Compute roots lazily so a test that chdirs into a tmp content set still
// resolves assets against the right location.
function publicRoot(): string { return path.join(process.cwd(), 'public') }
function notesRoot(): string { return path.join(process.cwd(), 'content', 'notes') }

function fileExistsAt(absolutePath: string): boolean {
  try {
    return fs.statSync(absolutePath).isFile()
  } catch {
    return false
  }
}

/**
 * Validates an `<img src>` or `<video><source src>` reference. Accepts:
 *
 *   - External URLs and `data:` / protocol-relative refs (we don't hit the
 *     network).
 *   - Site-absolute paths (`/notes-assets/foo.webp`, `/cover.jpg`) that
 *     resolve under `public/`. This is the path the pipeline produces
 *     after `processNoteImage` / `processNoteVideo` materialise a
 *     co-located file.
 *   - Co-located refs under the note's locale directory, including any
 *     subdirectories: an author can write `![](./demo.mp4)` next to the
 *     note, or `![](videos/intro.mp4)` in a subfolder, and the test
 *     accepts that as long as the source file exists. The pipeline
 *     normally rewrites such refs to `/notes-assets/...` before they
 *     reach us; this branch is a belt-and-braces fallback for cases
 *     where the original ref leaks through (e.g. an inline `<img>` in
 *     raw HTML inside the markdown).
 *
 * Videos use the exact same rules as images — the pipeline supports
 * co-located videos the same way it supports images.
 */
function checkAsset(
  src: string,
  kind: 'image' | 'video',
  locale: string,
): string | null {
  if (!src) return `empty src for ${kind}`
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return null // external URL
  if (src.startsWith('data:')) return null
  if (src.startsWith('//')) return null // protocol-relative — treated as external

  if (src.startsWith('/')) {
    const trimmed = src.replace(/^\/+/, '').split(/[?#]/)[0]
    return fileExistsAt(path.join(publicRoot(), trimmed))
      ? null
      : `${kind} not found at public/${trimmed}`
  }

  // Co-located ref. Strip leading `./` and any query/hash, then look it up
  // against the note's locale directory. Subdirs (`videos/foo.mp4`) are
  // honoured because path.resolve handles them naturally.
  const cleaned = src.replace(/^\.\//, '').split(/[?#]/)[0]
  const localeDir = path.join(notesRoot(), locale)
  const candidate = path.resolve(localeDir, cleaned)
  // Guard against `..` traversal escaping the locale dir.
  if (!candidate.startsWith(localeDir + path.sep) && candidate !== localeDir) {
    return `${kind} escapes content/notes/${locale}: ${src}`
  }
  return fileExistsAt(candidate)
    ? null
    : `${kind} not found at content/notes/${locale}/${cleaned}`
}

function extractByTag(html: string, tag: string, attr: 'src' | 'href'): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*\\s${attr}=("|')([^"']+)\\1`, 'gi')
  const out: string[] = []
  for (const m of html.matchAll(re)) out.push(m[2])
  return out
}

function extractAnchors(
  html: string,
): Array<{ href: string; noteSlug: string | null; broken: boolean }> {
  const re = /<a\b([^>]*)>/gi
  const out: Array<{ href: string; noteSlug: string | null; broken: boolean }> = []
  for (const m of html.matchAll(re)) {
    const attrs = m[1]
    const hrefMatch = attrs.match(/\shref=("|')([^"']+)\1/i)
    if (!hrefMatch) continue
    const href = hrefMatch[2]
    const classMatch = attrs.match(/\sclass=("|')([^"']*)\1/i)
    const broken = !!classMatch && /\bwikilink-broken\b/.test(classMatch[2])
    const slugMatch = attrs.match(/\sdata-note-slug=("|')([^"']+)\1/i)
    const noteSlug = slugMatch ? slugMatch[2] : null
    out.push({ href, noteSlug, broken })
  }
  return out
}

function slugFromHref(href: string): string | null {
  const m = href.match(/^\/(?:[a-z]{2}\/)?notes\/([^#?/]+)/)
  return m ? m[1] : null
}

for (const locale of routing.locales) {
  describe(`content health [${locale}]`, () => {
    it('cover, body images and videos all resolve', async () => {
      const repo = new FileSystemNoteRepository(locale as Locale)
      const notes = await repo.listAll()
      if (notes.length === 0) return // no content for this locale yet
      const errors: string[] = []
      for (const note of notes) {
        if (note.coverImage) {
          const err = checkAsset(note.coverImage, 'image', locale)
          if (err) errors.push(`[${note.slug}] cover ${err}`)
        }
        for (const src of extractByTag(note.body, 'img', 'src')) {
          const err = checkAsset(src, 'image', locale)
          if (err) errors.push(`[${note.slug}] ${err}`)
        }
        for (const src of extractByTag(note.body, 'source', 'src')) {
          const err = checkAsset(src, 'video', locale)
          if (err) errors.push(`[${note.slug}] ${err}`)
        }
      }
      expect(errors).toEqual([])
    }, 60_000)

    it('every internal link points at an existing note (broken wikilinks excepted)', async () => {
      const repo = new FileSystemNoteRepository(locale as Locale)
      const notes = await repo.listAll()
      if (notes.length === 0) return
      const slugSet = new Set(notes.map((n) => n.slug))
      const errors: string[] = []
      for (const note of notes) {
        // Source of truth #1: outgoingLinks. These are the links the
        // pipeline collected for the side panel — every internal entry
        // must be a real note. Broken wikilinks never reach this list
        // (they have href="#"), so this assertion catches both plain
        // markdown `[X](/notes/missing)` AND resolved wikilinks pointing
        // at slugs that have since been deleted.
        for (const link of note.outgoingLinks) {
          if (link.kind === 'internal' && !slugSet.has(link.slug)) {
            errors.push(`[${note.slug}] dead internal link → ${link.slug}`)
          }
        }
        // Source of truth #2: the rendered body. Catches anchors with
        // hrefs like /notes/<slug> that somehow slipped past the
        // extractor (e.g. an HTML anchor written by hand inside the
        // markdown). Wiki-broken anchors are by-design and allowed.
        for (const a of extractAnchors(note.body)) {
          if (a.broken) continue
          if (a.noteSlug && !slugSet.has(a.noteSlug)) {
            errors.push(`[${note.slug}] dead data-note-slug → ${a.noteSlug}`)
            continue
          }
          const slug = slugFromHref(a.href)
          if (slug && !slugSet.has(slug)) {
            errors.push(`[${note.slug}] dead plain link → /notes/${slug}`)
          }
        }
      }
      expect(errors).toEqual([])
    }, 60_000)

    it('every external link is a syntactically valid URL', async () => {
      const repo = new FileSystemNoteRepository(locale as Locale)
      const notes = await repo.listAll()
      if (notes.length === 0) return
      const errors: string[] = []
      for (const note of notes) {
        for (const link of note.outgoingLinks) {
          if (link.kind !== 'external') continue
          try {
            // Throws on malformed URLs. We don't hit the network.
            new URL(link.href)
          } catch {
            errors.push(`[${note.slug}] malformed external href → ${link.href}`)
          }
        }
      }
      expect(errors).toEqual([])
    }, 60_000)

    it('co-located videos in subdirectories are accepted (pipeline materialises them)', async () => {
      // Pipeline + checkAsset together must accept both images and videos
      // placed anywhere under content/notes/<locale>/, including subdirs.
      // We exercise the path against a tmp content set so the test stays
      // independent of whatever real videos the user happens to have. If
      // the locale has no real notes, that's enough signal to skip — we
      // only care that the locale config itself accepts the pattern.
      const tmpRoot = await fsp.realpath(
        await fsp.mkdtemp(path.join(os.tmpdir(), `onvu-vid-${locale}-`)),
      )
      const before = process.cwd()
      try {
        const noteDir = path.join(tmpRoot, 'content', 'notes', locale)
        await fsp.mkdir(path.join(noteDir, 'media'), { recursive: true })
        await fsp.writeFile(path.join(noteDir, 'media', 'demo.mp4'), 'X')
        await fsp.writeFile(
          path.join(noteDir, 'demo.md'),
          `---\ntitle: Demo\n---\n\n![clip](./media/demo.mp4)`,
          'utf-8',
        )
        process.chdir(tmpRoot)
        // processNoteVideo / processNoteImage compute ASSETS_ROOT at module
        // load time, so we need a fresh module graph that resolves it
        // against the tmp cwd.
        vi.resetModules()
        const { FileSystemNoteRepository: Repo } = await import(
          '@adapters/fs/FileSystemNoteRepository'
        )
        const note = (await new Repo(locale as Locale).getBySlug('demo'))!
        expect(note).toBeTruthy()
        const videoSrcs = extractByTag(note.body, 'source', 'src')
        expect(videoSrcs).toHaveLength(1)
        const err = checkAsset(videoSrcs[0], 'video', locale)
        expect(err).toBeNull()
      } finally {
        process.chdir(before)
      }
    }, 30_000)

    it('rejects co-located refs that live under a different locale folder', async () => {
      // A note in content/notes/<locale>/ can only reach its OWN locale's
      // assets. Putting `cover.png` under content/notes/de/ and referencing
      // it from an `en` note must fail — locale isolation is part of the
      // content contract. We check this by running checkAsset against a
      // tmp content tree where the asset is present only in the other
      // locale.
      const otherLocale = routing.locales.find((l) => l !== locale)
      if (!otherLocale) return // single-locale projects skip naturally.
      const tmpRoot = await fsp.realpath(
        await fsp.mkdtemp(path.join(os.tmpdir(), `onvu-iso-${locale}-`)),
      )
      const before = process.cwd()
      try {
        await fsp.mkdir(path.join(tmpRoot, 'content', 'notes', otherLocale), { recursive: true })
        await fsp.mkdir(path.join(tmpRoot, 'content', 'notes', locale), { recursive: true })
        // shared.png lives only under the *other* locale.
        await fsp.writeFile(
          path.join(tmpRoot, 'content', 'notes', otherLocale, 'shared.png'),
          'X',
        )
        process.chdir(tmpRoot)
        const err = checkAsset('./shared.png', 'image', locale)
        expect(err).toMatch(new RegExp(`content/notes/${locale}/shared\\.png`))
      } finally {
        process.chdir(before)
      }
    })

    it('frontmatter has the minimum fields the rest of the app relies on', async () => {
      const repo = new FileSystemNoteRepository(locale as Locale)
      const notes = await repo.listAll()
      if (notes.length === 0) return
      const errors: string[] = []
      for (const note of notes) {
        if (!note.title || note.title === note.slug) {
          errors.push(`[${note.slug}] missing or default 'title' in frontmatter`)
        }
        if (note.parents.some((p) => !p.trim())) {
          errors.push(`[${note.slug}] empty parent entry`)
        }
        if (note.date && Number.isNaN(note.date.getTime())) {
          errors.push(`[${note.slug}] unparseable 'date'`)
        }
        if (note.updated && Number.isNaN(note.updated.getTime())) {
          errors.push(`[${note.slug}] unparseable 'updated'`)
        }
      }
      expect(errors).toEqual([])
    }, 60_000)
  })
}
