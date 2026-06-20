import { test, expect } from '@playwright/test'

test.describe('SEO endpoints', () => {
  test('serves /sitemap.xml', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/<urlset[\s>]/)
  })

  test('serves /robots.txt with a sitemap entry', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/Sitemap:\s*http/i)
    expect(body).toMatch(/Disallow:/i)
  })
})
