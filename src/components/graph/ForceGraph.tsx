'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useThemeStore } from '@store/themeStore'
import type { MentionGraph } from '@core/graph/MentionGraph'

// react-force-graph-2d ships strict generics that fight our domain types.
// The component is fundamentally a canvas renderer with object accessors —
// loosen the typing at the boundary and keep our domain types clean.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as unknown as React.ComponentType<Record<string, unknown>>

export interface ForceGraphProps {
  graph: MentionGraph
  /**
   * Slugs to colour as matches. Pass a Set (or undefined) — the set
   * identity is irrelevant to the physics simulation, so updating it on
   * every keystroke does NOT rebuild graph data or reheat forces.
   */
  highlightSlugs?: ReadonlySet<string>
  height?: number | string
  width?: number | string
  repulsion?: number
  linkDistance?: number
  onNodeClickAction?: 'navigate' | ((slug: string) => void)
}

interface GraphNodeData {
  id: string
  name: string
  val: number
  isEpic: boolean
  x?: number
  y?: number
}

interface GraphLinkData {
  source: string | GraphNodeData
  target: string | GraphNodeData
  edgeType: 'parent' | 'link'
}

interface ForceGraphInstance {
  d3Force: (name: string, force?: unknown) => unknown
  d3ReheatSimulation: () => void
  centerAt: (x?: number, y?: number, ms?: number) => void
  zoom: (scale: number, ms?: number) => void
}

const EMPTY_SET: ReadonlySet<string> = new Set()

