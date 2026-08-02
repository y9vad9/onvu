'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Network, Shuffle, Rss, Check, ArrowUpRight } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useTranslations } from 'next-intl'
import { RouteLink } from './RouteLink'
import { GRAPH_TAB_SLUG } from '@store/tabStore'
import type { GardenAction } from '@config/site'

/**
 * One shape for every action, whether it renders as a link, a route-aware
 * link or a button — three elements that must not read as three different
 * affordances.
 */
const CARD =
  'group flex items-center gap-2.5 p-4 rounded-xl border border-border ' +
  'hover:border-primary hover:bg-card transition-all duration-300 ' +
  'text-left w-full cursor-pointer'

const ICON = 'text-primary flex-shrink-0'

/** A path with a scheme goes out; a bare one stays in the app. */
function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')
}

export function GardenActions({
  actions,
  locale,
  randomSlugs,
}: {
  actions: readonly GardenAction[]
  locale: string
  /** Candidates for the random pick, already filtered by the caller. */
  randomSlugs: string[]
}) {
  const t = useTranslations('garden')
  const tNote = useTranslations('note')
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function pickRandom() {
    if (randomSlugs.length === 0) return
    // Chosen on click, never during render: randomising while rendering
    // hands the server one slug and the client another, and React tears the
    // tree down over the mismatch.
    const pick = randomSlugs[Math.floor(Math.random() * randomSlugs.length)]
    router.push(`/${locale}/notes/${pick}`)
  }

  async function copyFeed() {
    const url = `${window.location.origin}/${locale}/feed.xml`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be denied (insecure origin, permissions). Falling back
      // to opening the feed would be worse than doing nothing: browsers no
      // longer render XML feeds — Firefox downloads the file — which is the
      // whole reason this copies instead of navigating.
    }
  }

  const rendered = actions.map((action, i) => {
    if (typeof action !== 'string') {
      const external = isExternal(action.href)
      const href = external ? action.href : `/${locale}/${action.href.replace(/^\/+/, '')}`
      const body = (
        <>
          {action.icon ? (
            <DynamicIcon name={action.icon} size={16} className={ICON} />
          ) : (
            <ArrowUpRight size={16} className={ICON} />
          )}
          <span className="font-medium text-sm">{action.label}</span>
        </>
      )
      return external ? (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={CARD}>
          {body}
        </a>
      ) : (
        <Link key={i} href={href} className={CARD}>
          {body}
        </Link>
      )
    }

    switch (action) {
      case 'graph':
        return (
          <RouteLink
            key={action}
            href={`/${locale}/notes/graph`}
            routeSlug={GRAPH_TAB_SLUG}
            routeTitle={t('knowledgeGraph')}
            routeKind="graph"
            className={CARD}
          >
            <Network size={16} className={ICON} />
            <span className="font-medium text-sm">{t('knowledgeGraph')}</span>
          </RouteLink>
        )
      case 'random':
        // Nothing to pick from on a site with no eligible notes.
        if (randomSlugs.length === 0) return null
        return (
          <button key={action} type="button" onClick={pickRandom} className={CARD}>
            <Shuffle size={16} className={ICON} />
            <span className="font-medium text-sm">{t('randomNote')}</span>
          </button>
        )
      case 'rss':
        return (
          <button key={action} type="button" onClick={copyFeed} className={CARD}>
            {copied ? (
              <Check size={16} className={ICON} />
            ) : (
              <Rss size={16} className={ICON} />
            )}
            <span className="font-medium text-sm">
              {copied ? tNote('copied') : t('rssFeed')}
            </span>
          </button>
        )
    }
  })

  const visible = rendered.filter(Boolean)
  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{visible}</div>
  )
}
