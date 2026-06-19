'use client'

import { useEffect } from 'react'
import { usePanelStore, type ExplorerMode, type ToolsMode } from '@store/panelStore'
import { useTabStore } from '@store/tabStore'

/**
 * Keyboard shortcuts for the garden. Single-letter shortcuts (`e`, `f`, `t`,
 * `s`, `l`, `g`) only fire when the user isn't typing in a field — this
 * avoids hijacking Cmd+F (browser find-in-page) and works around macOS's
 * Option-letter character substitution, which made the original Alt+letter
 * shortcuts produce special characters instead of the expected keys.
 */
export function useKeyboardShortcuts() {
  const {
    toggleLeft,
    toggleRight,
    focusExplorer,
    focusTools,
  } = usePanelStore()
  const { tabs, activeSlug, closeTab } = useTabStore()

  useEffect(() => {
    function isTyping(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return true
      if (el.isContentEditable) return true
      return false
    }

    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.includes('Mac')
      const mod = isMac ? e.metaKey : e.ctrlKey

      // ⌘[ — toggle left panel
      if (mod && e.key === '[') {
        e.preventDefault()
        toggleLeft()
        return
      }

      // ⌘] — toggle right panel
      if (mod && e.key === ']') {
        e.preventDefault()
        toggleRight()
        return
      }

      // ⌘\ — close current tab
      if (mod && e.key === '\\') {
        e.preventDefault()
        if (activeSlug) closeTab(activeSlug)
        return
      }

      // Alt+1–9 — jump to tab N. Digits aren't subject to macOS Option
      // substitution, so this stays on Alt.
      if (e.altKey && !mod) {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= 9) {
          e.preventDefault()
          const tab = tabs[num - 1]
          if (tab) useTabStore.getState().setActiveTab(tab.slug)
          return
        }
      }

      // Single-letter section shortcuts only fire outside text input. We
      // match on `e.code` (KeyE, KeyF, …) so they work on macOS where
      // Option-letter would otherwise be applied — but here there's no
      // Option, so this is mostly belt-and-suspenders against future
      // layout differences.
      if (isTyping(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.repeat) return

      switch (e.code) {
        case 'KeyE':
          e.preventDefault()
          focusExplorer('files' as ExplorerMode)
          return
        case 'KeyF':
          e.preventDefault()
          focusExplorer('search' as ExplorerMode)
          return
        case 'KeyT':
          e.preventDefault()
          focusTools('toc' as ToolsMode)
          return
        case 'KeyS':
          e.preventDefault()
          focusTools('series' as ToolsMode)
          return
        case 'KeyL':
          e.preventDefault()
          focusTools('links' as ToolsMode)
          return
        case 'KeyG':
          e.preventDefault()
          focusTools('graph' as ToolsMode)
          return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleLeft, toggleRight, focusExplorer, focusTools, tabs, activeSlug, closeTab])
}
