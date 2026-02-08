# Android Production Build Guide

To build the Android app that connects to your new Coolify production server (`https://api.dvlpid.my.id`), follow these steps.

## Prerequisites
- Android Studio installed.
- Setup `COOLIFY_GUIDE.md` first (Deploy Backend & Database).

## Step 1: verifies Production Configuration
1.  **Check `apps/client/capacitor.config.ts`**:
    -   Ensure `const useLiveReload = false;` (I have set this for you).
2.  **Check `apps/client/.env.production`**:
    -   Ensure `VITE_API_BASE_URL=https://api.dvlpid.my.id`.

## Step 2: Build Web Assets
Open your terminal in `c:\projects\cerdas` (or root):

```powershell
cd apps/client
npm install
# This uses .env.production automatically because of "tsc && vite build"
npm run build
```

This will create a `dist` folder with the production assets pointing to your live API.

## Step 3: Sync to Android
Copy the web assets to the native Android project:

```powershell
npx cap sync android
```

## Step 4: Build APK / AAB
1.  Open Android Studio:
    ```powershell
    npx cap open android
    ```
2.  Wait for Gradle Sync to finish.
3.  Go to **Build** -> **Generate Signed Bundle / APK**.
4.  Choose **APK** (for direct install) or **Android App Bundle** (for Play Store).
5.  Create a new Keystore (if you don't have one) or use existing.
6.  Select **Release** build variant.
7.  Click **Finish**.

## Troubleshooting
- **Network Error / API Unreachable?**
    - Ensure your `api.dvlpid.my.id` has a valid SSL (HTTPS). Android blocks cleartext (HTTP) by default in production.
    - Check if you can access `https://api.dvlpid.my.id/health` from your phone's browser.
- **App still showing localhost?**
    - You might have forgotten `npm run build` or `npx cap sync android`.
    - Verify `dist/index.html` content (search for `api.dvlpid.my.id` inside the js files if you want to be sure).
