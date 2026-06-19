export type EdgeType = 'link' | 'parent'

export interface GraphNode {
  slug: string
  title: string
  connectionCount: number
  isEpic: boolean
}

export interface GraphEdge {
  source: string
  target: string
  type: EdgeType
}

export interface MentionGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
