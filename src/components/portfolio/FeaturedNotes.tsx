import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { Note } from '@core/Note'

/**
 * One large note card — used on the landing page to feature hand-picked
 * notes. The container (grid/list, columns, ordering) is up to the caller.
 */
export function NoteCardLarge({
  note,
  locale,
  viewLabel,
}: {
  note: Note
  locale: string
  viewLabel: string
}) {
  return (
    <Link
      href={`/${locale}/notes/${note.slug}`}
      className="group flex flex-col rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300 overflow-hidden"
    >
      {note.coverImage && (
        <div className="overflow-hidden h-40">
          <Image
            src={note.coverImage}
            alt={note.title}
            width={400}
            height={160}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-3 text-xs text-muted">
          {note.date && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {format(note.date, 'MMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {note.readingTimeMinutes} min
          </span>
        </div>
        <h3 className="font-semibold group-hover:text-primary transition-colors leading-snug">
          {note.title}
        </h3>
        <p className="text-sm text-muted line-clamp-2 flex-1">{note.preview}</p>
        <span className="text-sm text-muted flex items-center gap-1 mt-2 group-hover:text-primary transition-colors">
          {viewLabel} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  )
}