export function ForceGraph({
  graph,
  highlightSlugs = EMPTY_SET,
  height,
  width,
  repulsion = 120,
  linkDistance = 80,
  onNodeClickAction = 'navigate',
}: ForceGraphProps) {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const [hoverId, setHoverId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphInstance | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  // Canvas needs resolved color values — CSS variables don't apply inside a
  // canvas context. Re-resolve when the theme changes so nodes follow the
  // active palette.
  const theme = useThemeStore((s) => s.theme)
  const colors = useMemo(() => {
    if (typeof window === 'undefined') {
      return { primary: '#6366f1', muted: '#9ca3af', border: '#e5e7eb', dim: 'rgba(0,0,0,0.05)' }
    }
    const cs = getComputedStyle(document.documentElement)
    const read = (name: string, fallback: string) => {
      const v = cs.getPropertyValue(name).trim()
      return v || fallback
    }
    return {
      primary: read('--primary', '#6366f1'),
      muted: read('--muted', '#9ca3af'),
      border: read('--border', '#e5e7eb'),
      dim: read('--border', 'rgba(0,0,0,0.05)'),
    }
  }, [theme])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Memoize the graph payload so react-force-graph doesn't restart its
  // physics simulation on every hover-induced re-render. Highlights are
  // read from `highlightSlugs` via accessor at draw time — they MUST NOT
  // participate in this identity, or each keystroke reheats the layout.
  const data = useMemo(
    () => ({
      nodes: graph.nodes.map<GraphNodeData>((n) => ({
        id: n.slug,
        name: n.title,
        val: Math.max(1, n.connectionCount),
        isEpic: n.isEpic,
      })),
      links: graph.edges.map<GraphLinkData>((e) => ({
        source: e.source,
        target: e.target,
        edgeType: e.type,
      })),
    }),
    [graph],
  )

  const handleNodeClick = useCallback(
    (node: GraphNodeData) => {
      if (typeof onNodeClickAction === 'function') {
        onNodeClickAction(node.id)
      } else if (onNodeClickAction === 'navigate') {
        router.push(`/${params.locale}/notes/${node.id}`)
      }
    },
    [onNodeClickAction, router, params.locale],
  )

  // Apply repulsion (charge) and link distance to the live simulation.
  // Only reheat when the actual sliders change — NOT on every render that
  // happens to produce a new `data` reference (key presses, hover, theme).
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const charge = fg.d3Force('charge') as { strength: (n: number) => unknown } | undefined
    charge?.strength(-repulsion)
    const link = fg.d3Force('link') as { distance: (n: number) => unknown } | undefined
    link?.distance(linkDistance)
    fg.d3ReheatSimulation()
  }, [repulsion, linkDistance])

  // Zoom & center on a single match. Skipped for zero or multiple matches.
  // Keyed on the singleton slug only so a fresh data identity doesn't re-zoom.
  const singleMatch =
    highlightSlugs.size === 1 ? [...highlightSlugs][0] : undefined
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => {
    if (!singleMatch) return
    const fg = fgRef.current
    if (!fg) return
    const id = window.setTimeout(() => {
      const node = dataRef.current.nodes.find((n) => n.id === singleMatch)
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        fg.centerAt(node.x, node.y, 600)
        fg.zoom(3, 600)
      }
    }, 50)
    return () => window.clearTimeout(id)
  }, [singleMatch])

  // Asymmetric hover highlight:
  // - downstream (descendants / outgoing links) is followed transitively
  // - upstream (immediate parent / incoming link) is shown one hop only
  //
  // Edge semantics:
  //   parent: source = child, target = parent
  //   link:   source = referrer, target = referee
  // So "downstream" relative to hover = IN parent-edges + OUT link-edges,
  // and "upstream" relative to hover = OUT parent-edges + IN link-edges.
  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    const nodes = new Set<string>()
    const edgeKeys = new Set<string>()
    if (!hoverId) return { highlightedNodes: nodes, highlightedEdges: edgeKeys }

    nodes.add(hoverId)
    const stack = [hoverId]
    const visited = new Set<string>([hoverId])
    while (stack.length > 0) {
      const cur = stack.pop()!
      for (const edge of graph.edges) {
        const goesDownstream =
          (edge.type === 'parent' && edge.target === cur) ||
          (edge.type === 'link' && edge.source === cur)
        if (!goesDownstream) continue
        const next = edge.type === 'parent' ? edge.source : edge.target
        edgeKeys.add(`${edge.source}\x00${edge.target}\x00${edge.type}`)
        if (!visited.has(next)) {
          visited.add(next)
          nodes.add(next)
          stack.push(next)
        }
      }
    }
    // One-hop upstream.
    for (const edge of graph.edges) {
      const goesUpstream =
        (edge.type === 'parent' && edge.source === hoverId) ||
        (edge.type === 'link' && edge.target === hoverId)
      if (!goesUpstream) continue
      const other = edge.type === 'parent' ? edge.target : edge.source
      nodes.add(other)
      edgeKeys.add(`${edge.source}\x00${edge.target}\x00${edge.type}`)
    }
    return { highlightedNodes: nodes, highlightedEdges: edgeKeys }
  }, [hoverId, graph.edges])

  return (
    <div ref={containerRef} style={{ width: width ?? '100%', height: height ?? '100%' }}>
      {dims && (
        <ForceGraph2D
          ref={(el: unknown) => { fgRef.current = (el as ForceGraphInstance) ?? null }}
          graphData={data}
          width={dims.w}
          height={dims.h}
          backgroundColor="transparent"
          nodeLabel="name"
          nodeRelSize={3}
          nodeColor={(n: GraphNodeData) => {
            if (highlightSlugs.size > 0) {
              return highlightSlugs.has(n.id) ? colors.primary : colors.border
            }
            if (hoverId && !highlightedNodes.has(n.id)) return colors.border
            if (n.isEpic) return colors.primary
            return colors.muted
          }}
          linkColor={(l: GraphLinkData) => {
            if (!hoverId) return colors.border
            const sid = typeof l.source === 'string' ? l.source : l.source.id
            const tid = typeof l.target === 'string' ? l.target : l.target.id
            const key = `${sid}\x00${tid}\x00${l.edgeType}`
            return highlightedEdges.has(key) ? colors.primary : colors.dim
          }}
          onNodeClick={handleNodeClick}
          onNodeHover={(node: GraphNodeData | null) => setHoverId(node?.id ?? null)}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTime={3000}
          enableNodeDrag={false}
        />
      )}
    </div>
  )
}
