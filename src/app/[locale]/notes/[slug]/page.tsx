import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createRepository } from '@adapters/createRepositories'
import { getNote } from '@core/GetNote'
import { listAllNotes } from '@core/ListNotes'
import { getSeriesNavigation } from '@core/GetSeriesNavigation'
import { getMentions } from '@core/GetMentions'
import { getRelatedNotes } from '@core/GetRelatedNotes'
import { NoteArticle } from '@components/garden/NoteArticle'
import { NoteContextProvider } from '@components/garden/NoteContextProvider'
import { config as siteConfig } from '~/site.config'
import { routing } from '@i18n/routing'
import type { Note } from '@core/Note'
import { JsonLd } from '@components/seo/JsonLd'
import { baseMetadata } from '@lib/seo/metadata'
import { articleJsonLd, breadcrumbsJsonLd } from '@lib/seo/jsonLd'
import { fetchExternalTitle, urlLabel } from '@lib/links/fetchExternalTitle'

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []
  for (const locale of routing.locales) {
    const notes = await listAllNotes(createRepository(locale))
    for (const n of notes) params.push({ locale, slug: n.slug })
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const repo = createRepository(locale)
  const note = await getNote(repo, slug)
  if (!note) return {}

  const base = baseMetadata({ locale, path: `/notes/${slug}` })
  const description = note.description ?? note.preview
  const image = note.ogImage ?? note.coverImage ?? undefined
  const authorName = note.author ?? siteConfig.owner.name

  return {
    ...base,
    title: note.title,
    description,
    keywords: note.tags.length > 0 ? note.tags : undefined,
    authors: [{ name: authorName }],
    robots: note.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      ...base.openGraph,
      title: note.title,
      description,
      type: 'article',
      url: base.alternates?.canonical as string | undefined,
      images: image ? [{ url: image }] : base.openGraph?.images,
      publishedTime: note.date?.toISOString(),
      modifiedTime: (note.updated ?? note.date)?.toISOString(),
      authors: [authorName],
      tags: note.tags.length > 0 ? note.tags : undefined,
    },
    twitter: {
      ...base.twitter,
      title: note.title,
      description,
      images: image ? [image] : base.twitter?.images,
    },
  }
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const repo = createRepository(locale)
  const note = await getNote(repo, slug)
  if (!note) notFound()

  const [seriesNav, mentions, related, allNotes] = await Promise.all([
    getSeriesNavigation(repo, note),
    getMentions(repo, note),
    getRelatedNotes(repo, note, 2),
    repo.listAll(),
  ])

  const noteMap = new Map(allNotes.map((n) => [n.slug, n]))

  const internalOutgoing = note.outgoingLinks.map((s) => {
    const n = noteMap.get(s)
    return {
      slug: s,
      title: n?.title ?? s,
      isExternal: false as const,
      href: `/${locale}/notes/${s}`,
    }
  })

  // Resolve titles for external URLs in parallel. Each call is cached so
  // repeated builds (or popular references cited from many notes) only hit
  // the network once. A failed lookup falls back to a compact host+path
  // label so the panel never shows a raw 200-character URL.
  const externalOutgoing = await Promise.all(
    note.outgoingExternalLinks.map(async (href) => {
      const title = await fetchExternalTitle(href)
      return {
        slug: href,
        title: title ?? urlLabel(href),
        isExternal: true as const,
        href,
      }
    }),
  )

  const outgoing = [...internalOutgoing, ...externalOutgoing]

  const backlinks = mentions.linked.map((n: Note) => ({ slug: n.slug, title: n.title }))

  const toMentionItem = (n: Note) => ({
    slug: n.slug,
    title: n.title,
    preview: n.preview,
    date: n.date?.toISOString() ?? null,
  })

  const relatedSerializable = related.map((n) => ({
    slug: n.slug,
    title: n.title,
    date: n.date?.toISOString() ?? null,
    coverImage: n.coverImage,
  }))

  const seriesNavData = seriesNav
    ? {
        name: seriesNav.series.name,
        prev: seriesNav.prev ? { slug: seriesNav.prev.slug, title: seriesNav.prev.title } : null,
        next: seriesNav.next ? { slug: seriesNav.next.slug, title: seriesNav.next.title } : null,
      }
    : null

  const tGarden = await getTranslations({ locale, namespace: 'garden' })

  return (
    <>
      <JsonLd
        data={[
          breadcrumbsJsonLd([
            { name: siteConfig.owner.name, href: `/${locale}` },
            { name: tGarden('notes'), href: `/${locale}/notes` },
            { name: note.title, href: `/${locale}/notes/${slug}` },
          ]),
          articleJsonLd(note, locale),
        ]}
      />
      <NoteContextProvider
        value={{
          currentSlug: slug,
          currentTitle: note.title,
          headings: note.headings,
          series: seriesNav?.series ?? null,
          backlinks,
          outgoing,
        }}
      />
      <NoteArticle
        note={note}
        locale={locale}
        seriesNav={seriesNavData}
        relatedNotes={relatedSerializable}
        linkedMentions={mentions.linked.map(toMentionItem)}
        unlinkedMentions={mentions.unlinked.map(toMentionItem)}
        commentsConfig={siteConfig.comments}
      />
    </>
  )
}
