import { describe, it, expect } from 'vitest'
import { processMarkdown } from '@lib/mdx/pipeline'

describe('processMarkdown', () => {
  describe('headings', () => {
    it('extracts h1–h4 headings with auto-generated slug IDs', async () => {
      const result = await processMarkdown(`# First\n## Second\n### Third\n#### Fourth`)
      expect(result.headings).toEqual([
        { id: 'first', depth: 1, text: 'First' },
        { id: 'second', depth: 2, text: 'Second' },
        { id: 'third', depth: 3, text: 'Third' },
        { id: 'fourth', depth: 4, text: 'Fourth' },
      ])
    })

    it('does not extract h5/h6 headings', async () => {
      const result = await processMarkdown(`##### Five\n###### Six`)
      expect(result.headings).toEqual([])
    })

    it('handles headings with special characters in text', async () => {
      const result = await processMarkdown(`# A & B\n## Hello World!`)
      expect(result.headings[0].text).toBe('A & B')
      expect(result.headings[1].text).toBe('Hello World!')
    })

    it('renders heading IDs in the HTML', async () => {
      const result = await processMarkdown(`# My Section`)
      expect(result.html).toContain('id="my-section"')
    })
  })

  describe('outgoing links', () => {
    it('extracts internal note links from /notes/ URLs', async () => {
      const result = await processMarkdown(`See [this](/notes/foo) and [that](/notes/bar).`)
      expect(result.outgoingLinks).toEqual(['foo', 'bar'])
    })

    it('extracts links from locale-prefixed URLs', async () => {
      const result = await processMarkdown(`See [this](/en/notes/foo).`)
      expect(result.outgoingLinks).toEqual(['foo'])
    })

    it('deduplicates repeated links', async () => {
      const result = await processMarkdown(
        `See [foo](/notes/foo) and again [foo](/notes/foo).`,
      )
      expect(result.outgoingLinks).toEqual(['foo'])
    })

    it('extracts links from relative .md references', async () => {
      const result = await processMarkdown(`See [this](./foo.md).`)
      expect(result.outgoingLinks).toEqual(['foo'])
    })

    it('ignores external links', async () => {
      const result = await processMarkdown(`See [this](https://example.com/notes/foo).`)
      expect(result.outgoingLinks).toEqual([])
    })
  })

  describe('image carousel', () => {
    it('transforms image-only tables into carousel divs', async () => {
      const md = `
| Col1 | Col2 |
|------|------|
| ![a](/a.jpg) | ![b](/b.jpg) |
`
      const result = await processMarkdown(md)
      expect(result.html).toContain('class="carousel"')
      expect(result.html).not.toContain('<table>')
    })

    it('preserves tables that contain text', async () => {
      const md = `
| Header | Value |
|--------|-------|
| Foo    | Bar   |
`
      const result = await processMarkdown(md)
      expect(result.html).toContain('<table>')
      expect(result.html).not.toContain('class="carousel"')
    })
  })

  describe('rawText extraction', () => {
    it('strips markdown formatting characters', async () => {
      const result = await processMarkdown(`**bold** _italic_ ~~strike~~ regular text`)
      expect(result.rawText).not.toContain('**')
      expect(result.rawText).not.toContain('_')
      expect(result.rawText).toContain('bold')
      expect(result.rawText).toContain('italic')
      expect(result.rawText).toContain('regular text')
    })

    it('includes heading text', async () => {
      const result = await processMarkdown(`# My Title\n\nBody content here.`)
      expect(result.rawText).toContain('My Title')
      expect(result.rawText).toContain('Body content here')
    })

    it('collapses whitespace', async () => {
      const result = await processMarkdown(`Line 1\n\n\nLine 2\n\n\n\nLine 3`)
      expect(result.rawText).not.toMatch(/\s{2,}/)
    })

    it('strips link syntax but keeps link text', async () => {
      const result = await processMarkdown(`Visit [our site](https://example.com) please.`)
      expect(result.rawText).toContain('our site')
      expect(result.rawText).not.toContain('https://')
    })
  })

  describe('full pipeline', () => {
    it('produces valid HTML output', async () => {
      const result = await processMarkdown(`# Hello\n\nThis is a **paragraph**.`)
      expect(result.html).toContain('<h1')
      expect(result.html).toContain('Hello')
      expect(result.html).toContain('<strong>paragraph</strong>')
    })

    it('handles empty input gracefully', async () => {
      const result = await processMarkdown('')
      expect(result.html).toBe('')
      expect(result.headings).toEqual([])
      expect(result.outgoingLinks).toEqual([])
      expect(result.rawText).toBe('')
    })

    it('renders inline code', async () => {
      const result = await processMarkdown(`Use \`const x = 1\` here.`)
      expect(result.html).toContain('<code>const x = 1</code>')
    })
  })
})
