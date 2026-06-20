import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore, THEMES } from '@store/themeStore'

beforeEach(() => {
  useThemeStore.setState({ theme: 'light' })
})

describe('themeStore', () => {
  it('setTheme persists the chosen theme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('cycleTheme skips the "system" entry', () => {
    const cyclables = THEMES.filter((t) => t !== 'system')
    expect(cyclables.length).toBeGreaterThan(0)
    // Start at the last cyclable theme — cycling should wrap to the first.
    useThemeStore.setState({ theme: cyclables[cyclables.length - 1] })
    useThemeStore.getState().cycleTheme()
    expect(useThemeStore.getState().theme).toBe(cyclables[0])
  })

  it('cycleTheme from "system" lands on the first cyclable theme', () => {
    if (!THEMES.includes('system')) return // theme list might be customised away
    useThemeStore.setState({ theme: 'system' })
    useThemeStore.getState().cycleTheme()
    const cyclables = THEMES.filter((t) => t !== 'system')
    expect(useThemeStore.getState().theme).toBe(cyclables[0])
  })
})
