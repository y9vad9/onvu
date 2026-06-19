type Plain = Record<string, unknown>

function isPlainObject(value: unknown): value is Plain {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Recursively merges `override` into `base`. Plain objects are walked key
 * by key; everything else (primitives, arrays, class instances) is
 * replaced wholesale. Used for layering user i18n overrides on top of the
 * framework's default messages.
 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : (override as T))
  }
  const result: Plain = { ...base }
  for (const key of Object.keys(override)) {
    const next = override[key]
    if (key in result && isPlainObject(result[key]) && isPlainObject(next)) {
      result[key] = deepMerge(result[key], next)
    } else {
      result[key] = next
    }
  }
  return result as T
}
