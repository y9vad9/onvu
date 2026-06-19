---
title: TypeScript Tips
preview: Practical TypeScript patterns that have saved me time — discriminated unions, template literal types, and more.
date: 2024-04-10
parents: [Web Development]
---

A collection of TypeScript patterns I return to often.

## Discriminated Unions

Use a `kind` field (or any literal field) to create exhaustively checkable unions:

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius ** 2
    case 'rect':   return s.width * s.height
    // TypeScript errors if you forget a case
  }
}
```

## Branded Types

Prevent mixing up IDs from different domains:

```typescript
type UserId = string & { readonly __brand: 'UserId' }
type NoteId = string & { readonly __brand: 'NoteId' }

function makeUserId(s: string): UserId { return s as UserId }
// Now: getUserById(noteId) is a compile error
```

## `satisfies` Operator

Validate a value against a type while preserving its literal type:

```typescript
const config = {
  theme: 'dark',
  locale: 'en',
} satisfies Partial<AppConfig>

// config.theme is inferred as 'dark', not string
```

## Const Assertions

```typescript
const LOCALES = ['en', 'de', 'uk'] as const
type Locale = (typeof LOCALES)[number]  // 'en' | 'de' | 'uk'
```

Useful for deriving union types from arrays without duplicating the values.
