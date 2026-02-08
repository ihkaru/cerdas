---
description: Build Android for Production (Coolify Server)
---

This workflow automates the process of building a signed APK/AAB for the Android app connected to the Coolify Production server.

Steps:
1. Ensure `apps/client/.env.production` exists and points to `https://api.dvlpid.my.id`.
2. Ensure `apps/client/capacitor.config.ts` has `liveReload` set to `false`.
3. Run the automation script.

// turbo
4. Run scripts/build-android-prod.ps1 or equivalent.

```powershell
./build-android-prod.ps1
```
