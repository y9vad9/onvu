import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Generic section wrapper used on the landing page. Owns the vertical
 * padding, max-width, and (optional) anchor id — but nothing about what
 * goes inside. Compose with `SectionHeading` and your own item layout.
 */
export function Section({
  id,
  className = '',
  children,
}: {
  id?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`py-12 px-4 ${className}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  )
}

/**
 * Heading row for a landing-page section. Plain `<h2>` by default; pass
 * `href` to make the whole heading a link (used by sections that point to
 * another page). Pass `arrow={false}` to drop the trailing chevron.
 */
export function SectionHeading({
  children,
  href,
  arrow = true,
}: {
  children: ReactNode
  href?: string
  arrow?: boolean
}) {
  const inner = (
    <>
      {children}
      {arrow && (
        <ArrowRight
          size={20}
          className="text-muted group-hover:translate-x-1 transition-transform"
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-2xl font-bold mb-6 group hover:text-primary transition-colors"
      >
        {inner}
      </Link>
    )
  }
  return (
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 group">
      {inner}
    </h2>
  )
}
