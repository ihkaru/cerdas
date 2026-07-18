# Cerdas Project - Agent Memory

> **CRITICAL**: Always read `docs/architecture_principles.md` before any implementation work.

## Project Overview
Cerdas adalah AppSheet clone - self-hosted, offline-first, no-code app builder untuk data collection.

## Active Version & Status
* **Version**: 0.2.37 (Stable Release)
* **Latest Changes**: Resolved Laravel Model `$table` property collision with dynamic relation properties in IDE/static analysis; standardized tag naming format for release-please releases to avoid alphabetical sorting issues on GitHub.

## Core Technical Stack
* **Backend**: Laravel 12 (PURE API only - no Blade, no Filament, Sanctum Auth)
* **Client App**: Framework7 v9 + Vue 3 + TypeScript (script setup)
* **Editor App**: Framework7 v9 + Vue 3 + TypeScript (script setup)  
* **Offline Storage**: capacitor-community/sqlite
* **Database**: MySQL (multi-tenant, shared DB)

## Monorepo Structure
```bash
apps/backend    - Laravel 12 + Sanctum
apps/client     - Framework7 + Vue 3 (data collection PWA/APK)
apps/editor     - Framework7 + Vue 3 (visual form/view builder)
packages/types  - @cerdas/types (shared strict TS types)
```

## User persona & Standing Rules
1. **User Persona**: User is Product Manager, AI is fullstack developer + system architect.
2. **Communication**: Prefer Indonesian communication.
3. **TypeScript**: Strict Mode is MANDATORY - never disable, fix type errors instead.
4. **Non-destructive Creation**: Before using `write_file` to create a new file, verify it does not already exist. If it exists, read content and ask for instructions.
5. **No Browser Tool**: NEVER use browser tools. User will verify manually.
6. **Double-Spacing / Spacing Rules**: Follow [docs/framework7_vue_theming_best_practices.md](file:///c:/projects/cerdas/docs/framework7_vue_theming_best_practices.md) for custom theming and device notches. Use inline styles with `!important` on `<f7-page-content>` to override F7 page content double-spacing bugs.
7. **Version Single Source of Truth**: NEVER hardcode version strings in Vue templates. Use `__APP_VERSION__` injected by Vite.
8. **UI Flow Documentation**: Always update `references/SCREEN_FLOW.md` when changing/fixing UI navigation, routing, or screen states.
9. **SOP Update Rule**: Update `gemini.md` with important changes or progress to maintain work memory.

## Critical Architecture Decisions
1. **Context Object Pattern**: Use `AppContext` for dependency injection in the service layer.
2. **UI per-app**: No shared UI package - client and editor have their own UI components.
3. **Schema Versioning**: Published versions are IMMUTABLE.
4. **Validation Engine**: JavaScript closures executed client-side (offline-capable).
5. **Sync Strategy**: Last-write-wins for conflict resolution.
6. **ClosureContext (App-Wide)**: Form closures have access to typed user context (`ctx.user.id`, `ctx.user.email`, `ctx.user.name`, `ctx.user.role`, `ctx.user.organizationId`, `ctx.assignment.id`, `ctx.assignment.status`, `ctx.assignment.organization_id`, and `ctx.utils.*`).

## Dual Android Dev Modus
* **Mode 1: Local Backend**: `./scripts/start-android-local.ps1` (Backend at `http://10.0.2.2:9980/api`)
* **Mode 2: Remote Backend**: `./scripts/start-android-remote.ps1` (Backend at remote staging)

## Reference Documents
* `docs/architecture_principles.md` - Technical principles
* `docs/DEVELOPMENT_LIFECYCLE.md` - Start/stop, coding loop, and Release/Versioning SOP
* `docs/task.md` - Current TODO list
* `references/SCREEN_FLOW.md` - Screen Flow & Routing Guide
* `ROADMAP.md` - Feature Roadmap
* `docs/TERMINOLOGY_DISAMBIGUATION.md` - Canonical naming conventions (SSOT)
