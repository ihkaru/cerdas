# 🚀 Cerdas Quick Start Guide

Welcome! This guide will help you get the **Cerdas** full-stack monorepo running locally in under 10 minutes.

## Prerequisites

Ensure you have the following installed:

*   **Node.js 22+** (Managed via `nvm` recommended)
*   **pnpm** (`npm install -g pnpm`)
*   **PHP 8.2+** (with `sqlite3`, `pcntl`, `intl`, `mbstring` extensions)
*   **Composer**
*   **Docker Desktop** (Optional, for production build testing)
*   **Git**

---

## ⚡ Fast Track Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ihkaru/cerdas.git
cd cerdas
```

### 2. Install Dependencies (Frontend & Backend)
We use a unified script to install everything:
```bash
pnpm install
```
*This installs Node dependencies for all workspaces and runs `composer install` for the backend.*

### 3. Configure Environment
Set up the backend environment variables:
```bash
cd apps/backend
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
cd ../..
```

### 4. Start Development Servers
Run all services (Backend API, Web Editor, Mobile Client) in parallel:
```bash
.\scripts\start-all.bat
```
*(Mac/Linux users: run `pnpm dev`)*

---

## 🌍 Accessing the Apps

| App | URL | Credentials (Seeded) |
|-----|-----|----------------------|
| **Backend API** | `http://localhost:9980` | N/A |
| **Web Editor** | `http://localhost:9982` | User: `admin@cerdas.com` <br> Pass: `password` |
| **Mobile Client** | `http://localhost:9981` | (Same as above) |

---

## 🛠️ Common Commands

| Task | Command | Description |
|------|---------|-------------|
| **Lint Code** | `pnpm lint` | Runs ESLint (SonarJS) & Larastan |
| **Run Tests** | `pnpm test` | Runs Vitest & PHPUnit |
| **Build Prod** | `pnpm build` | Compiles all apps for production |
| **Type Check** | `pnpm typecheck` | Validates TypeScript types |

---

## 🤝 Troubleshooting

**Port Conflicts?**
*   Backend (local dev) needs port `9980`. Port `8080` is used internally by the Docker production container.
*   Client needs port `9981`.
*   Editor needs port `9982`.
*   *Fix*: Check `start-all.bat` output or `docker ps` if running containers.

**Database Issues?**
*   Ensure `database/database.sqlite` exists in `apps/backend`.
*   Run `php artisan migrate:fresh --seed` to reset data.

**Need Help?**
See [CONTRIBUTING.md](CONTRIBUTING.md) for deep-dive development info.
