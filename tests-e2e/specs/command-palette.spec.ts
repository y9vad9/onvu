import { test, expect } from '@playwright/test'

test.describe('command palette', () => {
  test('"/" opens the palette and focuses the input', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('/')
    const input = page.locator('input[placeholder]').first()
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()
  })

  test('Escape closes the palette', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('/')
    await page.locator('input[placeholder]').first().waitFor()
    await page.keyboard.press('Escape')
    await expect(page.locator('input[placeholder]').first()).toHaveCount(0)
  })

  test('selecting a navigation entry routes via the client router', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('/')
    const input = page.locator('input[placeholder]').first()
    await input.fill('Notes')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/en\/notes(\?|$)/)
  })
})
