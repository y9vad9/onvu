# Onvu

Onvu is a developer-focused, multi-locale website template that combines a structured portfolio homepage with an interconnected digital knowledge garden. Built with Next.js 15, TypeScript, Tailwind CSS, and Zustand, it provides a high-performance, responsive layout designed to serve as a customizable personal space.

## Key Features
- **Dual-Mode System**: A clean, single-page resume portfolio (work history, project list, education, featured writings) combined with a deep knowledge garden.
- **Interactive Three-Panel Garden**: A tabbed note workspace featuring a collapsible navigation/search explorer, a center note view with scroll-restored tab states, and a collapsible tools panel displaying backlinks, table of contents, series navigation, and localized graph visualization.
- **Automatic Asset Pipeline**: Relative image/video references in markdown files are captured at build time, content-hashed for cache-busting, resized to multiple responsive widths, compressed into WebP, and outputted directly to `public/notes-assets/`.
- **Global & Local Graph Views**: Interactive, force-directed knowledge graph visualizations utilizing canvas-based rendering to show note connections (2-hop neighborhood views on individual notes, and full-screen visualization globally).
- **Fuzzy Search & Command Palette**: Interactive keyboard-driven palette (`/` or double `Shift`) synchronized with browser query parameters, enabling deep search across writing content, themes, and locale switching.
- **Persistent Themes**: Seamless switching across five states (Light, Dark, Warm, Forest, and System) with zero flash of unstyled content (FOUC).
- **Multi-Locale**: English, German, and Ukrainian localizations supported out-of-the-box, generating locale-prefixed routes, localized sitemaps, metadata tags, and per-locale RSS feeds.

## Quick Start

### 1. Project Initialization
```bash
# Clone the repository
git clone https://github.com/onvu/template.git my-site
cd my-site

# Rename remotes to pull upstream updates easily
git remote rename origin upstream
git remote add origin https://github.com/your-username/my-site.git

# Install dependencies and start the development server
npm install
npm run dev
```

### 2. Available Scripts
- `npm run dev` - Start local Next.js development server.
- `npm run build` - Compile the production bundle, processing all notes and assets.
- `npm run start` - Run the production-built Next.js server locally.
- `npm run lint` - Lint the codebase.
- `npm run test` - Run Vitest unit and integration suites.
- `npm run typecheck` - Verify TypeScript compiler checks.

## Customization

To ensure your custom content is protected when fetching upstream changes, Onvu uses `.gitattributes` configured with `merge=ours`. Edits to the following files will never be overwritten by upstream merges:

| File / Directory | Purpose |
|:---|:---|
| `site.config.ts` | Global configuration (socials, work history, education, projects, SEO, locales, and nav featured items). |
| `content/landing.tsx` | Layout and composition of the portfolio home page sections. |
| `content/notes/` | Markdown files (.md) grouped under locale subfolders (e.g., `content/notes/en/`). |
| `content/assets/` | Shared static assets and media files. |
| `content/i18n/` | Localized string overrides for `en`, `de`, and `uk`. |
| `content/theme.css` | Custom theme colors and CSS variables for light, dark, warm, and forest modes. |
| `content/navigation.ts` | Custom dropdown structures and paths for the desktop and mobile menus. |

## Note Configuration (Frontmatter)

Notes are written in Markdown with YAML frontmatter. Frontmatter fields direct layout behavior, category groups, and sorting:

```markdown
---
title: "Understanding Kotlin Coroutines"
preview: "A beginner's guide to suspend functions, scopes, and context dispatchers."
date: 2024-03-01
parents: ["Kotlin", "Backend"]
series: "Kotlin Coroutines"
order: 1
archived: false
epic: true
coverImage: "./sample-colocated.png"
---
```

### Metadata Fields
- `parents`: An array of categories/tags used for filtering and search index categorization.
- `series` & `order`: Groups notes together into a sequential course or series with back/next navigation.
- `archived`: Set to `true` to flag notes as archived (displays an amber badge).
- `epic`: Set to `true` to highlight the note inside the garden dashboard's main category cards.
- `coverImage`: Relates to a co-located image (e.g., `./image.png`) or a shared path in `content/assets/`.

## Asset Processing

Notes can reference images and videos using standard Markdown/HTML relative syntax. 

At build time:
1. Primitives parse Markdown/MDX ASTs to locate local media paths.
2. Found images are read and processed using Sharp, generating responsive `webp` sizes (`480w`, `800w`, `1280w`, `1920w`).
3. Compressed assets are written with content-addressed filenames into `/public/notes-assets/`.
4. This directory (`/public/notes-assets/`) is git-ignored, meaning you never check bloated production WebP files into version control. Keep only your source images in the content folder.

## Deployments & Upstream Merges

### Deploying to Production
You can deploy Onvu to Vercel, Netlify, or any static hosting provider.
Configure the following environment variable for absolute canonical URLs in sitemaps and RSS:
```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Pulling Upstream Updates
To pull new features, bugs fixes, and engine updates from the main template:
```bash
git fetch upstream
git merge upstream/main
```
Because of the `merge=ours` policies, your customized files under `content/` and `site.config.ts` will automatically merge cleanly without risk of loss.
