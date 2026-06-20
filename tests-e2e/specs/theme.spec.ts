import { test, expect } from '@playwright/test'

test('clicking the theme button cycles the theme on <html>', async ({ page }) => {
  await page.goto('/en')
  const html = page.locator('html')
  const before = await html.getAttribute('class')
  await page.getByRole('button', { name: /theme/i }).first().click().catch(() => {})
  // Wait briefly for the class swap.
  await page.waitForTimeout(100)
  const after = await html.getAttribute('class')
  expect(after).not.toBe(before)
})
