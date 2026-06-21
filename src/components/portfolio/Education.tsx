import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { EducationEntry } from '@config/site'
import { isExternalHref } from '@lib/url'
import { PortfolioLogo } from './PortfolioLogo'

/**
 * One education row. Caller owns the container layout. The whole card is
 * the clickable target when a `url` is set — matches the affordance of
 * `WorkItem` and `ProjectItem` so the three sections behave the same.
 * Without a URL the row renders as a plain bordered card with no hover
 * cues (nothing to navigate to).
 */
export function EducationItem({
  entry,
  viewLabel,
}: {
  entry: EducationEntry
  viewLabel: string
}) {
  const external = entry.url ? isExternalHref(entry.url) : false
  const Icon = external ? ExternalLink : ArrowRight

  const body = (
    <>
      <PortfolioLogo src={entry.logo} alt={entry.institution} />
      <div className="flex-1 min-w-0">
        <p className="font-medium group-hover:text-primary transition-colors truncate">
          {entry.institution}
        </p>
        <p className="text-sm text-muted">
          {entry.degree} • {entry.period}
        </p>
      </div>
      {entry.url && (
        <span className="text-sm text-muted flex items-center gap-1 flex-shrink-0">
          {viewLabel} <Icon size={14} />
        </span>
      )}
    </>
  )

  if (!entry.url) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
        {body}
      </div>
    )
  }

  return (
    <Link
      href={entry.url}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300 group"
    >
      {body}
    </Link>
  )
}
