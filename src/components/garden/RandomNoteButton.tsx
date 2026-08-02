'use client'

import { useRouter } from 'next/navigation'
import { Shuffle } from 'lucide-react'

/**
 * Serendipity, the one navigation move a reader can make without deciding
 * anything first.
 *
 * A button rather than a link: the site is a static export, so there is no
 * server to redirect `/notes/random` anywhere. The choice happens on click,
 * inside an event handler — never during render, which would hand the server
 * one slug and the client another and trip a hydration mismatch.
 */
export function RandomNoteButton({
  slugs,
  locale,
  label,
  className,
}: {
  /** Candidate slugs, already filtered by the caller. */
  slugs: string[]
  locale: string
  label: string
  className?: string
}) {
  const router = useRouter()

  function go() {
    if (slugs.length === 0) return
    const pick = slugs[Math.floor(Math.random() * slugs.length)]
    router.push(`/${locale}/notes/${pick}`)
  }

  return (
    <button type="button" onClick={go} className={className}>
      <Shuffle size={16} className="text-primary flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}
