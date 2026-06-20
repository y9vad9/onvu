import type { Page, Locator } from '@playwright/test'

/**
 * Small page-object helpers so specs read like a sentence. Each helper is a
 * thin wrapper around a stable selector; if a selector changes, we update
 * it here once instead of in every spec.
 */

export function tabBar(page: Page) {
  return {
    activeTab(): Locator {
      return page.locator('button.bg-primary-muted')
    },
    allTabs(): Locator {
      return page.locator('button[onaux\\:click], button:has(span[aria-label^="Close"])')
    },
    tab(title: string): Locator {
      return page.getByRole('button', { name: new RegExp(title) })
    },
  }
}

export function palette(page: Page) {
  return {
    async open(): Promise<void> {
      await page.keyboard.press('/')
      await page.locator('input[placeholder]').first().waitFor()
    },
    input(): Locator {
      return page.locator('input[placeholder]').first()
    },
    async type(query: string): Promise<void> {
      await this.input().fill(query)
    },
  }
}

export function explorer(page: Page) {
  return {
    fileFilter(): Locator {
      return page.getByPlaceholder(/filterByName|filter by name/i)
    },
    searchInput(): Locator {
      return page.getByPlaceholder(/searchPlaceholder|search/i)
    },
  }
}
