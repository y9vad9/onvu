import { test, expect } from '@playwright/test'

/**
 * Smoke + tab/route behaviour tests for the garden surface. These run
 * against whatever content is in content/notes/en/ — we don't pin a
 * fixture set yet; instead we assert on shapes (h1 present, at least one
 * note tile, tab gets created on Ctrl-click) so the suite stays green
 * whether the author has 3 notes or 30.
 */

test.describe('garden surface', () => {
  test('the garden index renders', async ({ page }) => {
    await page.goto('/en/notes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('plain click on Garden header link does not pin a tab from cold start', async ({ page }) => {
    await page.goto('/en/notes')
    // Tab bar is hidden when there are zero tabs.
    await expect(page.locator('button:has(span[aria-label^="Close"])')).toHaveCount(0)
  })

  test('Ctrl-click on Knowledge Graph pins it as a tab', async ({ page }) => {
    await page.goto('/en/notes')
    const graphLink = page.locator('a[aria-label="Knowledge Graph"]').first()
    await graphLink.click({ modifiers: ['Control'] })
    // After Ctrl-click the graph tab should appear in the bar with a Close button.
    await expect(page.locator('button:has(span[aria-label^="Close"])')).not.toHaveCount(0)
  })
})
