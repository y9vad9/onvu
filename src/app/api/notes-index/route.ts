import { NextResponse } from 'next/server'
import { createRepository } from '@adapters/createRepositories'
import { routing } from '@i18n/routing'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const requested = url.searchParams.get('locale') ?? routing.defaultLocale
  const locale = routing.locales.includes(requested) ? requested : routing.defaultLocale
  const repo = createRepository(locale)
  const notes = await repo.listAll()
  const serialized = notes.map((n) => ({
    ...n,
    date: n.date?.toISOString() ?? null,
  }))
  return NextResponse.json(serialized, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
