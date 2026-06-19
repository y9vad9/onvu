'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    html.className = html.className.replace(/\btheme-\S+/g, '').trim()
    html.classList.add(`theme-${theme}`)
  }, [theme])

  return <>{children}</>
}
