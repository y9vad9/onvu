import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { routing } from '@i18n/routing'

let tmpRoot: string
let originalCwd: string

beforeEach(async () => {
  originalCwd = process.cwd()
  tmpRoot = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'onvu-sitemap-')))
  for (const l of routing.locales) {
    await fs.mkdir(path.join(tmpRoot, 'content', 'notes', l), { recursive: true })
  }
  process.chdir(tmpRoot)
  vi.resetModules()
})

afterAll(() => process.chdir(originalCwd))

async function write(locale: string, file: string, body: string) {
  await fs.writeFile(
    path.join(tmpRoot, 'content', 'notes', locale, file),
    body,
    'utf-8',
  )
}

describe('sitemap', () => {
  it('emits a home + /notes entry per locale plus per-note entries', async () => {
    await write('en', 'kotlin.md', `---\ntitle: Kotlin\n---\n`)
    const sitemap = (await import('../../src/app/sitemap')).default
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    for (const l of routing.locales) {
      // home + /notes per locale, at minimum.
      expect(urls.some((u) => u.endsWith(`/${l}`))).toBe(true)
      expect(urls.some((u) => u.endsWith(`/${l}/notes`))).toBe(true)
    }
    expect(urls.some((u) => u.endsWith('/kotlin'))).toBe(true)
  })

  it('attaches hreflang alternates per entry', async () => {
    await write('en', 'k.md', `---\ntitle: K\n---\n`)
    const sitemap = (await import('../../src/app/sitemap')).default
    const entries = await sitemap()
    const kotlin = entries.find((e) => e.url.endsWith('/k'))!
    expect(Object.keys(kotlin.alternates?.languages ?? {})).toEqual(
      expect.arrayContaining([...routing.locales]),
    )
  })

  it('filters notes with noindex: true from frontmatter', async () => {
    await write('en', 'public.md', `---\ntitle: Public\n---\n`)
    await write('en', 'secret.md', `---\ntitle: Secret\nnoindex: true\n---\n`)
    const sitemap = (await import('../../src/app/sitemap')).default
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls.some((u) => u.endsWith('/secret'))).toBe(false)
    expect(urls.some((u) => u.endsWith('/public'))).toBe(true)
  })

  it('uses note.updated when set, falling back to date, then now', async () => {
    await write(
      'en',
      'dated.md',
      `---\ntitle: Dated\ndate: 2024-01-01\nupdated: 2025-12-31\n---\n`,
    )
    const sitemap = (await import('../../src/app/sitemap')).default
    const entries = await sitemap()
    const dated = entries.find((e) => e.url.endsWith('/dated'))!
    const stamp =
      dated.lastModified instanceof Date
        ? dated.lastModified.toISOString()
        : new Date(dated.lastModified as string).toISOString()
    expect(stamp.startsWith('2025-12-31')).toBe(true)
  })
})
