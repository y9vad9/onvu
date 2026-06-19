---
title: Understanding suspend Functions
preview: Suspend functions are the building block of Kotlin coroutines — here is what they actually do under the hood.
date: 2024-04-01
parents: [Kotlin]
series: Kotlin Coroutines
order: 3
---

Every `suspend fun` is transformed by the Kotlin compiler into a state machine. This is the mechanism that allows coroutines to pause and resume without blocking a thread.

## The Continuation Passing Transform

```kotlin
// What you write:
suspend fun doWork(): Result {
    val a = stepA()
    val b = stepB(a)
    return combine(a, b)
}

// What the compiler generates (simplified):
fun doWork(continuation: Continuation<Result>): Any {
    // state machine with cases 0, 1, 2...
    when (continuation.label) {
        0 -> { continuation.label = 1; stepA(continuation) }
        1 -> { val a = ...; continuation.label = 2; stepB(a, continuation) }
        2 -> { combine(a, b) }
    }
}
```

The `Continuation` is a callback that represents "what to do next". The compiler splits the function at every `suspend` call and creates a state machine where each state corresponds to a resumption point.

## Why This Matters

Understanding continuations explains:

- Why `suspend` functions can only be called from other `suspend` functions or coroutine builders
- Why coroutine cancellation works cooperatively (the state machine checks for cancellation at each suspension point)
- Why coroutines are "lightweight" — the state machine is just an object on the heap, not an OS thread
