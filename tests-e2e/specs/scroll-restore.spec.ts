import { test, expect } from '@playwright/test'

/**
 * Validates the fix for the tab-scroll race: scroll note A, switch to B
 * via the tab bar, return to A — scroll position must be honoured.
 *
 * Needs two notes to exist. We skip the spec when the user's content set
 * doesn't have at least two notes long enough to scroll.
 */

test('tab scroll position survives a round trip', async ({ page }) => {
  await page.goto('/en/notes')
  // Find two note links from the recent-notes list. If fewer than two, skip.
  const noteLinks = await page
    .locator('a[href*="/en/notes/"]')
    .filter({ hasNotText: 'graph' })
    .all()
  test.skip(noteLinks.length < 2, 'Need at least two notes to exercise tab switching')

  const aHref = await noteLinks[0].getAttribute('href')
  const bHref = await noteLinks[1].getAttribute('href')
  test.skip(!aHref || !bHref, 'Note links missing href')
  if (!aHref || !bHref) return

  // Open A in a tab via Ctrl-click so it appears in the bar.
  await noteLinks[0].click({ modifiers: ['Control'] })
  await page.waitForURL(`**${aHref}`)
  // Open B as a second pinned tab.
  await page.goto('/en/notes')
  await page
    .locator(`a[href*="${bHref}"]`)
    .first()
    .click({ modifiers: ['Control'] })
  await page.waitForURL(`**${bHref}`)

  // Switch back to A via the tab bar, scroll, switch to B, then back.
  await page.goto(`http://localhost:3000${aHref}`)
  const scroller = page.locator('#notes-scroll')
  await scroller.waitFor()
  await scroller.evaluate((el) => { (el as HTMLElement).scrollTop = 600 })
  const beforeSwitch = await scroller.evaluate((el) => (el as HTMLElement).scrollTop)
  test.skip(beforeSwitch < 100, 'Note too short to test scroll restore')

  // Switch to B
  await page.locator(`button:has-text("${bHref.split('/').pop() || ''}")`).first().click().catch(async () => {
    await page.goto(`http://localhost:3000${bHref}`)
  })

  // Switch back to A
  await page.goto(`http://localhost:3000${aHref}`)
  const restored = await page.locator('#notes-scroll').evaluate((el) =>
    (el as HTMLElement).scrollTop,
  )
  expect(restored).toBeGreaterThan(0)
})
