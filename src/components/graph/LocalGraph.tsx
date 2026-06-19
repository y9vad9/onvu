'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { ForceGraph } from './ForceGraph'
import { GraphLoading } from './GraphLoading'
import type { MentionGraph } from '@core/graph/MentionGraph'
import { RouteLink } from '@components/garden/RouteLink'
import { GRAPH_TAB_SLUG } from '@store/tabStore'

export function LocalGraph({ slug }: { slug: string }) {
  const t = useTranslations('graph')
  const params = useParams<{ locale: string }>()
  const [fullGraph, setFullGraph] = useState<MentionGraph | null>(null)

  useEffect(() => {
    let aborted = false
    const url = process.env.NEXT_PUBLIC_ONVU_MODE === 'static'
      ? `/_static/${params.locale}/graph.json`
      : `/api/graph?locale=${encodeURIComponent(params.locale)}`
    fetch(url)
      .then((r) => r.json())
      .then((g: MentionGraph) => { if (!aborted) setFullGraph(g) })
      .catch(() => {})
    return () => { aborted = true }
  }, [params.locale])

  // Memoize the 1-hop subgraph so unrelated re-renders (key presses, theme
  // changes, panel state) don't rebuild the graph object and reheat the
  // physics simulation downstream.
  const localGraph: MentionGraph | null = useMemo(() => {
    if (!fullGraph) return null
    const neighbors = new Set<string>([slug])
    for (const edge of fullGraph.edges) {
      if (edge.source === slug) neighbors.add(edge.target)
      if (edge.target === slug) neighbors.add(edge.source)
    }
    return {
      nodes: fullGraph.nodes.filter((n) => neighbors.has(n.slug)),
      edges: fullGraph.edges.filter(
        (e) => neighbors.has(e.source) && neighbors.has(e.target),
      ),
    }
  }, [fullGraph, slug])

  const highlightSet = useMemo<ReadonlySet<string>>(() => new Set([slug]), [slug])

  if (!localGraph) return <GraphLoading text={t('loading')} />

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-[300px]">
        <ForceGraph graph={localGraph} highlightSlugs={highlightSet} />
      </div>
      <RouteLink
        href={`/${params.locale}/notes/graph`}
        routeSlug={GRAPH_TAB_SLUG}
        // RouteTabSync refreshes the title to the localized garden label
        // once the user lands on the page; this placeholder only matters
        // for the moment between Ctrl-click and the destination mount.
        routeTitle="Knowledge Graph"
        routeKind="graph"
        className="flex items-center justify-center gap-1 m-2 py-1.5 text-xs text-muted hover:text-primary border border-border hover:border-primary rounded transition-colors"
      >
        {t('viewFullGraph')} <ArrowRight size={11} />
      </RouteLink>
    </div>
  )
}
