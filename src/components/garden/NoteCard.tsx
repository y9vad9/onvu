'use client'

import Image from 'next/image'
import { format } from 'date-fns'
import { Archive, BookOpen, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NoteLink } from './NoteLink'

export interface NoteCardData {
  slug: string
  title: string
  preview: string
  date: string | null
  coverImage: string | null
  isArchived?: boolean
  isSeries?: boolean
}

/**
 * Shared list-item card for the garden hub (recent notes) and the lower
 * `NoteListClient` grid. Keeps both visually consistent.
 */
export function NoteCard({
  note,
  href,
}: {
  note: NoteCardData
  href: string
}) {
  const tNote = useTranslations('note')
  return (
    <NoteLink
      slug={note.slug}
      title={note.title}
      href={href}
      className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300"
    >
      {note.coverImage && (
        <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-bg flex-shrink-0">
          <Image
            src={note.coverImage}
            alt={note.title}
            fill
            sizes="112px"
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {note.isArchived && (
            <span className="text-xs text-amber-500 flex items-center gap-0.5">
              <Archive size={10} /> {tNote('archive')}
            </span>
          )}
          {note.isSeries && (
            <span className="text-xs text-primary flex items-center gap-0.5">
              <BookOpen size={10} /> {tNote('series')}
            </span>
          )}
          {note.date && (
            <span className="text-xs text-muted">
              {format(new Date(note.date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">
          {note.title}
        </p>
        <p className="text-xs text-muted line-clamp-1 mt-0.5">{note.preview}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all flex-shrink-0 mt-1 hidden md:inline-block"
      />
    </NoteLink>
  )
}
