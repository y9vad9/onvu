import { test, expect } from '@playwright/test'

test.describe('keyboard shortcuts', () => {
  test('Ctrl/Cmd+[ toggles the left panel', async ({ page }) => {
    await page.goto('/en/notes')
    const leftPanel = page.locator('aside').first()
    const initially = await leftPanel.isVisible().catch(() => false)
    await page.keyboard.press('Control+BracketLeft')
    if (initially) {
      await expect(leftPanel).toBeHidden({ timeout: 2000 })
    } else {
      await expect(leftPanel).toBeVisible({ timeout: 2000 })
    }
  })

  test('"f" focuses the Search input in the explorer when not typing', async ({ page }) => {
    await page.goto('/en/notes')
    await page.keyboard.press('f')
    // The Search input should become focused.
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toBeFocused({ timeout: 2000 })
  })
})
