'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { config as siteConfig } from '~/site.config'
import type { ThemeOption } from '@config/site'

export type Theme = string

const DEFAULT_THEMES: ThemeOption[] = [
  { id: 'light', label: 'light', icon: 'Sun' },
  { id: 'dark', label: 'dark', icon: 'Moon' },
  { id: 'warm', label: 'warm', icon: 'Coffee' },
  { id: 'forest', label: 'forest', icon: 'Trees' },
  { id: 'system', label: 'system', icon: 'Monitor' },
]

export const THEME_OPTIONS: ThemeOption[] =
  siteConfig.themes ?? DEFAULT_THEMES
export const THEMES: Theme[] = THEME_OPTIONS.map((t) => t.id)

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: siteConfig.defaultTheme,
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      cycleTheme: () => {
        const current = get().theme
        const idx = THEMES.indexOf(current)
        const cyclables = THEMES.filter((t) => t !== 'system')
        const fallbackIdx = cyclables.indexOf(current)
        const next =
          fallbackIdx === -1
            ? cyclables[0] ?? THEMES[(idx + 1) % THEMES.length]
            : cyclables[(fallbackIdx + 1) % cyclables.length]
        set({ theme: next })
        applyTheme(next)
      },
    }),
    { name: 'theme' },
  ),
)

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.className = html.className.replace(/\btheme-\S+/g, '').trim()
  html.classList.add(`theme-${theme}`)
}
