---
title: Building This Site
preview: How this digital garden and portfolio was built — the architecture, the tradeoffs, and the reasoning behind key decisions.
date: 2024-05-01
parents: [Web Development, Software Design]
coverImage: /images/sample-3.svg
---

This site is built with Next.js 15, using the App Router and React Server Components. The design follows Hexagonal Architecture: a pure domain core, separated from infrastructure by port interfaces.

## The Core Challenge

A digital garden needs two things that are in tension:

1. **Rich interactivity** — multi-tab browsing, a force-directed knowledge graph, command palette, resizable panels, keyboard shortcuts
2. **Static deployability** — fast loading, CDN-friendly, no server required

React Server Components handle point 2 for content pages. Zustand handles point 1 for the interactive garden features. The clean separation means portfolio pages ship zero client JavaScript.

## Content Pipeline

Every note is a Markdown file. The processing pipeline:

1. `gray-matter` extracts frontmatter (title, date, parents, etc.)
2. `remark` parses the Markdown AST
3. `rehype-pretty-code` + Shiki highlights code blocks
4. `rehype-katex` renders math equations
5. Custom rehype plugins extract headings, links, and detect image carousels
6. `rehype-stringify` produces the final HTML string

All of this lives inside `FileSystemNoteRepository` — the one deep module that hides the entire pipeline behind three methods.

## The Upstream-Pull Design

Users clone this repository and customise it. When the template maintainers push improvements, users pull them with `git merge upstream/main`. A `.gitattributes` rule makes `content/` and `site.config.ts` always prefer the user's version on any merge, so pulling upstream never clobbers personal content.

This is simpler and more maintainable than an npm package approach, where every component customisation requires either forking the package or escaping it.
