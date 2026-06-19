import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { ProjectEntry } from '@config/site'
import { isExternalHref } from '@lib/url'

/**
 * One project row. Caller decides the container (list, grid, slice count).
 */
export function ProjectItem({
  entry,
  viewLabel,
}: {
  entry: ProjectEntry
  viewLabel: string
}) {
  const external = isExternalHref(entry.url)
  const Icon = external ? ExternalLink : ArrowRight
  return (
    <Link
      href={entry.url}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300 group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium group-hover:text-primary transition-colors">
          {entry.name}
        </p>
        <p className="text-sm text-muted truncate">{entry.description}</p>
      </div>
      <span className="text-sm text-muted flex items-center gap-1 flex-shrink-0">
        {viewLabel} <Icon size={14} />
      </span>
    </Link>
  )
}
