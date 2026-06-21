export interface DecoratedImage {
  /** Clean URL the browser will fetch, with marker query params stripped. */
  src: string
  /** Space-separated class names earned from markers; may be empty. */
  className: string
}

const DARK_INVERT_RE = /[?&]dark-invert(?=$|&|#)/

/**
 * Lightweight query-string marker parser for static image URLs used in
 * portfolio rows (work / projects / education logos). Authors append
 * markers like `?dark-invert` to a logo URL to opt into per-theme
 * treatment without having to maintain two separate image files:
 *
 *   logo: "/images/mit-logo.svg?dark-invert"
 *
 * The marker gets stripped before the URL is handed to the renderer (so
 * the actual file path stays valid) and the relevant utility class is
 * surfaced on the returned object so the caller can attach it to the
 * `<Image>`. Today the only marker is `dark-invert`; the shape leaves
 * room for `?dark-only`, `?light-only`, etc. without a breaking change.
 */
export function parseDecoratedImage(url: string): DecoratedImage {
  const classes: string[] = []
  let src = url

  if (DARK_INVERT_RE.test(src)) {
    classes.push('image-dark-invert')
    src = src
      .replace(DARK_INVERT_RE, '')
      // Drop a trailing `?` or `&` left dangling when the marker was the
      // only / last query parameter.
      .replace(/[?&]$/, '')
      // If the marker was the FIRST parameter, its leading `?` got
      // removed and the siblings now start with `&` — promote the first
      // `&` back to `?` so the URL stays valid.
      .replace(/^([^?]+)&/, '$1?')
  }

  return { src, className: classes.join(' ') }
}
