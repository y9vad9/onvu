import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { EducationEntry } from '@config/site'
import { isExternalHref } from '@lib/url'

/**
 * One education row. Caller owns the container layout.
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
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
      <Image
        src={entry.logo}
        alt={entry.institution}
        width={32}
        height={32}
        className="rounded-md flex-shrink-0"
      />
      <div className="flex-1">
        <p className="font-medium">{entry.institution}</p>
        <p className="text-sm text-muted">
          {entry.degree} • {entry.period}
        </p>
      </div>
      {entry.url && (
        <Link
          href={entry.url}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-sm text-muted flex items-center gap-1 hover:text-primary transition-colors"
        >
          {viewLabel} <Icon size={14} />
        </Link>
      )}
    </div>
  )
}
