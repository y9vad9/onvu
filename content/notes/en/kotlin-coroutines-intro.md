---
title: Introduction to Kotlin Coroutines
preview: Coroutines are Kotlin's approach to asynchronous programming — lightweight, composable, and cancellable.
date: 2024-03-01
parents: [Kotlin]
series: Kotlin Coroutines
order: 1
coverImage: /images/sample-2.svg
---

A **coroutine** is a suspendable computation. Unlike threads, coroutines are cheap — you can launch hundreds of thousands of them without running out of memory.

## The Core Idea

```kotlin
suspend fun fetchUser(id: Long): User {
    val data = httpClient.get("/users/$id") // suspends here, not blocks
    return Json.decode<User>(data)
}
```

The `suspend` keyword marks a function that can pause and resume without blocking a thread. While `fetchUser` is waiting for the HTTP response, its thread is free to do other work.

## Structured Concurrency

Coroutines are launched inside a **scope**. The scope defines the lifetime of its children: if the scope is cancelled, all its coroutines are cancelled too.

```kotlin
coroutineScope {
    val users = async { fetchUsers() }
    val settings = async { fetchSettings() }
    // both run concurrently; coroutineScope waits for both
    render(users.await(), settings.await())
}
```

This makes resource cleanup predictable: you never leak a background task because its scope was forgotten.

## Next in this series

The next note covers `Flow` — Kotlin's way to model streams of values.
