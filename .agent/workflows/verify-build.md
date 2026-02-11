---
description: Verify local build (Web + Android) before pushing
---

This workflow runs the local build verification script. The `pre-push` hook runs automatically on `git push` with **smart tiering**:

| Changes | Verification | Time |
|---------|-------------|------|
| Only `.vue`, `.ts`, `.css` | Web build only | ~30s |
| `android/`, `capacitor.config` | Full (web + cap sync + gradle) | ~5-10m |
| Only `apps/backend/` | Skipped | instant |

Steps:
1. Run the verification script.

// turbo
2. Execute `scripts/verify-build.ps1`

```powershell
./scripts/verify-build.ps1
```

**Options:**
- Web-only (fastest):
  ```powershell
  ./scripts/verify-build.ps1 -WebOnly
  ```
- Skip pnpm install:
  ```powershell
  ./scripts/verify-build.ps1 -SkipInstall
  ```
- Bypass pre-push hook entirely:
  ```bash
  git push --no-verify
  ```
