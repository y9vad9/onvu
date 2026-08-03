import { describe, it, expect } from 'vitest'
import {
  writeFenced,
  composeFencedFile,
  hasFencedBlock,
  stripFencedBlock,
  type Fence,
  type FencedFileIo,
} from '@lib/hosting/fencedBlock'

/**
 * `_headers` and `_redirects` are files sites own, so the generated region is
 * fenced and replaced in place rather than the file being overwritten. These
 * pin the ways that went wrong in practice.
 */
const FENCE: Fence = {
  begin: '# --- onvu:agents begin (generated, do not edit) ---',
  end: '# --- onvu:agents end ---',
}

const SITE_RULES = [
  '/*',
  '  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
  "  Content-Security-Policy: default-src 'self'",
].join('\n')

/** An in-memory filesystem, so nothing here needs a temp directory. */
function memoryIo(seed: Record<string, string> = {}) {
  const files = new Map(Object.entries(seed))
  const io: FencedFileIo = {
    read: async (p) => files.get(p) ?? null,
    write: async (p, content) => {
      files.set(p, content)
    },
  }
  return { io, files }
}

const TARGET = '/public/_headers'
const SNAPSHOT = '/public/.onvu-headers-base'

async function run(files: ReturnType<typeof memoryIo>, block: string) {
  await writeFenced({ target: TARGET, snapshot: SNAPSHOT, fence: FENCE, block, io: files.io })
  return files.files.get(TARGET)!
}

describe('fence matching', () => {
  it('escapes the markers, since "(generated…)" is otherwise a capture group', () => {
    // The original bug: the fence never matched, so each build appended
    // another block instead of replacing the previous one.
    const out = composeFencedFile(SITE_RULES, FENCE, 'X')
    expect(hasFencedBlock(out, FENCE)).toBe(true)
  })

  it('leaves a file with no block of ours alone', () => {
    expect(hasFencedBlock(SITE_RULES, FENCE)).toBe(false)
    expect(stripFencedBlock(SITE_RULES, FENCE)).toBe(SITE_RULES)
  })

  it('reports a fresh regex each call rather than a stateful global one', () => {
    // A shared `/g` regex carries `lastIndex` between calls, so the second
    // question about the same string answers false.
    const out = composeFencedFile(SITE_RULES, FENCE, 'X')
    expect(hasFencedBlock(out, FENCE)).toBe(true)
    expect(hasFencedBlock(out, FENCE)).toBe(true)
  })
})

describe('writeFenced', () => {
  it('writes just the block when the site has no file of its own', async () => {
    const files = memoryIo()
    const out = await run(files, '/  /en/  302')
    expect(out.startsWith(FENCE.begin)).toBe(true)
    expect(out).toContain('/  /en/  302')
  })

  it('never destroys the site\'s own rules', async () => {
    const files = memoryIo({ [TARGET]: SITE_RULES })
    const out = await run(files, 'generated')
    expect(out).toContain('Strict-Transport-Security')
    expect(out).toContain("Content-Security-Policy: default-src 'self'")
  })

  it('puts the generated block last, so first-match-wins leaves the site in charge', async () => {
    // Load-bearing for `_redirects` specifically: both Cloudflare Pages and
    // Netlify run the first matching rule, so an adopter's own `/` redirect has
    // to sit above ours to win.
    const files = memoryIo({ [TARGET]: SITE_RULES })
    const out = await run(files, '/  /en/  302')
    expect(out.indexOf(SITE_RULES)).toBeLessThan(out.indexOf(FENCE.begin))
  })

  it('is idempotent across repeated builds', async () => {
    const files = memoryIo({ [TARGET]: SITE_RULES })
    for (let i = 0; i < 5; i++) await run(files, 'generated')
    const out = files.files.get(TARGET)!
    expect(out.split(FENCE.begin)).toHaveLength(2)
    expect(out).toContain('Strict-Transport-Security')
  })

  it('replaces a stale block rather than stacking a new one beside it', async () => {
    const files = memoryIo({ [TARGET]: SITE_RULES })
    await run(files, '/  /en/  302')
    const out = await run(files, '/  /uk/  302')
    expect(out).toContain('/  /uk/  302')
    expect(out).not.toContain('/  /en/  302')
  })

  it('snapshots the site\'s content the first time and reads it back after', async () => {
    const files = memoryIo({ [TARGET]: SITE_RULES })
    await run(files, 'generated')
    expect(files.files.get(SNAPSHOT)).toBe(SITE_RULES)

    // The snapshot is what survives a hand-edit inside our own block.
    files.files.set(TARGET, `${files.files.get(TARGET)!}\n# somebody appended this`)
    const out = await run(files, 'generated')
    expect(out).toContain('Strict-Transport-Security')
  })

  it('produces identical output from concurrent writers', async () => {
    // Page generation runs across worker processes. Read-then-append let two of
    // them both observe a fence-free file and each add a block; rebuilding from
    // the snapshot makes duplication unrepresentable instead.
    const files = memoryIo({ [TARGET]: SITE_RULES })
    await Promise.all([
      run(files, 'generated'),
      run(files, 'generated'),
      run(files, 'generated'),
    ])
    const out = files.files.get(TARGET)!
    expect(out.split(FENCE.begin)).toHaveLength(2)
  })
})
