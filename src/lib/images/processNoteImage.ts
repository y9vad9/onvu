import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

/**
 * Where co-located note images get materialised. Sits inside /public so they
 * served as static files in both ONVU_MODE=static and ONVU_MODE=server. The
 * filename includes a content hash so cache busting Just Works.
 */
const ASSETS_ROOT = path.join(process.cwd(), 'public', 'notes-assets')
const URL_PREFIX = '/notes-assets'

/** Widths we generate for the srcset. Sized for typical article bodies. */
const RESPONSIVE_WIDTHS = [480, 800, 1280, 1920]
/** WebP quality — visually indistinguishable from JPEG at q ≈ 80. */
const QUALITY = 78

export interface ProcessedImage {
  /** Default `src` (largest realistic width). */
  src: string
  /** Comma-separated srcset like `url-480.webp 480w, url-800.webp 800w`. */
  srcset: string
  width: number
  height: number
  alt: string | null
}

/** Result cache so we don't re-encode an image referenced by multiple notes. */
const cache = new Map<string, ProcessedImage>()

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
 * Returns null when the file can't be found, leaving the original ref in
 * place so the author can fix it.
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

  // Cache by absolute source path; modification time invalidates.
  let stat
  try {
    stat = await fs.stat(sourcePath)
  } catch {
    return null
  }
  const cacheKey = `${sourcePath}::${stat.mtimeMs}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const buffer = await fs.readFile(sourcePath)
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height) return null

  // Hash the input so the emitted filename is content-addressed.
  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 10)
  const ext = path.extname(sourcePath).toLowerCase()
  const base = path.basename(sourcePath, path.extname(sourcePath))
  const slug = `${base}-${hash}`

  await fs.mkdir(ASSETS_ROOT, { recursive: true })

  // GIFs short-circuit the webp pipeline. Sharp's `.webp({ quality })`
  // path only reads the first frame, so an animated GIF would collapse
  // to a still image — bad for inline reaction glyphs that exist
  // precisely BECAUSE they animate. Copy the source verbatim instead
  // (content-hash filename keeps caching honest) and skip the srcset
  // ladder entirely: the renderer's inline-image CSS pins the height,
  // and GIFs are typically tiny enough that responsive variants would
  // be over-engineering.
  if (ext === '.gif') {
    const outName = `${slug}.gif`
    const outPath = path.join(ASSETS_ROOT, outName)
    try {
      await fs.access(outPath)
    } catch {
      await fs.writeFile(outPath, buffer)
    }
    const result: ProcessedImage = {
      src: `${URL_PREFIX}/${outName}`,
      srcset: '',
      width: meta.width,
      height: meta.height,
      alt: null,
    }
    cache.set(cacheKey, result)
    return result
  }

  // Generate webp variants for widths ≤ source width. Always include the
  // source width as one variant so we don't upscale.
  const sourceWidth = meta.width
  const targetWidths = Array.from(
    new Set(RESPONSIVE_WIDTHS.filter((w) => w < sourceWidth).concat(sourceWidth)),
  ).sort((a, b) => a - b)

  const variants: Array<{ width: number; url: string }> = []
  for (const w of targetWidths) {
    const outName = `${slug}-${w}.webp`
    const outPath = path.join(ASSETS_ROOT, outName)
    try {
      await fs.access(outPath)
    } catch {
      // Need to encode.
      const out = await sharp(buffer)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer()
      await fs.writeFile(outPath, out)
    }
    variants.push({ width: w, url: `${URL_PREFIX}/${outName}` })
  }

  const largest = variants[variants.length - 1]
  const srcset = variants.map((v) => `${v.url} ${v.width}w`).join(', ')
  // Height of the largest variant, preserving aspect.
  const aspect = meta.height / sourceWidth
  const renderedHeight = Math.round(largest.width * aspect)

  const result: ProcessedImage = {
    src: largest.url,
    srcset,
    width: largest.width,
    height: renderedHeight,
    alt: null,
  }
  cache.set(cacheKey, result)
  return result
}
