import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  SiteConfigProvider,
  useSiteConfig,
} from '@lib/config/SiteConfigProvider'
import { config as baseConfig } from '~/site.config'

describe('SiteConfigProvider + useSiteConfig', () => {
  it('exposes the provided config to children', () => {
    const { result } = renderHook(() => useSiteConfig(), {
      wrapper: ({ children }) => (
        <SiteConfigProvider value={baseConfig}>{children}</SiteConfigProvider>
      ),
    })
    expect(result.current.owner.name).toBe(baseConfig.owner.name)
  })

  it('throws an explicit error when called outside the provider', () => {
    // RTL surfaces the hook's throw via the result.current error helper.
    // We assert against the thrown message so the misuse is obvious.
    expect(() => renderHook(() => useSiteConfig())).toThrow(
      /useSiteConfig\(\) called outside/,
    )
  })
})
