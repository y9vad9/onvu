import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: 'noindex, follow',
  title: 'Redirecting…',
}

export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
