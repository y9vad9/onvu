/**
 * Date formatting via the platform's own `Intl`, replacing `date-fns`.
 *
 * Only two shapes were ever used — `MMM d, yyyy` and `MMMM d, yyyy` — and
 * `Intl.DateTimeFormat` reproduces both exactly (verified across month
 * boundaries, single-digit days and a leap day). date-fns cost ~4.8 KB
 * transferred in a chunk that loaded in the initial burst, competing for
 * bandwidth with the LCP image; `Intl` is built into the runtime and costs
 * nothing to ship.
 *
 * The locale stays pinned to `en-US` because that is what the date-fns
 * default produced, so German and Ukrainian pages keep rendering the dates
 * they render today. Making dates follow the page locale would be a real
 * improvement, but it is a content change rather than a performance one.
 *
 * Formatters are constructed once at module scope — `Intl.DateTimeFormat`
 * construction is the expensive part, formatting is cheap.
 */
const SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const LONG = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

/** `Jul 31, 2026` — was `format(date, 'MMM d, yyyy')`. */
export function formatDateShort(value: Date | string | number): string {
  return SHORT.format(toDate(value))
}

/** `July 31, 2026` — was `format(date, 'MMMM d, yyyy')`. */
export function formatDateLong(value: Date | string | number): string {
  return LONG.format(toDate(value))
}
