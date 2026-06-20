import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'

let tmpRoot: string
let originalCwd: string

beforeEach(async () => {
  originalCwd = process.cwd()
  // See processNoteVideo.test.ts for the realpath rationale.
  tmpRoot = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'onvu-img-')))
  await fs.mkdir(path.join(tmpRoot, 'content', 'notes', 'en'), { recursive: true })
  process.chdir(tmpRoot)
  vi.resetModules()
})

afterAll(async () => {
  process.chdir(originalCwd)
})

async function makePng(target: string, width = 1000, height = 800): Promise<void> {
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 100, b: 0, alpha: 1 },
    },
  })
    .png()
    .toFile(target)
}

describe('processNoteImage', () => {
  it('returns null for external refs (http, data:, protocol-relative)', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    expect(await processNoteImage('https://example.com/a.png', noteDir)).toBeNull()
    expect(await processNoteImage('//cdn.example.com/a.png', noteDir)).toBeNull()
    expect(await processNoteImage('data:image/png;base64,xxx', noteDir)).toBeNull()
  })

  it('returns null for already-absolute site paths', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    expect(await processNoteImage('/img/a.png', noteDir)).toBeNull()
  })

  it('blocks path traversal outside content/', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    expect(await processNoteImage('../../../etc/hosts.png', noteDir)).toBeNull()
  })

  it('returns null when the file is missing', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    expect(await processNoteImage('./missing.png', noteDir)).toBeNull()
  })

  it('emits a webp with srcset and metadata for a local png', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    const srcPath = path.join(noteDir, 'diagram.png')
    await makePng(srcPath, 1280, 720)

    const result = await processNoteImage('./diagram.png', noteDir)
    expect(result).not.toBeNull()
    expect(result!.src).toMatch(/^\/notes-assets\/.+\.webp$/)
    expect(result!.srcset).toMatch(/480w/)
    expect(result!.width).toBe(1280)
    expect(result!.height).toBe(720)
  }, 15000)

  it('does not upscale — srcset only includes widths ≤ source width', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    const srcPath = path.join(noteDir, 'small.png')
    await makePng(srcPath, 600, 400)

    const result = await processNoteImage('./small.png', noteDir)
    // 600px source: 480 stays, 800/1280/1920 must not appear.
    expect(result!.srcset).toMatch(/480w/)
    expect(result!.srcset).not.toMatch(/800w/)
    expect(result!.srcset).not.toMatch(/1280w/)
  }, 15000)

  it('copies GIFs verbatim so animation survives (no webp re-encode)', async () => {
    const { processNoteImage } = await import('@lib/images/processNoteImage')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    const srcPath = path.join(noteDir, 'react.gif')
    // Build a tiny animated GIF with two distinct frames so a single-frame
    // webp output would have a different size — proves we're not running
    // it through the lossy webp encoder.
    const animated = await sharp({
      create: { width: 16, height: 16, channels: 4, background: '#000' },
    })
      .gif({ loop: 0 })
      .toBuffer()
    await fs.writeFile(srcPath, animated)

    const result = await processNoteImage('./react.gif', noteDir)
    expect(result).not.toBeNull()
    expect(result!.src).toMatch(/\.gif$/)
    // No responsive srcset for the GIF branch.
    expect(result!.srcset).toBe('')
    // File was copied byte-for-byte under public/.
    const publicPath = path.join(tmpRoot, 'public', result!.src)
    const written = await fs.readFile(publicPath)
    expect(written.equals(animated)).toBe(true)
  }, 15000)
})
