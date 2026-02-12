# Cerdas Workflow & Debugging Guide

This document outlines the complete lifecycle of development, from identifying bugs in production to fixing them locally and deploying the solution.

## 1. The "Bug Fix" Loop

How to handle issues reported in production.

### Scenario A: Bug in Production APK (Mobile App)

**Symptom:** User reports "App crashes when I click X" or "Data doesn't load".

```mermaid
sequenceDiagram
    participant User as End User
    participant Dev as Developer
    participant Script as start-android-docker.bat
    participant Docker as Docker Backend
    participant Client as Local Client
    participant Emu as Emulator
    
    User->>Dev: Reports Bug (Crash/Error)
    
    Note over Dev: Step 1: Reproduce Locally
    Dev->>Script: Run Script
    
    alt Docker Fails to Start (Unhappy Path)
        Script-->>Dev: Error: Port 8080 busy
        Dev->>Dev: Kill existing process / Restart Docker
        Dev->>Script: Retry
    end

    Script->>Docker: Up (Backend + DB)
    Script->>Client: Start Vite (Live Reload)
    Script->>Emu: Launch Emulator
    
    alt Emulator Connection Refused (Unhappy Path)
        Emu--xDocker: Connection Refused (10.0.2.2)
        Dev->>Dev: Check 'docker ps'
        Dev->>Dev: Restart ADB / Wipe Data
    end

    Emu->>Docker: API Request (Happy Path)
    Docker-->>Emu: 200 OK
    
    Note over Dev: Step 2: Fix & Verify
    Dev->>Client: Edit Code (Fix Bug)
    Client->>Emu: Hot Module Reload (HMR)
    Emu->>Dev: Bug Fixed!
    
    Dev->>Dev: Commit & Push
```


### Scenario B: Bug in Production Backend (API/Logic)

**Symptom:** 500 Error, Data Mismatch, "Something went wrong".

```mermaid
sequenceDiagram
    participant User as End User
    participant Prod as Prod Backend (Coolify)
    participant Dev as Developer
    participant Local as Local Docker (Dev)
    participant Test as PHPUnit/Pest

    User->>Prod: API Request
    Prod-->>User: 500 Server Error
    
    Note over Dev: Step 1: Diagnose
    Dev->>Prod: Check Logs (Coolify Console)
    Prod-->>Dev: Stack Trace (e.g., NullPointer)

    Note over Dev: Step 2: Reproduce
    Dev->>Local: docker-compose up -d
    Dev->>Local: curl /api/endpoint (Repro)
    
    alt Output Mismatch (Happy Path)
        Local-->>Dev: 500 Error (Reproduced)
    else No Error (Unhappy Path)
        Local-->>Dev: 200 OK
        Note over Dev: Data/State difference?
        Dev->>Prod: Download Prod DB Dump (Optional)
        Dev->>Local: Import Prod DB
    end

    Note over Dev: Step 3: Fix
    Dev->>Local: Edit PHP Code
    Dev->>Test: Run Tests
    
    alt Tests Fail (Unhappy Path)
        Test-->>Dev: FAIL
        Dev->>Local: Fix Code
        Dev->>Test: Retry
    end

    Test-->>Dev: PASS
    Dev->>Dev: Git Push
    
    Note over Dev: Step 4: Deploy
    Dev->>Prod: Auto-Deploy via GitHub
```

### Scenario C: Database Schema / Migration Issues

**Symptom:** `SQLSTATE[HY000]: General error: 1 no such table`.

```mermaid
sequenceDiagram
    participant App as Laravel App
    participant DB as MariaDB
    participant Dev as Developer
    participant Coolify as Coolify

    App->>DB: SELECT * FROM new_table
    DB--xApp: Error: Table not found (Unhappy Path)
    
    Note over Dev: Fix Missing Migration
    Dev->>Dev: php artisan make:migration
    Dev->>Dev: php artisan migrate (Local)
    Dev->>Dev: Git Push

    Note over Coolify: Deployment
    Coolify->>Coolify: Split Build & Run
    
    alt Migration Fails (Unhappy Path)
        Coolify--xCoolify: Migration Error (Duplicate Column)
        Coolify->>Dev: Notification (Deploy Failed)
        Dev->>Coolify: SSH / Console
        Dev->>Coolify: php artisan migrate:rollback
        Dev->>Dev: Fix Migration File
        Dev->>Dev: Push Again
    else Auto-Migration (Happy Path)
        Coolify->>DB: php artisan migrate --force
        DB-->>Coolify: Success
        Coolify->>App: Start Container
    end
```

