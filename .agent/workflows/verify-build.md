---
description: Verify local build (Web + Android) before pushing
---

This workflow runs the full local build verification script to ensure that the project builds correctly (Web Assets + Capacitor Sync + Gradle AssembleDebug). This is the same check that runs automatically on `git push`.

Steps:
1. Run the verification script.

// turbo
2. Execute `scripts/verify-build.ps1`

```powershell
./scripts/verify-build.ps1
```

**Options:**
- To verify ONLY web assets (faster):
  ```powershell
  ./scripts/verify-build.ps1 -WebOnly
  ```
