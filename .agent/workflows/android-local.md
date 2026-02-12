---
description: Start Android Dev with LOCAL backend (start-all.bat)
---

# Android Dev: Local Backend

Use this mode when you need to work on **Backend + Frontend** simultaneously.

## Features
- **Backend**: Local (`http://10.0.2.2:8080/api`)
- **Frontend**: Live Reload (`http://10.0.2.2:9981`)
- **Database**: Local MySQL

## Steps

// turbo
1. Run the local dev script:
```powershell
./scripts/start-android-local.ps1
```

> [!TIP]
> The script will **automatically start** the `Pixel_5_API_30` emulator if no device is connected! 🚀

## Options

- **Skip Clean**: Use if you just want to restart servers without reinstalling the app (faster).
  ```powershell
  ./scripts/start-android-local.ps1 -SkipClean
  ```

## Troubleshooting

- **API Connection Error**: Ensure `start-all.bat` window is open and backend is running.
- **Login Failed**: Check if local database is seeded (`php artisan migrate:fresh --seed`).
