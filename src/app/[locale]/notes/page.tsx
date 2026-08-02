import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Pin, Star, Network, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createRepository } from '@adapters/createRepositories'
import { listAllNotes, listPinnedNotes } from '@core/ListNotes'
import { getEpics } from '@core/GetCategories'
import { NoteListClient } from '@components/garden/NoteListClient'
import { NoteCard } from '@components/garden/NoteCard'
import { RouteTabSync } from '@components/garden/RouteTabSync'
import { RouteLink } from '@components/garden/RouteLink'
import { JsonLd } from '@components/seo/JsonLd'
import { INDEX_TAB_SLUG, GRAPH_TAB_SLUG } from '@store/tabStore'
import { breadcrumbsJsonLd, collectionPageJsonLd } from '@lib/seo/jsonLd'
import { baseMetadata } from '@lib/seo/metadata'
import { loadSiteConfig } from '@lib/config/loadConfig'
import { loadGardenIntro } from '@lib/content/gardenIntro'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const [t, base] = await Promise.all([
    getTranslations({ locale, namespace: 'garden' }),
    baseMetadata({ locale, path: '/notes' }),
  ])
  return {
    ...base,
    title: t('welcome'),
    description: t('welcomeDescription'),
  }
}

export default async function GardenHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, siteConfig] = await Promise.all([
    getTranslations({ locale, namespace: 'garden' }),
    loadSiteConfig(locale),
  ])
  const repo = createRepository(locale)

  const [allNotes, pinnedNotes, epics, intro] = await Promise.all([
    listAllNotes(repo),
    listPinnedNotes(repo),
    getEpics(repo),
    loadGardenIntro(locale),
  ])
  const notesForList = allNotes.map((n) => ({
    slug: n.slug,
    title: n.title,
    preview: n.preview,
    date: n.date?.toISOString() ?? null,
    coverImage: n.coverImage,
    coverImageSrcSet: n.coverImageSrcSet,
    parents: n.parents,
    series: n.series,
    order: n.order,
    isArchived: n.isArchived,
    readingTimeMinutes: n.readingTimeMinutes,
  }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <RouteTabSync slug={INDEX_TAB_SLUG} title={t('welcome')} kind="index" />
      <JsonLd
        data={[
          breadcrumbsJsonLd([
            { name: siteConfig.owner.name, href: `/${locale}` },
            { name: t('notes'), href: `/${locale}/notes` },
          ]),
          collectionPageJsonLd(
            locale,
            allNotes
              .filter((n) => !n.noindex)
              .map((n) => ({ slug: n.slug, title: n.title, date: n.date })),
            t('notes'),
          ),
        ]}
      />
      {/* The hero that used to open this page carried its only `h1`. The
          ceremony is gone but the document still needs a top-level heading:
          without it the Graph CTA's `h2` would be the highest on the page,
          leaving screen-reader users no title to orient by and the page with
          no outline. Visually hidden rather than restored — the tab already
          says where you are. */}
      <h1 className="sr-only">{t('welcome')}</h1>

      {/* The author's own opening, from `content/garden/<locale>.md`.
          Nothing renders when that file is absent — this slot briefly held
          `garden.welcomeDescription`, but a framework string standing in for
          the author's voice reads as filler, because it is. `welcomeDescription`
          is back to serving only the meta description above. */}
      {intro && (
        <div
          className="prose mb-10"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      )}

      {/* Start here — the author's own entry points, and deliberately the
          first thing on the page.
          What used to lead here was a welcome hero and three stat cards.
          Neither survived the question "what does a reader do with this?":
          nobody navigates by a total reading time, and the hero spent a
          whole screen restating that this is a garden. Pins are notes you
          can read immediately, which is what someone arriving actually
          wants — unlike the topic hubs below, they need no traversal. */}
      {pinnedNotes.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wide mb-4">
            <Pin size={12} /> {t('startHere')}
          </div>
          <div className="flex flex-col gap-2">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.slug}
                href={`/${locale}/notes/${note.slug}`}
                note={{
                  slug: note.slug,
                  title: note.title,
                  preview: note.preview,
                  date: note.date?.toISOString() ?? null,
                  coverImage: note.coverImage,
                  coverImageSrcSet: note.coverImageSrcSet,
                  isArchived: note.isArchived,
                  isSeries: !!note.series,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Topics */}
      {epics.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wide mb-4">
            <Star size={12} /> {t('epics')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {epics.slice(0, 8).map((epic) => (
              <Link
                key={epic.name}
                href={epic.slug ? `/${locale}/notes/${epic.slug}` : `/${locale}/notes?parent=${encodeURIComponent(epic.name)}`}
                className="group p-4 rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300"
              >
                {/* No icon. Every card carried the same sprout, so it
                    distinguished nothing while taking the top third of the
                    card — the name and the count are the only things here
                    that differ between topics. */}
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="font-medium text-sm">{epic.name}</p>
                  <span className="text-xs text-muted tabular-nums flex-shrink-0">
                    {epic.mentionCount}
                  </span>
                </div>
                {epic.preview && (
                  <p className="text-xs text-muted italic line-clamp-2">{epic.preview}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Graph CTA */}
      <RouteLink
        href={`/${locale}/notes/graph`}
        routeSlug={GRAPH_TAB_SLUG}
        routeTitle={t('knowledgeGraph')}
        routeKind="graph"
        // Was a centred `p-8` dashed panel with a 56px icon tile — fine as a
        // peer among other blocks, but once the hero and stats were gone it
        // became the largest thing on the page by area, for one link. Same
        // row shape as the cards above it now, so it reads as one more
        // destination rather than the page's centrepiece.
        className="group flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300"
      >
        <div className="w-9 h-9 rounded-lg bg-primary-muted flex items-center justify-center flex-shrink-0">
          <Network size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm group-hover:text-primary transition-colors">
            {t('knowledgeGraph')}
          </h2>
          <p className="text-xs text-muted line-clamp-1">{t('knowledgeGraphDescription')}</p>
        </div>
        <ArrowRight
          size={14}
          className="text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all flex-shrink-0 hidden md:inline-block"
        />
      </RouteLink>

      {/* Note list */}
      <div className="mt-12">
        <NoteListClient notes={notesForList} locale={locale} />
      </div>
    </div>
  )
}