---

## 2. Development Modes Diagram

Choose the right mode for your task.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Script as Start Script
    participant Client as Client (Vite)
    participant Emu as Android Emulator
    participant Docker as Local Docker
    participant Prod as Production API

    Note over Dev: Which mode do I need?

    alt Feature Dev (Full Stack)
        Dev->>Script: start-android-docker.bat
        Script->>Docker: Start Backend & DB
        Script->>Client: Start Vite (Live Reload)
        Emu->>Docker: Connects to Local API
    else UI/Frontend Tweaks (Real Data)
        Dev->>Script: start-android-remote.ps1
        Script->>Client: Start Vite only
        Emu->>Prod: Connects to Production API
    else Legacy/Native Dev
        Dev->>Script: start-android-local.ps1
        Script->>Docker: Start Backend (Host PHP)
        Emu->>Docker: Connects to Host API
    end
```

## 3. Deployment Pipeline (CI/CD)

What happens when you `git push`.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Local Git (Husky)
    participant GH as GitHub Actions
    participant Release as Release Please (Bot)
    participant Coolify as Coolify (Prod)
    participant Play as Google Play (Future)

    Dev->>Git: git push
    Git->>Git: Pre-Push Hook
    
    alt Native Changes?
        Git->>Git: Full Build Check (Gradle + Web)
    else Web Changes?
        Git->>Git: Web Build Check (Vite)
    end
    
    alt Build Fails (Unhappy Path)
        Git--xDev: Push Rejected (Fix Errors)
    end

    Git->>GH: Push Commits
    GH->>GH: Run Tests & Lint

    alt Tests Fail (Unhappy Path)
        GH--xDev: Action Failed (Email Alert)
    end

    opt On Release (Merged to Main)
        GH->>Release: Create Release Tag
        GH->>GH: Build Production APK
        GH->>GH: Build Docker Image
        GH->>Coolify: Trigger Deploy Webhook
        Coolify->>Coolify: Pull Image & Migrate DB
    end
```

## 4. Troubleshooting Cheat Sheet

| Problem | Context | Solution |
| :--- | :--- | :--- |
| **Emulator Offline** | Android | Wipe Data in AVD Manager or restart adb server. |
| **"Network Error"** | Client | Check if Backend is running. Check `VITE_API_BASE_URL` in `.env`. |
| **APK connects to localhost** | Production | Ensure `capacitor.config.ts` uses `process.env.CAPACITOR_LIVE_RELOAD`. |
| **Migration Failed** | Coolify | SSH/Console into container: `php artisan migrate --force`. |
| **Push Rejected** | Git | Fix lint errors (`npm run lint`) or build errors (`pnpm build`). |

---

## 5. Environment Management & Build Risks

**Current Risk:**
Our current workflow uses scripts to *modify* `.env` files (e.g., swapping `.env.local-dev` to `.env`).
*   **Danger:** If you run `start-android-local.ps1` (setting API to `localhost`), and then immediately run a manual build (`pnpm build`), you might accidentally build a "Production" APK that points to `localhost`.
*   **Mitigation:** Always use the dedicated GitHub Action for Production builds (which guarantees a clean state).

## 5. Environment Management & Build Variants (Implemented)

We use **Android Product Flavors** to strictly separate environments:

| Flavor | Package ID | Config | Use Case |
| :--- | :--- | :--- | :--- |
| **Dev** | `com.cerdas.client.dev` | Live Reload + Dev API | Local Development |
| **Prod** | `com.cerdas.client` | Bundled Assets + Prod API | Google Play Release |

### How to Build
*   **Local Dev:** `npx cap run android --flavor dev` (runs `assembleDevDebug`)
*   **Production:** Handled by GitHub Actions (`assembleProdRelease`)

**Safety Guarantee:**
It is now Impossible to accidentally overwrite the Production app with a Dev build because they have different Package IDs (`.dev` suffix).
