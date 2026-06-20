import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

let tmpRoot: string
let originalCwd: string

beforeEach(async () => {
  // The module reads process.cwd() at call time to derive content/ and
  // public/notes-assets/ — sandbox it under a tmp dir per test so we don't
  // pollute the repo's /public.
  originalCwd = process.cwd()
  // realpath: on macOS /var → /private/var symlink resolution; the source
  // module computes contentRoot via process.cwd() which returns the
  // resolved form, so we have to match it for the prefix check to pass.
  tmpRoot = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'onvu-video-')))
  await fs.mkdir(path.join(tmpRoot, 'content', 'notes', 'en'), { recursive: true })
  process.chdir(tmpRoot)
  // The module reads process.cwd() at load time for ASSETS_ROOT — re-import
  // it after chdir so the new tmp dir is used for the public/ output.
  vi.resetModules()
})

afterAll(async () => {
  process.chdir(originalCwd)
})

describe('isVideoRef', () => {
  it('returns true for known video extensions', async () => {
    const { isVideoRef } = await import('@lib/images/processNoteVideo')
    expect(isVideoRef('demo.mp4')).toBe(true)
    expect(isVideoRef('demo.webm')).toBe(true)
    expect(isVideoRef('demo.mov')).toBe(true)
    expect(isVideoRef('demo.m4v')).toBe(true)
    expect(isVideoRef('demo.ogg')).toBe(true)
    expect(isVideoRef('demo.ogv')).toBe(true)
  })

  it('ignores query strings and fragments', async () => {
    const { isVideoRef } = await import('@lib/images/processNoteVideo')
    expect(isVideoRef('demo.mp4?v=2')).toBe(true)
    expect(isVideoRef('demo.mp4#t=10')).toBe(true)
  })

  it('returns false for non-video extensions and empties', async () => {
    const { isVideoRef } = await import('@lib/images/processNoteVideo')
    expect(isVideoRef('demo.png')).toBe(false)
    expect(isVideoRef('demo')).toBe(false)
    expect(isVideoRef('')).toBe(false)
  })
})

describe('processNoteVideo', () => {
  it('copies a video into public/notes-assets with a content-hash name', async () => {
    const { processNoteVideo } = await import('@lib/images/processNoteVideo')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    const srcPath = path.join(noteDir, 'demo.mp4')
    await fs.writeFile(srcPath, 'FAKE_VIDEO_BYTES')

    const result = await processNoteVideo('./demo.mp4', noteDir)
    expect(result).not.toBeNull()
    expect(result!.src).toMatch(/^\/notes-assets\/demo-[a-f0-9]{10}\.mp4$/)
    expect(result!.mimeType).toBe('video/mp4')

    // File was actually written.
    const outPath = path.join(tmpRoot, 'public', result!.src)
    await expect(fs.access(outPath)).resolves.toBeUndefined()
  })

  it('returns null when the file is missing', async () => {
    const { processNoteVideo } = await import('@lib/images/processNoteVideo')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    expect(await processNoteVideo('./missing.mp4', noteDir)).toBeNull()
  })

  it('blocks path traversal outside content/', async () => {
    const { processNoteVideo } = await import('@lib/images/processNoteVideo')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    expect(await processNoteVideo('../../../etc/passwd.mp4', noteDir)).toBeNull()
  })

  it('maps extensions to MIME types', async () => {
    const { processNoteVideo } = await import('@lib/images/processNoteVideo')
    const noteDir = path.join(tmpRoot, 'content', 'notes', 'en')
    await fs.writeFile(path.join(noteDir, 'a.webm'), 'X')
    await fs.writeFile(path.join(noteDir, 'b.mov'), 'X')
    expect((await processNoteVideo('./a.webm', noteDir))!.mimeType).toBe('video/webm')
    expect((await processNoteVideo('./b.mov', noteDir))!.mimeType).toBe('video/quicktime')
  })
})
