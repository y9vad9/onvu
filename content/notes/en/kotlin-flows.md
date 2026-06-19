---
title: Kotlin Flow — Cold Streams
preview: Flow is Kotlin's asynchronous stream type. Understanding cold vs hot flow is the key to using it correctly.
date: 2024-03-15
parents: [Kotlin]
series: Kotlin Coroutines
order: 2
---

A `Flow` is a **cold** asynchronous stream: it does not produce values until someone collects it, and it produces values fresh for each collector.

```kotlin
fun counter(from: Int, to: Int): Flow<Int> = flow {
    for (i in from..to) {
        delay(100)
        emit(i)
    }
}

// Nothing executes until here:
counter(1, 5).collect { println(it) }
```

## Cold vs Hot

| | Cold | Hot |
|---|---|---|
| Runs when | Collected | Always |
| Shares emissions | No | Yes |
| Example | `flow { }` | `StateFlow`, `SharedFlow` |

A `StateFlow` is always active and replays its last value to new collectors — useful for UI state. A `SharedFlow` is a broadcast channel.

## Operators

Flow ships with a rich operator set:

```kotlin
userEvents
    .filter { it is ClickEvent }
    .map { it as ClickEvent }
    .debounce(300)
    .collect { handleClick(it) }
```

All operators are **lazy** — they don't execute until the terminal `collect` is called.
