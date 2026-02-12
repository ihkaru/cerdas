---
description: Start Android Dev with REMOTE backend (api.dvlpid.my.id)
---

# Android Dev: Remote Backend

Use this mode when you are working on **Frontend UI only** and want to use real production data.

## Features
- **Backend**: Production (`https://api.dvlpid.my.id/api`)
- **Frontend**: Live Reload (`http://10.0.2.2:9981`)
- **Database**: Production Database

## Steps

// turbo
1. Run the remote dev script:
```powershell
./scripts/start-android-remote.ps1
```

> [!TIP]
> The script will **automatically start** the `Pixel_5_API_30` emulator if no device is connected! 🚀

> [!NOTE]
> This will **NOT** start your local backend (PHP/Caddy). It only starts the Vite dev server for the client.

## Options

- **Skip Clean**: Use if you just want to restart servers without reinstalling the app (faster).
  ```powershell
  ./scripts/start-android-remote.ps1 -SkipClean
  ```

## Troubleshooting

- **CORS Error**: Ensure `capacitor://localhost` is allowed on production server (see `COOLIFY_GUIDE.md`).
- **Login Failed**: Ensure you are using production credentials.
