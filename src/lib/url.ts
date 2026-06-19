/**
 * Treats any href that has a scheme (`http://`, `https://`, `mailto:`, `tel:`)
 * or a protocol-relative prefix (`//`) as external. Site-relative paths
 * (`/notes`), hashes (`#section`), and bare strings are internal.
 */
export function isExternalHref(href: string): boolean {
  if (!href) return false
  if (href.startsWith('//')) return true
  return /^[a-z][a-z0-9+.-]*:/i.test(href)
}
