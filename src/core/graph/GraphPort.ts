import type { MentionGraph } from '@core/graph/MentionGraph'

export interface GraphPort {
  getFullGraph(): Promise<MentionGraph>
  getLocalGraph(slug: string, depth?: number): Promise<MentionGraph>
}
