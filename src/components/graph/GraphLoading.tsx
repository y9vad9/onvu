'use client'

/**
 * Centered placeholder shown while graph data is being fetched. The bar is
 * an indeterminate progress indicator — a known-length sliver loops across
 * the track to signal activity without claiming a specific percentage.
 */
export function GraphLoading({ text = 'Loading graph…' }: { text?: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6 py-10">
      <div className="w-32 h-1 bg-card-hover rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-primary rounded-full graph-loading-bar" />
      </div>
      <p className="text-xs text-muted">{text}</p>
    </div>
  )
}
