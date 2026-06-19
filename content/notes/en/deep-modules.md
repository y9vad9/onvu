---
title: Deep Modules
preview: Deep modules provide powerful functionality through simple interfaces — the most important idea in software design.
date: 2024-02-10
parents: [Software Design]
coverImage: /images/sample-1.svg
---

A module is **deep** when it provides a lot of functionality but exposes it through a small, simple interface.

The classic example is the Unix file I/O system. Five system calls — `open`, `read`, `write`, `close`, `lseek` — sit on top of a vast implementation that handles disk scheduling, buffering, caching, file system traversal, permissions, and more. The caller sees five simple verbs. The complexity is buried.

## The Depth Metric

Imagine the module's interface as the top edge of a rectangle, and its implementation as the body. A **deep** module has a thin top (small interface) and a tall body (complex implementation). A **shallow** module has an interface nearly as wide as its implementation — it provides little value above the raw complexity.

```
Deep:           Shallow:
┌──┐            ┌──────────────┐
│  │            │              │
│  │            └──────────────┘
│  │
│  │
└──┘
```

## Why Shallow Modules Are Dangerous

Every method or class you expose becomes part of your contract. It must be understood, tested, and maintained. A shallow module forces its callers to understand its internals anyway — the abstraction adds names without hiding knowledge.

## Applying This

When designing a module, ask: *what would the interface look like if I knew nothing about the implementation?* Then implement it so the caller never needs to look further than that interface.

The `FileSystemNoteRepository` in this site is an example: three methods (`getBySlug`, `listAll`, `listByParent`) sit above a remark/rehype pipeline that processes markdown, extracts headings, harvests links, and computes reading time. The caller never sees any of that.

## See Also

- [Software Design](/notes/software-design)
