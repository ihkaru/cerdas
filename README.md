<div align="center">

# 🧠 Cerdas

### Open-Source Self-Hosted AppSheet Alternative

**Build, deploy, and manage mobile data collection apps — no code required.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Laravel 12](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![FrankenPHP](https://img.shields.io/badge/FrankenPHP-Octane-8B5CF6?logo=php&logoColor=white)](https://frankenphp.dev)
[![Build APK](https://github.com/ihkaru/cerdas/actions/workflows/build-android.yml/badge.svg)](https://github.com/ihkaru/cerdas/actions/workflows/build-android.yml)
[![Octane Audit](https://github.com/ihkaru/cerdas/actions/workflows/octane-audit.yml/badge.svg)](https://github.com/ihkaru/cerdas/actions/workflows/octane-audit.yml)

[Download APK](https://github.com/ihkaru/cerdas/releases/latest) · [Quick Start](QUICKSTART.md) · [Documentation](docs/) · [Terminology Guide](docs/TERMINOLOGY_DISAMBIGUATION.md) · [Roadmap](ROADMAP.md)

</div>

---

## Why Cerdas?

Most no-code platforms come with **heavy restrictions**. Cerdas was born out of the frustration with AppSheet's limit of **only 10 users** for the free tier.

|                   | AppSheet       | KoboToolbox | **Cerdas**              |
|-------------------|----------------|-------------|-------------------------|
| **Self-Hosted**   | ❌             | ✅          | ✅                      |
| **User Limit**    | 10 (free)      | Unlimited   | **Unlimited**           |
| **Offline-First** | Partial        | ❌          | ✅                      |
| **Custom Hosting**| ❌             | Complex     | **Docker one-click**    |
| **Monthly Cost**  | $10/user       | Free        | **Free**                |

## Key Features

- **📱 Offline-First Mobile Client** — Built with Framework7 + Capacitor. Operates fully offline using SQLite and syncs data when connectivity is restored.
- **🛠️ Visual Form Editor** — Web-based builder for complex schemas, with support for nested forms, repeating groups, conditional fields, and dynamic options.
- **🧠 JS Expression Engine** — Write custom JavaScript closures directly in the editor to control validation (`Warning`), field visibility (`Show If`), edit access (`Editable If`), pre-calculated values (`Formula`), and default values (`Initial Value`).
- **🔄 Bi-directional Sync** — Background synchronization with conflict handling for large datasets and binary media attachments.
- **🗺️ GPS + Map** — Native coordinate capture with accuracy metadata and offline-capable map previews via MapLibre GL.
- **📊 Data Export** — Export submissions to Excel/CSV for downstream analysis.
- **🔐 Role-Based Access** — Granular RBAC via Spatie Laravel Permission.
- **⚡ High-Throughput Backend** — Laravel Octane with FrankenPHP worker mode for sustained high concurrency.
- **🤖 Automated CI/CD** — GitHub Actions for APK builds, Octane safety audits, code quality checks, and secret scanning.

## Architecture

┌──────────────────────────────────────────────────────────┐
│                    Monorepo (pnpm workspaces)             │
├──────────────┬──────────────┬──────────────┬─────────────┤
│  apps/client │ apps/editor  │ apps/backend │  packages/  │
│  Mobile PWA  │  Web Editor  │  Laravel 12  │  Shared     │
│  Vue 3 + F7  │  Vue 3 + F7  │  FrankenPHP  │  Libs       │
├──────────────┴──────────────┴──────┬───────┴─────────────┤
│           Docker Stack             │     GitHub Actions   │
│   API · Reverb · Worker · Redis    │  APK Build · Audit   │
└────────────────────────────────────┴──────────────────────┘

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Server** | Laravel 12 + Octane + FrankenPHP | High-performance API (worker mode) |
| **Real-time** | Laravel Reverb (ReactPHP) | Real-time signaling & notifications |
| **Mobile Client** | Vue 3 + Framework7 + Capacitor | Offline-first PWA / Android APK |
| **Form Editor** | Vue 3 + Framework7 | No-code visual form builder |
| **Shared Packages** | TypeScript | Form engine, expression engine |
| **Database** | MySQL (server) · SQLite (client) | Server-side + offline-first storage |
| **Auth** | Laravel Sanctum + Google OAuth | Token-based API authentication |
| **CI/CD** | GitHub Actions | APK builds, audits, quality checks |
| **Deployment** | Docker Compose + Coolify | Role-based container deployments |

## Quick Start

### Prerequisites

- **PHP 8.2+** with `pcntl` extension
- **Node.js 22+**
- **pnpm** (`npm install -g pnpm`)
- **Composer**
- **Docker** (for the Docker-based workflow)

### Option A — Docker (Recommended)

```bash
git clone https://github.com/ihkaru/cerdas.git
cd cerdas

# Start all services (Backend + Client + Editor) in Docker
pnpm run dev:docker
```

### Option B — Local Setup

```bash
git clone https://github.com/ihkaru/cerdas.git
cd cerdas

# Install all dependencies
pnpm install

# Setup backend
cd apps/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
cd ../..

# Start all services (Windows)
.\scripts\start-all.bat
```

### Verification

Run this before pushing to ensure the build is clean.

```bash
# Linux / Mac
pnpm run verify

# Windows (PowerShell)
.\scripts\verify-local.ps1
```

### Production (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d
```

> See [Coolify Deployment Guide](docs/COOLIFY_GUIDE.md) for managed hosting setup.

## Project Structure

```
cerdas/
├── apps/
│   ├── backend/           # Laravel 12 API (Octane + FrankenPHP)
│   ├── client/            # Mobile PWA (Vue 3 + Framework7 + Capacitor)
│   └── editor/            # Web Editor (Vue 3 + Framework7)
├── packages/
│   ├── form-engine/       # Shared form rendering library
│   └── expression-engine/ # JS expression evaluator for dynamic field logic
├── scripts/               # Automation & audit scripts
├── docs/                  # Project documentation & guidelines (including [Terminology Guide](docs/TERMINOLOGY_DISAMBIGUATION.md))
└── docker-compose.prod.yml
```

## Developer Guide

Key documentation every contributor should read:

| Document | Description |
|----------|-------------|
| [Terminology & Disambiguation](docs/TERMINOLOGY_DISAMBIGUATION.md) | **SSOT** for naming conventions across backend, frontend, and TypeScript types |
| [↳ Assignment Status Canonical Values](docs/TERMINOLOGY_DISAMBIGUATION.md#23-assignment-status--canonical-values) | The 5 canonical assignment statuses (`assigned`, `in_progress`, `submitted`, `synced`, `rejected`), their flow per app mode, and which legacy aliases are removed |
| [Assignment Status Flows Table](docs/STATUS_FLOWS.md) | **Tabel lengkap pemetaan status** antara SQLite lokal client dan database backend server untuk Simple & Complex Mode |
| [Architecture Principles](docs/architecture_principles.md) | Core architectural decisions and patterns |
| [Form Editor Workflow](docs/FORM_EDITOR_WORKFLOW.md) | How the schema editor and publish flow work |
| [Development Lifecycle](docs/DEVELOPMENT_LIFECYCLE.md) | Branch strategy, versioning, and release process |
| [Octane Safety Guide](docs/WORKFLOW_AND_DEBUGGING.md) | FrankenPHP/Octane-safe coding patterns |

> [!TIP]
> If you encounter a naming discrepancy (e.g., a field called `form_id` somewhere but `table_id` elsewhere, or a status labeled `'pending'` in old code), check **[TERMINOLOGY_DISAMBIGUATION.md](docs/TERMINOLOGY_DISAMBIGUATION.md)** first — it documents all known historical inconsistencies and their canonical replacements.



## CI/CD Pipelines

| Workflow | Trigger | Purpose |
|----------|---------|---------| 
| **Build APK** | Release Publication / Tag | Auto-build signed APK → GitHub Releases |
| **Octane Audit** | Push to `main` (backend changes) | Detect memory leak patterns before deploy |
| **Code Quality** | Push to `main` (apps changes) | ESLint (Vue/TS) + Laravel Pint (PHP) |
| **Secret Scan** | Push to `main` (all) | Detect leaked credentials/keys |

## Security

- All secrets managed via GitHub Secrets / environment variables
- Automated credential leak detection via pre-commit hooks
- Octane-safe code patterns enforced by CI

## License

[MIT License](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  Built with ❤️ for field data collection teams.
</div>
