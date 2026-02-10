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

[Download APK](https://github.com/ihkaru/cerdas/releases/latest) · [Documentation](docs/) · [Roadmap](ROADMAP.md)

</div>

---

## Why Cerdas?

Most no-code platforms come with **heavy restrictions**. Cerdas was born out of the frustration with AppSheet's limit of **only 10 users** for the free tier.

| | AppSheet | KoboToolbox | **Cerdas** |
|---|---------|-------------|-----------|
| **Self-Hosted** | ❌ | ✅ | ✅ |
| **User Limit** | 10 (free) | Unlimited | **Unlimited** |
| **Offline-First** | Partial | ❌ | ✅ |
| **Custom Hosting** | ❌ | Complex | **Docker one-click** |
| **Monthly Cost** | $10/user | Free | **Free** |

## Key Features

- **📱 Offline-First Mobile PWA** — Native-like experience with Framework7 + Capacitor. Works without internet, syncs when online.
- **🛠️ No-Code Form Editor** — Build complex schemas with nested forms, conditional visibility, and dynamic formulas.
- **🔄 Robust Sync Engine** — Bi-directional sync with conflict resolution for large datasets and media attachments.
- **🗺️ Geospatial Support** — GPS capture with Leaflet map integration.
- **📊 Data Export** — Excel/CSV export for analysis and reporting.
- **🔐 Role-Based Access** — Advanced RBAC via Spatie Laravel Permission.
- **⚡ High Performance** — Laravel Octane + FrankenPHP worker mode (3,000-15,000 req/s).
- **🤖 Automated Builds** — GitHub Actions CI/CD with automatic APK distribution.

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    Monorepo (pnpm workspaces)            │
├──────────────┬──────────────┬──────────────┬────────────┤
│  apps/client │ apps/editor  │ apps/backend │  packages/ │
│  Mobile PWA  │  Web Editor  │  Laravel API │  Shared    │
│  Vue 3 + F7  │  Vue 3 + F7  │  Octane +    │  Libs      │
│  Capacitor   │              │  FrankenPHP  │            │
├──────────────┴──────────────┴──────┬───────┴────────────┤
│           Docker Compose           │     GitHub Actions  │
│    FrankenPHP · Redis · MySQL      │  APK Build · Audit  │
└────────────────────────────────────┴─────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Server** | Laravel 12 + Octane + FrankenPHP | High-performance API (worker mode) |
| **Mobile Client** | Vue 3 + Framework7 + Capacitor | Offline-first PWA / Android APK |
| **Form Editor** | Vue 3 + Framework7 | No-code drag-and-drop form builder |
| **Shared Packages** | TypeScript | Form engine, expression engine, types |
| **Database** | MySQL/PostgreSQL (server) + SQLite (client) | Persistent + offline storage |
| **Auth** | Laravel Sanctum + Google OAuth | Token-based API authentication |
| **CI/CD** | GitHub Actions | APK builds, Octane safety audits |
| **Deployment** | Docker Compose + Coolify | One-click self-hosted deployment |

## Quick Start

### Prerequisites

- **PHP 8.2+** with `pcntl` extension
- **Node.js 22+**
- **pnpm** (`npm install -g pnpm`)
- **Composer**

### Development

```bash
# Clone
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

# Start all services (Backend + Editor + Client)
./start-all.bat
```

### Production (Docker)

```bash
# One command deployment
docker compose -f docker-compose.prod.yml up -d
```

> See [Coolify Deployment Guide](COOLIFY_GUIDE.md) for managed hosting setup.

## Project Structure

```
cerdas/
├── apps/
│   ├── backend/          # Laravel 12 API (Octane + FrankenPHP)
│   ├── client/           # Mobile PWA (Vue 3 + Framework7 + Capacitor)
│   └── editor/           # Web Editor (Vue 3 + Framework7)
├── packages/
│   ├── form-engine/      # Core form rendering library
│   └── expression-engine/ # Dynamic formulas & filters
├── scripts/              # Automation & audit scripts
├── .github/workflows/    # CI/CD pipelines
└── docker-compose.prod.yml
```

## CI/CD Pipelines

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Build APK** | Push to `main` (client changes) | Auto-build signed APK → GitHub Releases |
| **Octane Audit** | Push to `main` (backend changes) | Detect memory leak patterns before deploy |

## Security

- All secrets managed via GitHub Secrets / environment variables
- Automated credential leak detection via pre-commit scanning
- Octane-safe code patterns enforced by CI

## License

[MIT License](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  Built with ❤️ for field data collection teams everywhere.
</div>
