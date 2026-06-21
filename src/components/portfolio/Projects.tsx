import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { ProjectEntry } from '@config/site'
import { isExternalHref } from '@lib/url'
import { PortfolioLogo } from './PortfolioLogo'

/**
 * One project row. Caller decides the container (list, grid, slice count).
 * Optionally renders a leading 32×32 logo when `entry.logo` is set —
 * mirrors the work / education shape so the three sections feel like
 * one family.
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
      {entry.logo && (
        <PortfolioLogo src={entry.logo} alt={entry.name} />
      )}
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
