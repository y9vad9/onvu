---
title: Building This Site
preview: The architecture behind this portfolio and garden, and the reasoning behind the decisions that were not obvious.
date: 2024-05-01
updated: 2026-08-03
parents: [Web Development, Software Design]
coverImage: /images/sample-3.svg
---

This site runs on Next.js 16 with the App Router and React Server Components. The structure follows [[Deep Modules]]: a domain core with no framework imports, separated from anything that touches a disk or a network by a port interface.

## Two things in tension

A digital garden wants rich interactivity. Multi-tab browsing, a force-directed knowledge graph, a command palette, resizable panels, keyboard shortcuts.

It also wants to be a pile of files on a CDN. No server, no cold starts, nothing to keep running.

Server Components resolve most of that tension. A note's body is rendered at build time and arrives as HTML, so reading costs no JavaScript at all. The chrome around it is where the client code lives: the header, the theme provider, the palette and the panel machinery are client components, and their state sits in Zustand stores that persist to `localStorage`.

The honest version is that a portfolio page is not free either. It ships the header and the theme bootstrap like every other page. What it avoids is shipping a rendering engine to display text that was already text.

## The content pipeline

Every note is a Markdown file, and turning one into a page is a chain where the order carries most of the correctness.

`gray-matter` splits off the frontmatter. A `remark` pass then strips `%%Obsidian comments%%` before anything else can see them, because a comment that reaches the search index has been published whether or not it appears on screen. Callouts and `[[Wiki Links]]` resolve next, against a map of every note in the locale, which is why the repository reads all the frontmatter in a first pass before it processes any bodies.

Crossing to HTML, self-linked image wrappers are unwrapped before any plugin rewrites a `src`, since that check compares the anchor's `href` against the value the author typed. Video runs before images, or Sharp would try to decode an mp4. Headings are collected before the autolink plugin injects a `#` into their text.

Then KaTeX, the carousel detector, the raw-text capture that feeds search, and Shiki for syntax highlighting last.

`FileSystemNoteRepository` hides all of it behind three methods. That is the deepest module here by some distance, and the one I would point at if somebody asked what the idea in [[Deep Modules]] looks like in practice.

## Images

Referencing `./diagram.png` from a note is enough. At build time the file is resized across a ladder of widths, capped at whatever the source actually is so nothing is upscaled, encoded to WebP, and written under a content-addressed name. The `<img>` comes back with `srcset`, real intrinsic dimensions and lazy loading.

The output directory is git-ignored. Source images live with the notes, and nothing encoded ever enters the repository.

## Static or server

The same codebase builds either way. A static export writes the search index and the graph to JSON at build time and the browser reads those files; a server build computes both per request from route handlers.

Development is neither, and that turned out to matter. A dev server always has the route handlers mounted and never runs the build emitters, so it uses the live path whatever the deployment target is. Conflating "what am I deploying" with "what am I running right now" is an easy mistake to make, and the failure is quiet: every consumer catches its own failed fetch and renders nothing, so search, link previews and the graph go blank together with no error anywhere.

## Pulling from upstream

This started as a template other people fork, which makes the interesting question not "how is it built" but "what happens on the next update".

`.gitattributes` marks `content/**` and `site*.config.ts` as `merge=ours`, so a file both sides changed resolves in the fork's favour. Worth knowing that `ours` is not one of git's built-in merge drivers. It has to be registered in repository config, and without that git falls back to a normal three-way merge silently. `npm install` handles it through a `prepare` script.

It is also only a backstop. The driver arbitrates modify-versus-modify and nothing else, so a file upstream adds still arrives and one it deletes still goes. The real protection is that upstream does not write into those paths.

That beats publishing this as an npm package, where customising a component means either forking the package or working around it.
