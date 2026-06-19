'use client'

import { create } from 'zustand'
import type { Heading } from '@core/Note'
import type { Series } from '@core/Series'

export interface OutgoingLink {
  slug: string
  title: string
  isExternal: boolean
  href: string
}

export interface NoteContextValue {
  currentSlug: string | null
  currentTitle: string | null
  headings: Heading[]
  series: Series | null
  backlinks: Array<{ slug: string; title: string }>
  outgoing: OutgoingLink[]
}

interface NoteContextStore extends NoteContextValue {
  setContext: (ctx: NoteContextValue) => void
  clearContext: () => void
}

const EMPTY: NoteContextValue = {
  currentSlug: null,
  currentTitle: null,
  headings: [],
  series: null,
  backlinks: [],
  outgoing: [],
}

export const useNoteContextStore = create<NoteContextStore>()((set) => ({
  ...EMPTY,
  setContext: (ctx) => set(ctx),
  clearContext: () => set(EMPTY),
}))
