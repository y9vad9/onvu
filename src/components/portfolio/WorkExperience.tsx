import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { WorkEntry } from '@config/site'
import { isExternalHref } from '@lib/url'
import { parseDecoratedImage } from '@lib/images/decoratedImage'

/**
 * One work-experience row. Caller decides spacing, ordering, and how many
 * to render (e.g. `entries.slice(0, 3).map(…)`).
 */
export function WorkItem({
  entry,
  viewLabel,
}: {
  entry: WorkEntry
  viewLabel: string
}) {
  const external = isExternalHref(entry.url)
  const Icon = external ? ExternalLink : ArrowRight
  const logo = parseDecoratedImage(entry.logo)
  return (
    <Link
      href={entry.url}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-card transition-all duration-300 group"
    >
      <Image
        src={logo.src}
        alt={entry.company}
        width={32}
        height={32}
        className={`rounded-md flex-shrink-0 ${logo.className}`}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium group-hover:text-primary transition-colors truncate">
          {entry.company} — {entry.role}
        </p>
        <p className="text-sm text-muted">{entry.period}</p>
      </div>
      <span className="text-sm text-muted flex items-center gap-1 flex-shrink-0">
        {viewLabel} <Icon size={14} />
      </span>
    </Link>
  )
}
