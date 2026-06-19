'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@store/themeStore'

/**
 * Mounts inside the article and renders any `<div class="mermaid">` blocks
 * left by the MDX pipeline. Loads the mermaid library on first encounter,
 * derives a palette from the active site theme's CSS variables, and
 * re-renders when the theme or the article body changes.
 */
export function MermaidRenderer({
  containerSelector = 'article .prose',
}: {
  containerSelector?: string
}) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const container = document.querySelector(containerSelector)
      if (!container) return
      const blocks = container.querySelectorAll<HTMLElement>('.mermaid[data-mermaid-source]')
      if (blocks.length === 0) return

      const mermaid = (await import('mermaid')).default
      if (cancelled) return

      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: themeVariables(),
        securityLevel: 'strict',
        fontFamily: 'inherit',
      })

      for (const el of Array.from(blocks)) {
        // Clear any previously rendered SVG so re-themes don't stack.
        el.removeAttribute('data-rendered')
        const source = el.getAttribute('data-mermaid-source')
        if (!source) continue
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        try {
          const { svg } = await mermaid.render(id, source)
          if (cancelled) return
          el.innerHTML = svg
          el.setAttribute('data-rendered', '1')
        } catch (err) {
          el.innerHTML = `<pre class="mermaid-error">${escapeHtml(
            err instanceof Error ? err.message : 'Diagram error',
          )}</pre>`
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [theme, containerSelector])

  return null
}

/**
 * Read the site palette off the document root and translate it into
 * mermaid's `themeVariables`. Doing this dynamically means custom themes
 * defined in `content/theme.css` get sensible Mermaid colors for free.
 */
function themeVariables(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const cs = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback

  const bg = read('--bg', '#ffffff')
  const fg = read('--fg', '#1a1a1a')
  const primary = read('--primary', '#7c3aed')
  const primaryMuted = read('--primary-muted', '#ede9fe')
  const muted = read('--muted', '#6b7280')
  const border = read('--border', '#e5e7eb')
  const card = read('--card', '#ffffff')

  return {
    // Backgrounds
    background: bg,
    mainBkg: card,
    secondBkg: primaryMuted,
    tertiaryColor: primaryMuted,
    // Primary nodes
    primaryColor: primaryMuted,
    primaryTextColor: fg,
    primaryBorderColor: primary,
    secondaryColor: card,
    secondaryTextColor: fg,
    secondaryBorderColor: border,
    tertiaryTextColor: fg,
    tertiaryBorderColor: border,
    // Lines / arrows / labels
    lineColor: primary,
    textColor: fg,
    nodeBorder: primary,
    edgeLabelBackground: bg,
    // Notes / clusters
    noteBkgColor: primaryMuted,
    noteTextColor: fg,
    noteBorderColor: border,
    // Sequence / flow specifics
    actorBkg: card,
    actorBorder: primary,
    actorTextColor: fg,
    actorLineColor: muted,
    labelBoxBkgColor: card,
    labelBoxBorderColor: border,
    labelTextColor: fg,
    loopTextColor: fg,
    activationBorderColor: primary,
    activationBkgColor: primaryMuted,
    sequenceNumberColor: fg,
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
