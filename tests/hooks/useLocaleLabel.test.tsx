import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLocaleLabel } from '@hooks/useLocaleLabel'

describe('useLocaleLabel', () => {
  it('returns the translation from messages when present', () => {
    const { result } = renderHook(() => useLocaleLabel())
    expect(result.current('en')).toBe('English')
    expect(result.current('uk')).toBe('Українська')
  })

  it('falls back to Intl.DisplayNames for unknown locales', () => {
    const { result } = renderHook(() => useLocaleLabel())
    // 'fr' isn't in our mocked messages but Intl can resolve it.
    const label = result.current('fr')
    expect(label).not.toBe('fr') // got a real display name from Intl
  })

  it('falls back to the code itself when Intl rejects it', () => {
    const { result } = renderHook(() => useLocaleLabel())
    // Intentionally bad code — Intl throws or returns undefined.
    expect(result.current('xx')).toBe('xx')
  })
})
