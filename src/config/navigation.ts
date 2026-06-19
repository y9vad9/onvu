/**
 * Schema for the user-editable top navigation. The actual content lives in
 * `content/navigation.ts` so authors can change menu groups, labels, and
 * order without touching the framework code.
 *
 * Hrefs use site-relative paths (e.g. `/notes`, `#projects`). The Header
 * automatically prepends the active locale prefix. Absolute URLs
 * (`http(s)://…`) are left untouched and opened in the same tab — add
 * `external: true` to open in a new tab.
 */
export interface NavLink {
  label: string
  href: string
  external?: boolean
}

/**
 * A nav group with one or more items. If `items` has exactly one entry, the
 * group renders as a flat link (no dropdown).
 */
export interface NavGroup {
  label: string
  items: NavLink[]
}

export interface NavigationConfig {
  /** Used when no per-locale override exists for the active locale. */
  default: NavGroup[]
  /** Optional per-locale replacements (full structure, not a deep merge). */
  byLocale?: Record<string, NavGroup[]>
}
