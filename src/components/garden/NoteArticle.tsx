import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Calendar, Clock, Archive, History } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Note } from '@core/Note'
import { Suspense } from 'react'
import { ArticleEnhancer } from './ArticleEnhancer'
import { MermaidRenderer } from './MermaidRenderer'
import { NoteLinkPreview } from './NoteLinkPreview'
import { SearchHighlight } from './SearchHighlight'
import { SeriesNavigation } from './SeriesNavigation'
import { RelatedNotes, type RelatedNote } from './RelatedNotes'
import { MentionsSection, type MentionItem } from './MentionsSection'
import { CommentsSection } from './CommentsSection'
import type { CommentsConfig } from '@config/site'

export interface NoteArticleProps {
  note: Note
  locale: string
  seriesNav: {
    name: string
    prev: { slug: string; title: string } | null
    next: { slug: string; title: string } | null
  } | null
  relatedNotes: RelatedNote[]
  linkedMentions: MentionItem[]
  unlinkedMentions: MentionItem[]
  commentsConfig?: CommentsConfig
}

export async function NoteArticle({
  note,
  locale,
  seriesNav,
  relatedNotes,
  linkedMentions,
  unlinkedMentions,
  commentsConfig,
}: NoteArticleProps) {
  const t = await getTranslations({ locale, namespace: 'note' })

  return (
    <>
      <ArticleEnhancer slug={note.slug} />
      <NoteLinkPreview />
      <MermaidRenderer />
      <Suspense>
        <SearchHighlight />
      </Suspense>
      <article className="max-w-3xl mx-auto px-6 py-8">
        {note.coverImage && (
          <div className="relative w-full aspect-video bg-bg rounded-xl overflow-hidden mb-6 border border-border">
            <Image
              src={note.coverImage}
              alt={note.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
          </div>
        )}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-3 leading-tight">{note.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
            {note.date && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {format(note.date, 'MMMM d, yyyy')}
              </span>
            )}
            {note.updated && (
              <span className="flex items-center gap-1" title={format(note.updated, 'MMMM d, yyyy')}>
                <History size={13} />
                {t('updated', { date: format(note.updated, 'MMM d, yyyy') })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {t('readingTime', { minutes: note.readingTimeMinutes })}
            </span>
            {note.isArchived && (
              <span className="flex items-center gap-1 text-amber-500">
                <Archive size={13} />
                {t('archive')}
              </span>
            )}
          </div>
          {note.parents.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-1 mt-3 text-sm text-muted">
              <span aria-hidden className="text-muted/70 mr-1">↳</span>
              {note.parents.map((parent, idx) => (
                <span key={parent} className="inline-flex items-baseline">
                  <ParentTag parent={parent} locale={locale} />
                  {idx < note.parents.length - 1 && (
                    <span aria-hidden className="text-muted/70">,</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </header>

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: note.body }}
        />

        {seriesNav && (
          <SeriesNavigation
            seriesName={seriesNav.name}
            prev={seriesNav.prev}
            next={seriesNav.next}
          />
        )}

        <MentionsSection linked={linkedMentions} unlinked={unlinkedMentions} />
        <RelatedNotes notes={relatedNotes} />

        <CommentsSection config={commentsConfig} />
      </article>
    </>
  )
}

function ParentTag({ parent, locale }: { parent: string; locale: string }) {
  const slug = parent.toLowerCase().replace(/\s+/g, '-')
  return (
    <Link
      href={`/${locale}/notes/${slug}`}
      className="text-muted hover:text-primary underline-offset-4 hover:underline transition-colors"
    >
      {parent}
    </Link>
  )
}
