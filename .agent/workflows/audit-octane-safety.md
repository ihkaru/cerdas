---
description: Scan for Octane-unsafe patterns (static state, singletons, memory leaks)
---

This workflow scans the Laravel backend for code patterns that are **unsafe** for Laravel Octane's persistent worker model. These patterns can cause memory leaks, data leakage between users, and inconsistent state.

Run this **before migrating to Octane** and **periodically** during development to catch regressions.

Steps:

// turbo
1. Run the Octane safety audit script.

```powershell
./scripts/audit-octane-safety.ps1
```

2. Review the output. Each finding will show the file, line, and the unsafe pattern detected. Fix any issues before deploying with Octane.

### What it checks:
- **Static mutable properties** — Can leak state between requests
- **Global variables** — Shared across all requests in a worker
- **Superglobals** (`$_SESSION`, `$_GLOBALS`, `$_SERVER`) — Not reliable in Octane
- **`file_put_contents` / `file_get_contents` for state** — Use Redis/cache instead
- **`app()->singleton()` with mutable state** — Singletons persist across requests
- **`config()->set()` at runtime** — Config changes persist until worker restarts
- **`env()` outside config files** — `env()` returns `null` when config is cached
