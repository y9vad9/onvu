import type { Metadata } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_LOCALE } from '@i18n/routing'

export const metadata: Metadata = {
  robots: 'noindex, follow',
  title: 'Redirecting…',
}

export function generateStaticParams() {
  const notesDir = path.join(process.cwd(), 'content', 'notes', DEFAULT_LOCALE)
  try {
    return fs
      .readdirSync(notesDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ slug: f.replace(/\.md$/, '') }))
  } catch {
    return []
  }
}

export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
