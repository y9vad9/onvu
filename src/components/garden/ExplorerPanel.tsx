'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Search, BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePanelStore } from '@store/panelStore'
import { useTabStore } from '@store/tabStore'
import { useNoteContextStore } from '@store/noteContextStore'
import { useListKeyboardNav } from '@hooks/useListKeyboardNav'
import { NoteLink } from './NoteLink'

interface OccurrenceHit {
  slug: string
  title: string
  parents: string[]
  date: string | null
  hit: number
  snippet: string
  matchStart: number
  matchLength: number
}

export interface NoteListItem {
  slug: string
  title: string
  series: string | null
  order: number | null
}

interface FileTreeEntry {
  slug: string
  displayTitle: string
  isSeries: boolean
}

function buildFileTree(notes: NoteListItem[]): FileTreeEntry[] {
  const seriesMap = new Map<string, NoteListItem[]>()
  const standalone: NoteListItem[] = []

  for (const note of notes) {
    if (note.series) {
      if (!seriesMap.has(note.series)) seriesMap.set(note.series, [])
      seriesMap.get(note.series)!.push(note)
    } else {
      standalone.push(note)
    }
  }

  const entries: FileTreeEntry[] = []
  for (const [name, notesInSeries] of Array.from(seriesMap.entries())) {
    const sorted = notesInSeries.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const first = sorted[0]
    entries.push({ slug: first.slug, displayTitle: name, isSeries: true })
  }
  for (const note of standalone) {
    entries.push({ slug: note.slug, displayTitle: note.title, isSeries: false })
  }
  return entries
}

