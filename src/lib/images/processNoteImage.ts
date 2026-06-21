import path from 'node:path'
import {
  encodeResponsive,
  type ResponsiveImage,
} from './encodeResponsive'

/**
 * Entry point for image references written *inside* a note — relative paths
 * in the markdown body and (relative) frontmatter `coverImage` values.
 * Absolute site paths go through `processStaticImage`; both ultimately
 * funnel into `encodeResponsive`, so the encoded output and on-disk
 * cache are shared.
 */

export type ProcessedImage = ResponsiveImage & { alt: string | null }

function isExternalRef(url: string): boolean {
  if (!url) return true
  if (/^[a-z]+:/i.test(url)) return true // http:, https:, mailto:, data:
  if (url.startsWith('//')) return true
  if (url.startsWith('/')) return true // already an absolute site path
  return false
}

/**
 * Process one image referenced from a note's markdown. `ref` is the URL as
 * written (e.g. `./diagram.png` or `assets/screenshot.jpg`). `noteDir` is
 * the directory holding the note's `.md` file — relative refs resolve here.
 * Returns null when the ref is absolute/external (let `processStaticImage`
 * handle it) or when the file can't be found.
 */
export async function processNoteImage(
  ref: string,
  noteDir: string,
): Promise<ProcessedImage | null> {
  if (isExternalRef(ref)) return null
  const sourcePath = path.resolve(noteDir, ref)
  // Stay inside the content tree — block ../ traversal that points outside.
  const contentRoot = path.join(process.cwd(), 'content')
  if (!sourcePath.startsWith(contentRoot)) return null

  const result = await encodeResponsive(sourcePath)
  if (!result) return null
  return { ...result, alt: null }
}
