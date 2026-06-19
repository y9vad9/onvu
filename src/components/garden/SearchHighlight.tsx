'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * When the page is opened from deep-content search (URL `?q=…`),
 * tokenize the query, wrap matching terms in the article body with
 * `<mark>`, blink them, then scroll to the first match.
 *
 * Tokenization matters: searching `deep modules` should highlight both
 * "deep" and "modules" wherever they appear, even if the rendered HTML
 * breaks the phrase across nodes (e.g. `<strong>Deep</strong> Modules`).
 */
export function SearchHighlight({ containerSelector = 'article .prose' }: { containerSelector?: string }) {
  const params = useSearchParams()
  const q = params.get('q')
  const hitParam = params.get('hit')

  useEffect(() => {
    if (!q || !q.trim()) return

    const container = document.querySelector(containerSelector)
    if (!container) return

    // When a specific hit index is requested (deep-search results), we want
    // to highlight the FULL phrase exactly — so the `hit`-th occurrence is
    // well-defined. Otherwise fall back to tokenized highlighting that's
    // useful for casual `?q=…` URLs.
    const targetHit = hitParam != null ? Number(hitParam) : -1
    const phrase = q.trim().toLowerCase()
    const tokens = targetHit >= 0
      ? [phrase]
      : Array.from(
          new Set(
            phrase
              .split(/\s+/)
              .filter((t) => t.length >= 2),
          ),
        )
    if (tokens.length === 0) return

    const marks: HTMLElement[] = []
    const replacements: Array<{ parent: Node; oldNode: Text; newNodes: Node[] }> = []

    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let parent = node.parentElement
        while (parent) {
          if (parent.tagName === 'PRE' || parent.tagName === 'CODE' || parent.tagName === 'MARK') {
            return NodeFilter.FILTER_REJECT
          }
          parent = parent.parentElement
        }
        const lower = node.nodeValue?.toLowerCase() ?? ''
        return tokens.some((t) => lower.includes(t))
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      },
    })

    let current: Node | null
    while ((current = treeWalker.nextNode())) {
      const text = current.nodeValue ?? ''
      const lower = text.toLowerCase()
      const parent = current.parentNode
      if (!parent) continue

      // Find all match ranges across all tokens; merge overlapping/adjacent.
      const ranges: Array<[number, number]> = []
      for (const token of tokens) {
        let idx = 0
        while (true) {
          const found = lower.indexOf(token, idx)
          if (found === -1) break
          ranges.push([found, found + token.length])
          idx = found + token.length
        }
      }
      if (ranges.length === 0) continue
      ranges.sort((a, b) => a[0] - b[0])
      const merged: Array<[number, number]> = [ranges[0]]
      for (let i = 1; i < ranges.length; i++) {
        const last = merged[merged.length - 1]
        const [s, e] = ranges[i]
        if (s <= last[1]) last[1] = Math.max(last[1], e)
        else merged.push([s, e])
      }

      const newNodes: Node[] = []
      let cursor = 0
      for (const [s, e] of merged) {
        if (s > cursor) newNodes.push(document.createTextNode(text.slice(cursor, s)))
        const mark = document.createElement('mark')
        mark.className = 'search-hit blink'
        mark.textContent = text.slice(s, e)
        newNodes.push(mark)
        marks.push(mark)
        cursor = e
      }
      if (cursor < text.length) newNodes.push(document.createTextNode(text.slice(cursor)))

      replacements.push({ parent, oldNode: current as Text, newNodes })
    }

    for (const { parent, oldNode, newNodes } of replacements) {
      for (const n of newNodes) parent.insertBefore(n, oldNode)
      parent.removeChild(oldNode)
    }

    const blinkTimer = setTimeout(() => {
      for (const m of marks) m.classList.remove('blink')
    }, 600)

    if (marks.length > 0) {
      // Wait for layout then scroll. RAF gives the browser a chance to flush.
      const target = targetHit >= 0 && targetHit < marks.length ? marks[targetHit] : marks[0]
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Emphasise the chosen occurrence over the others so the eye lands on it.
        target.classList.add('search-hit-active')
      })
    }

    return () => {
      clearTimeout(blinkTimer)
      for (const m of marks) {
        const text = m.textContent ?? ''
        const parent = m.parentNode
        if (parent) {
          parent.insertBefore(document.createTextNode(text), m)
          parent.removeChild(m)
        }
      }
    }
  }, [q, hitParam, containerSelector])

  return null
}
