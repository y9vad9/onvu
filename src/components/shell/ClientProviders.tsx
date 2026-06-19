'use client'

import { Suspense } from 'react'
import { CommandPalette } from '@components/search/CommandPalette'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense>
        <CommandPalette />
      </Suspense>
    </>
  )
}
