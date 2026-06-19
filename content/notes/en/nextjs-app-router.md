---
title: Next.js App Router Deep Dive
preview: The App Router is Next.js's new architecture based on React Server Components. Here is what changes and what stays the same.
date: 2024-04-20
parents: [Web Development]
---

The App Router is a complete rethink of how Next.js applications are structured. The central change: by default, every component in the `app/` directory is a **React Server Component** (RSC) — it renders on the server and sends only HTML to the client.

## What RSC Means in Practice

```tsx
// This runs ONLY on the server — no client JS sent
export default async function Page() {
  const data = await db.query('SELECT ...')  // direct DB access, no API needed
  return <div>{data.map(renderItem)}</div>
}
```

No `useEffect`, no loading states, no API routes just to pass data to a component. Server components can be `async` — they can `await` any data source directly.

## Client Components

When you need interactivity, you opt in:

```tsx
'use client'
import { useState } from 'react'

export function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
```

The `'use client'` directive marks the boundary. Everything below it is bundled for the browser. Everything above stays on the server.

## Caching

Next.js 15 has granular caching:
- `fetch` requests are cached by default and revalidated on demand
- `unstable_cache` for arbitrary async functions
- `revalidatePath` / `revalidateTag` for on-demand cache busting

The App Router replaces `getStaticProps` / `getServerSideProps` with this unified model.
