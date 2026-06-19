import { config as siteConfig } from '~/site.config'
import { routing } from '@i18n/routing'
import type { Note } from '@core/Note'
import { absoluteUrl, localizedPath, noteUrl, siteUrl } from './url'

type JsonLd = Record<string, unknown>

export function websiteJsonLd(locale: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.owner.name,
    url: absoluteUrl(localizedPath(locale, '/')),
    inLanguage: locale,
    description: siteConfig.owner.bio,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl(localizedPath(locale, '/notes'))}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function personJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.owner.name,
    url: siteUrl(),
    image: absoluteUrl(siteConfig.owner.profileImage),
    description: siteConfig.owner.bio,
    sameAs: siteConfig.owner.socials.map((s) => s.url),
  }
}

export function organizationJsonLd(): JsonLd | null {
  const org = siteConfig.seo?.organization
  if (!org) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: siteUrl(),
    logo: absoluteUrl(org.logo),
    sameAs: siteConfig.owner.socials.map((s) => s.url),
  }
}

export interface BreadcrumbItem {
  name: string
  href: string
}

export function breadcrumbsJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  }
}

export function articleJsonLd(note: Note, locale: string): JsonLd {
  const authorName = note.author ?? siteConfig.owner.name
  const url = noteUrl(locale, note.slug)
  const image = note.ogImage
    ? absoluteUrl(note.ogImage)
    : note.coverImage
      ? absoluteUrl(note.coverImage)
      : absoluteUrl(`${localizedPath(locale, `/notes/${note.slug}`)}/opengraph-image`)
  const orgName = siteConfig.seo?.organization?.name

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: note.title,
    description: note.description ?? note.preview,
    image: [image],
    datePublished: note.date?.toISOString(),
    dateModified: (note.updated ?? note.date)?.toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
      url: siteUrl(),
    },
    publisher: orgName
      ? {
          '@type': 'Organization',
          name: orgName,
          logo: {
            '@type': 'ImageObject',
            url: absoluteUrl(siteConfig.seo!.organization!.logo),
          },
        }
      : {
          '@type': 'Person',
          name: authorName,
        },
    keywords: note.tags.length > 0 ? note.tags.join(', ') : undefined,
    articleSection: note.parents.length > 0 ? note.parents : undefined,
    inLanguage: locale,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
  }
}

export interface NoteSummary {
  slug: string
  title: string
  date: Date | null
}

export function itemListJsonLd(
  notes: NoteSummary[],
  locale: string,
  name: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: notes.map((n, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: noteUrl(locale, n.slug),
      name: n.title,
    })),
  }
}

export function collectionPageJsonLd(
  locale: string,
  notes: NoteSummary[],
  name: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: absoluteUrl(localizedPath(locale, '/notes')),
    inLanguage: locale,
    isPartOf: { '@type': 'WebSite', url: absoluteUrl(localizedPath(locale, '/')) },
    mainEntity: itemListJsonLd(notes, locale, name),
  }
}

export const ROUTING = routing
