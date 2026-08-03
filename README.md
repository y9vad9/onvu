# Onvu

Onvu (On-View) is a website template that pairs a single-page developer portfolio with a digital knowledge garden. It runs on Next.js 16, TypeScript, Tailwind CSS 4 and Zustand, and it builds either as a static export for a CDN or as a Node server.

It is meant to be forked and kept in sync. Everything you are expected to edit lives in `content/` and `site.config.ts`. Everything under `src/` is the engine, and upstream keeps changing it. [Upgrading](docs/upgrading.md) explains how that boundary is enforced and where it leaks.

## What it does

The landing page is assembled in `content/landing.tsx` from small primitives: a hero, work history, projects, education and featured writing. Sections are plain JSX, so hiding one means deleting a block rather than finding a flag.

The garden is a three-panel note workspace. On the left, a file tree and a full-text search. In the middle, a tabbed note view that restores each tab's scroll position. On the right, the table of contents, series navigation, outgoing links, backlinks, and a graph of whatever note is open. Panels collapse, resize, and remember their state.

Notes are Markdown files with YAML frontmatter. `[[Wiki Links]]` resolve by title or slug, and the reverse edges become backlinks and a force-directed graph you can browse at full size. Beyond GFM you get KaTeX, Mermaid, Shiki syntax highlighting, footnotes, Obsidian callouts, image carousels, video embeds and click-to-zoom images.

Images and videos referenced from a note are processed at build time: resized across an eleven-step width ladder, encoded to WebP, content-hashed, and written to `public/notes-assets/` (which is git-ignored, so no build output ever lands in your repository).

A command palette opens on `/` or a double `Shift` tap. It fuzzy-searches notes, filters them by `parent:`, switches theme and language, and lists every garden command with its keyboard chord.

Five themes ship by default (light, dark, warm, forest, system) and you can replace the whole list. A blocking bootstrap script and a `color-scheme` meta tag mean no flash of the wrong palette on a cold load.

English, German and Ukrainian are set up out of the box. Every route is locale-prefixed, each locale gets its own RSS feed and its own note space, and configuration, navigation and interface strings can all be overridden per language. Adding or removing one is a config edit plus a folder.

SEO is handled without a plugin: canonical and hreflang links, JSON-LD for the site, person, articles, breadcrumbs and collections, an Open Graph card generated per note, a sitemap and a robots.txt with an AI crawler policy.

Optional machine-readable surfaces for AI agents (Markdown mirrors of every note, `llms.txt`, structured data extensions, WebMCP tools) are all off until you turn them on. See [Agents and AI surfaces](docs/agents.md).

## Quick start

```bash
git clone https://github.com/y9vad9/onvu.git my-site
cd my-site
git remote rename origin upstream
git remote add origin https://github.com/your-username/my-site.git
npm install
npm run dev
```

Renaming the remote matters: `upstream` is where template updates come from, and the merge driver that protects your files is armed by `npm install`. Then work through [Getting started](docs/getting-started.md), which walks the first hour: what to put in `site.config.ts`, where notes go, and what to delete.

### Scripts

| Script | What it does |
|:---|:---|
| `npm run dev` | Development server on port 3000. |
| `npm run build` | Production build for a Node server (`ONVU_MODE=server`). |
| `npm run build:static` | Static export to `out/` for a CDN (`ONVU_MODE=static`). |
| `npm start` | Serve the production build. Requires `npm run build` first. |
| `npm run lint` | ESLint over the whole repository. |
| `npm test` | Vitest unit and integration suites. |
| `npm run test:e2e` | Playwright end-to-end specs. |
| `npm run typecheck` | `tsc --noEmit`. |

## Documentation

| Guide | Covers |
|:---|:---|
| [Getting started](docs/getting-started.md) | First hour: clone, configure, write, delete the demo. |
| [Configuration](docs/configuration.md) | Every key in `site.config.ts`, per-locale overrides, environment variables. |
| [Writing notes](docs/writing-notes.md) | Frontmatter, folder layout, Markdown and Obsidian syntax, images and video. |
| [Customisation](docs/customisation.md) | The `content/` seams: landing page, footer, navigation, note slots, garden intro. |
| [Theming](docs/theming.md) | Design tokens, the five built-in palettes, adding your own. |
| [Localisation](docs/localisation.md) | Adding a language, the four-layer message merge, right-to-left support. |
| [The garden](docs/garden.md) | Panels, tabs, shortcuts, command palette, search and graph. |
| [SEO and metadata](docs/seo.md) | Canonicals, hreflang, JSON-LD, feeds, sitemap, robots, social cards. |
| [Agents and AI surfaces](docs/agents.md) | Markdown mirrors, `llms.txt`, crawler policy, content signals, WebMCP. |
| [Deployment](docs/deployment.md) | Static versus server builds, Cloudflare Pages, GitHub Pages, subpaths. |
| [Upgrading](docs/upgrading.md) | Pulling from upstream, `merge=ours`, what it does and does not protect. |
| [Architecture](docs/architecture.md) | How `src/` is laid out, the build pipeline, and how to test changes. |

## Requirements

Node 20.9 or newer, which is what both `next` and `sharp` declare. The bundled GitHub Actions workflow runs Node 26. `sharp` is a native dependency that ships prebuilt binaries for the common platforms; when `npm install` fails on a fresh clone, that is usually where.
