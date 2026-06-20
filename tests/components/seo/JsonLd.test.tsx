import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd } from '@components/seo/JsonLd'

describe('JsonLd', () => {
  it('renders a single ld+json script for an object', () => {
    const { container } = render(
      <JsonLd data={{ '@type': 'WebSite', name: 'Onvu' }} />,
    )
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(1)
    expect(JSON.parse(scripts[0].innerHTML)).toEqual({
      '@type': 'WebSite',
      name: 'Onvu',
    })
  })

  it('emits one script per array entry', () => {
    const { container } = render(
      <JsonLd
        data={[
          { '@type': 'Person', name: 'A' },
          { '@type': 'Organization', name: 'B' },
        ]}
      />,
    )
    expect(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(2)
  })

  it('filters out null/undefined array entries', () => {
    const { container } = render(
      <JsonLd data={[{ ok: true }, null, undefined]} />,
    )
    expect(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(1)
  })
})