export function ExplorerPanel({ notes }: { notes: NoteListItem[] }) {
  const t = useTranslations('explorer')
  const { explorerMode, explorerFocusNonce } = usePanelStore()
  const params = useParams<{ locale: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const currentSlug = pathname.split('/').pop() ?? ''

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OccurrenceHit[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const filterInputRef = useRef<HTMLInputElement>(null)
  const [fileFilter, setFileFilter] = useState('')

  const entries = useMemo(() => buildFileTree(notes), [notes])
  const filteredEntries = useMemo(() => {
    const q = fileFilter.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.displayTitle.toLowerCase().includes(q))
  }, [entries, fileFilter])

  // Default highlight to the currently-viewed note when it's in the list.
  const initialFilesIdx = useMemo(() => {
    const idx = filteredEntries.findIndex((e) => e.slug === currentSlug)
    return idx >= 0 ? idx : 0
    // Only recompute when the filtered list reshuffles, not on every nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEntries])

  const navigateToFile = useCallback(
    (entry: FileTreeEntry, modifier = false) => {
      const target = { slug: entry.slug, title: entry.displayTitle }
      const ctx = useNoteContextStore.getState()
      const current =
        ctx.currentSlug && ctx.currentTitle
          ? { slug: ctx.currentSlug, title: ctx.currentTitle }
          : null
      if (modifier) {
        useTabStore.getState().openInNewTab(target, current)
      } else {
        useTabStore.getState().replaceActive(target, ctx.currentSlug)
      }
      router.push(`/${params.locale}/notes/${entry.slug}`)
    },
    [router, params.locale],
  )

  const filesNav = useListKeyboardNav({
    count: filteredEntries.length,
    initialIdx: initialFilesIdx,
    resetKey: filteredEntries,
    onSelect: (idx, e) => {
      const entry = filteredEntries[idx]
      if (entry) navigateToFile(entry, e.metaKey || e.ctrlKey)
    },
  })

  const searchNav = useListKeyboardNav({
    count: searchResults.length,
    resetKey: searchResults,
    onSelect: (idx, e) => {
      const result = searchResults[idx]
      if (!result) return
      const target = { slug: result.slug, title: result.title }
      const ctx = useNoteContextStore.getState()
      const current =
        ctx.currentSlug && ctx.currentTitle
          ? { slug: ctx.currentSlug, title: ctx.currentTitle }
          : null
      if (e.metaKey || e.ctrlKey) {
        useTabStore.getState().openInNewTab(target, current)
      }
      router.push(
        `/${params.locale}/notes/${result.slug}?q=${encodeURIComponent(searchQuery)}&hit=${result.hit}`,
      )
    },
  })

  // Auto-focus when a keyboard shortcut requests it. Keyed on the nonce
  // alone so a mouse click on a mode tab doesn't yank focus into the input.
  useEffect(() => {
    if (explorerFocusNonce === 0) return
    if (explorerMode === 'files') {
      filterInputRef.current?.focus()
    } else {
      searchInputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorerFocusNonce])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&fulltext=1`)
        if (res.ok) setSearchResults(await res.json())
      } catch {
        // graceful degradation
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Forward arrow keys / Enter from the filter & search inputs to the list
  // below so the user can type a filter and immediately step through results
  // without switching focus by hand.
  function forwardListKey(e: React.KeyboardEvent, target: typeof filesNav | typeof searchNav) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Home' || e.key === 'End') {
      target.onKeyDown(e as unknown as React.KeyboardEvent<HTMLDivElement>)
    }
  }

  return (
    <div className="kbd-section flex flex-col h-full overflow-hidden">
      {explorerMode === 'files' ? (
        <div className="flex flex-col h-full">
          <div className="p-2 flex-shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={filterInputRef}
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                onKeyDown={(e) => forwardListKey(e, filesNav)}
                placeholder={t('filterByName')}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-card-hover border border-border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div
            {...filesNav.containerProps}
            className="flex-1 overflow-y-auto pb-2 focus:outline-none"
          >
            {filteredEntries.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted italic text-center">{t('noResults')}</p>
            )}
            {filteredEntries.map((entry, idx) => {
              const isCurrent = currentSlug === entry.slug
              const isKbd = filesNav.idx === idx
              return (
                <NoteLink
                  key={entry.slug}
                  slug={entry.slug}
                  title={entry.displayTitle}
                  href={`/${params.locale}/notes/${entry.slug}`}
                  ref={filesNav.setItemRef(idx)}
                  onMouseEnter={() => filesNav.setIdx(idx)}
                  className={`panel-item ${isCurrent ? 'is-active' : ''} ${isKbd ? 'is-kbd' : ''}`}
                  role="option"
                  aria-selected={isCurrent}
                >
                  <span className="truncate flex-1">{entry.displayTitle}</span>
                  {entry.isSeries && (
                    <BookOpen
                      size={11}
                      className="flex-shrink-0 text-muted opacity-50"
                      aria-label="Series"
                    />
                  )}
                </NoteLink>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => forwardListKey(e, searchNav)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-card-hover border border-border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div
            {...searchNav.containerProps}
            className="flex-1 overflow-y-auto focus:outline-none"
          >
            {searchResults.length === 0 && searchQuery && (
              <p className="px-3 py-4 text-xs text-muted italic text-center">{t('noResults')}</p>
            )}
            {searchResults.map((entry, idx) => (
              <NoteLink
                key={`${entry.slug}#${entry.hit}`}
                slug={entry.slug}
                title={entry.title}
                href={`/${params.locale}/notes/${entry.slug}?q=${encodeURIComponent(searchQuery)}&hit=${entry.hit}`}
                ref={searchNav.setItemRef(idx)}
                onMouseEnter={() => searchNav.setIdx(idx)}
                className={`panel-item-block ${idx === searchNav.idx ? 'is-active' : ''}`}
                role="option"
              >
                <p className="text-sm font-medium truncate">{entry.title}</p>
                <p className="text-xs text-muted line-clamp-2 mt-0.5">
                  {entry.snippet.slice(0, entry.matchStart)}
                  <mark className="bg-primary-muted text-primary px-0.5 rounded-sm">
                    {entry.snippet.slice(entry.matchStart, entry.matchStart + entry.matchLength)}
                  </mark>
                  {entry.snippet.slice(entry.matchStart + entry.matchLength)}
                </p>
                {entry.parents.length > 0 && (
                  <p className="text-[10px] text-primary mt-0.5 truncate">
                    {entry.parents.join(' · ')}
                  </p>
                )}
              </NoteLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
