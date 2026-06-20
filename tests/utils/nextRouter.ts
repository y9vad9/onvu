import { vi } from 'vitest'

interface RouterMock {
  push: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  back: ReturnType<typeof vi.fn>
  forward: ReturnType<typeof vi.fn>
  prefetch: ReturnType<typeof vi.fn>
}

interface RouterState {
  params: Record<string, string>
  pathname: string
  searchParams: URLSearchParams
}

/**
 * Reach into the next/navigation mock from tests/setup.ts so tests can
 * spy on router.push / read assertions without re-mocking the module per
 * file. Keeping the mock in setup is the only way component trees can
 * import `useRouter` without a global wrap.
 */
export async function getRouterMock(): Promise<{
  router: RouterMock
  state: RouterState
}> {
  const mod = (await import('next/navigation')) as unknown as {
    __router: RouterMock
    __state: RouterState
  }
  return { router: mod.__router, state: mod.__state }
}

export async function setRouterState(patch: Partial<RouterState>): Promise<void> {
  const { state } = await getRouterMock()
  Object.assign(state, patch)
}
