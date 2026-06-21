import path from 'node:path'
import {
  encodeResponsive,
  type ResponsiveImage,
} from './encodeResponsive'

/**
 * Build-time entry point for *absolute* site image paths — portfolio
 * chrome (`/images/hero.png`, `/images/logos/acme.svg`), note attachments
 * referenced absolutely (`/notes/en/attachments/foo.png`), and
 * already-encoded paths (`/notes-assets/foo-<hash>.webp`) that we just
 * want the cache to short-circuit.
 *
 * Returns `null` for anything we can't (or shouldn't) optimise: external
 * URLs, SVGs, paths outside the known buckets, or files that don't exist.
 * Callers should treat that as "use the original ref unchanged".
 *
 * Resolution buckets:
 *   /images/<rest>                  → public/images/<rest>
 *   /notes-assets/<rest>            → public/notes-assets/<rest>
 *   /notes/<locale>/attachments/<r> → content/notes/<locale>/attachments/<r>
 *
 * Trailing `?query` / `#hash` (notably `?dark-invert` from
 * `parseDecoratedImage`) is stripped before path resolution and
 * re-attached to the returned src so the suffix-driven class still
 * applies to the optimised output.
 */
export async function processStaticImage(
  sitePath: string,
): Promise<ResponsiveImage | null> {
  if (!sitePath) return null
  // External URLs (http://, https://, data:, etc.) — never touch.
  if (/^[a-z][a-z0-9+.-]*:/i.test(sitePath)) return null
  if (sitePath.startsWith('//')) return null

  // Split path from ?query / #hash.
  const tailIdx = sitePath.search(/[?#]/)
  const cleanPath = tailIdx >= 0 ? sitePath.slice(0, tailIdx) : sitePath
  const tail = tailIdx >= 0 ? sitePath.slice(tailIdx) : ''

  // SVGs are vector; the responsive WebP ladder buys nothing.
  if (/\.svg$/i.test(cleanPath)) return null
  // Has to be a site-absolute path.
  if (!cleanPath.startsWith('/')) return null

  const absPath = resolveSitePath(cleanPath)
  if (!absPath) return null

  const result = await encodeResponsive(absPath)
  if (!result) return null
  return tail
    ? { ...result, src: result.src + tail }
    : result
}

function resolveSitePath(cleanPath: string): string | null {
  const trimmed = cleanPath.replace(/^\/+/, '')
  if (trimmed.startsWith('images/')) {
    return path.join(process.cwd(), 'public', trimmed)
  }
  if (trimmed.startsWith('notes-assets/')) {
    return path.join(process.cwd(), 'public', trimmed)
  }
  // `notes/<locale>/attachments/<rest>` — the absolute site path an
  // author writes when they want to reference an attachment in
  // frontmatter without going through a relative path.
  const noteAttach = trimmed.match(
    /^notes\/([^/]+)\/attachments\/(.+)$/,
  )
  if (noteAttach) {
    return path.join(
      process.cwd(),
      'content',
      'notes',
      noteAttach[1],
      'attachments',
      noteAttach[2],
    )
  }
  return null
}
