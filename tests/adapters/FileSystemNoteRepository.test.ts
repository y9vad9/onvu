import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

let tmpRoot: string
let originalCwd: string

beforeEach(async () => {
  originalCwd = process.cwd()
  tmpRoot = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'onvu-fs-')))
  await fs.mkdir(path.join(tmpRoot, 'content', 'notes', 'en'), { recursive: true })
  process.chdir(tmpRoot)
  vi.resetModules()
})

afterAll(async () => {
  process.chdir(originalCwd)
})

async function write(file: string, body: string): Promise<void> {
  await fs.writeFile(
    path.join(tmpRoot, 'content', 'notes', 'en', file),
    body,
    'utf-8',
  )
}

describe('FileSystemNoteRepository', () => {
  it('returns an empty list when the locale folder is missing', async () => {
    const { FileSystemNoteRepository } = await import(
      '@adapters/fs/FileSystemNoteRepository'
    )
    const repo = new FileSystemNoteRepository('uk')
    expect(await repo.listAll()).toEqual([])
  })

  it('reads frontmatter and renders the body', async () => {
    await write(
      'kotlin.md',
      `---\ntitle: Kotlin\npreview: A language\n---\n\n# Heading\n\nBody text.`,
    )
    const { FileSystemNoteRepository } = await import(
      '@adapters/fs/FileSystemNoteRepository'
    )
    const repo = new FileSystemNoteRepository('en')
    const all = await repo.listAll()
    expect(all).toHaveLength(1)
    expect(all[0].slug).toBe('kotlin')
    expect(all[0].title).toBe('Kotlin')
    expect(all[0].body).toContain('Heading')
    expect(all[0].headings.map((h) => h.text)).toEqual(['Heading'])
  })

  it('resolves wiki links case-insensitively', async () => {
    await write(
      'a.md',
      `---\ntitle: Alpha\n---\nSee [[Beta]] and [[BETA]].`,
    )
    await write('b.md', `---\ntitle: Beta\n---\nbody`)
    const { FileSystemNoteRepository } = await import(
      '@adapters/fs/FileSystemNoteRepository'
    )
    const repo = new FileSystemNoteRepository('en')
    const a = await repo.getBySlug('a')
    expect(a?.body).toMatch(/data-note-slug="b"/)
  })

  it('marks unresolved wiki links as broken', async () => {
    await write('a.md', `---\ntitle: A\n---\nSee [[Ghost]].`)
    const { FileSystemNoteRepository } = await import(
      '@adapters/fs/FileSystemNoteRepository'
    )
    const repo = new FileSystemNoteRepository('en')
    const a = await repo.getBySlug('a')
    expect(a?.body).toMatch(/wikilink-broken/)
  })

  it('listByParent filters case-insensitively', async () => {
    await write('a.md', `---\ntitle: A\nparents:\n  - Engineering\n---\n`)
    await write('b.md', `---\ntitle: B\nparents:\n  - Other\n---\n`)
    const { FileSystemNoteRepository } = await import(
      '@adapters/fs/FileSystemNoteRepository'
    )
    const repo = new FileSystemNoteRepository('en')
    const result = await repo.listByParent('engineering')
    expect(result.map((n) => n.slug)).toEqual(['a'])
  })

  it('caches the result list — second listAll does not re-read', async () => {
    await write('a.md', `---\ntitle: A\n---\n`)
    const { FileSystemNoteRepository } = await import(
      '@adapters/fs/FileSystemNoteRepository'
    )
    const repo = new FileSystemNoteRepository('en')
    const first = await repo.listAll()
    await fs.unlink(path.join(tmpRoot, 'content', 'notes', 'en', 'a.md'))
    const second = await repo.listAll()
    expect(second).toEqual(first)
  })
})
