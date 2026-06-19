'use client'

import { useEffect } from 'react'

export function useReadingProgress() {
  useEffect(() => {
    const bar = document.getElementById('reading-progress')
    if (!bar) return

    function update() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      bar!.style.width = `${pct}%`
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])
}
