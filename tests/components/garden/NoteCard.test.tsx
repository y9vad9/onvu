import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteCard } from '@components/garden/NoteCard'

// next/image needs a mock — its server-side ImageLoaderProps is happy in
// jsdom, but the runtime URL shape it generates depends on next.config.
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />,
}))

describe('NoteCard', () => {
  const base = {
    slug: 'kotlin',
    title: 'Kotlin',
    preview: 'JVM language',
    date: null,
    coverImage: null,
  }

  it('renders the title, preview and a link to the note', () => {
    render(<NoteCard note={base} href="/en/notes/kotlin" />)
    expect(screen.getByText('Kotlin')).toBeInTheDocument()
    expect(screen.getByText('JVM language')).toBeInTheDocument()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/en/notes/kotlin')
  })

  it('renders the cover image when provided', () => {
    render(
      <NoteCard
        note={{ ...base, coverImage: '/cover.jpg' }}
        href="/en/notes/kotlin"
      />,
    )
    const img = screen.getByAltText('Kotlin') as HTMLImageElement
    expect(img.src).toContain('/cover.jpg')
  })

  it('shows the archive badge when isArchived', () => {
    render(
      <NoteCard
        note={{ ...base, isArchived: true }}
        href="/en/notes/kotlin"
      />,
    )
    expect(screen.getByText('archive')).toBeInTheDocument()
  })

  it('shows the series badge when isSeries', () => {
    render(
      <NoteCard
        note={{ ...base, isSeries: true }}
        href="/en/notes/kotlin"
      />,
    )
    expect(screen.getByText('series')).toBeInTheDocument()
  })

  it('formats the date when provided', () => {
    render(
      <NoteCard
        note={{ ...base, date: '2026-03-15T00:00:00Z' }}
        href="/en/notes/kotlin"
      />,
    )
    // date-fns format 'MMM d, yyyy' → "Mar 15, 2026"
    expect(screen.getByText('Mar 15, 2026')).toBeInTheDocument()
  })
})
