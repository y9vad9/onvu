'use client'

import { useEffect } from 'react'
import { useNoteContextStore, type NoteContextValue } from '@store/noteContextStore'
import { useTabStore } from '@store/tabStore'

/**
 * Populates the note context store on mount with the current note's
 * tools-panel data (headings, series, backlinks, outgoing). Also pins the
 * tab bar's active slug to whatever note we're rendering — that keeps the
 * bar truthful regardless of how the user got here (raw wiki link in body,
 * command-palette plain Enter, browser back/forward, deep-link paste).
 * Clears the context on unmount.
 *
 * Rendered inside note pages so the right-side tools panel — which lives in
 * the shared notes layout — can read context-specific data without prop
 * drilling across the layout boundary.
 */
export function NoteContextProvider({ value }: { value: NoteContextValue }) {
  useEffect(() => {
    useNoteContextStore.getState().setContext(value)
    if (value.currentSlug) {
      useTabStore.getState().setActiveTab(value.currentSlug)
    }
    return () => {
      useNoteContextStore.getState().clearContext()
    }
  }, [value])
  return null
}
