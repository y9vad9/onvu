'use client'

import { create } from 'zustand'

interface SearchStore {
  isOpen: boolean
  query: string
  open: (initialQuery?: string) => void
  close: () => void
  setQuery: (q: string) => void
}

export const useSearchStore = create<SearchStore>()((set) => ({
  isOpen: false,
  query: '',
  open: (initialQuery = '') => set({ isOpen: true, query: initialQuery }),
  close: () => set({ isOpen: false, query: '' }),
  setQuery: (query) => set({ query }),
}))
