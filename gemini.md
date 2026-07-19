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
* `docs/architecture_principles.md` - Technical principles (**READ FIRST** before any implementation)
* `docs/DEVELOPMENT_LIFECYCLE.md` - Start/stop, coding loop, and Release/Versioning SOP (**Fase 6** = how to bump version / release)
* `docs/WORKFLOW_AND_DEBUGGING.md` - Debugging workflow, CI/CD, and local verification (`verify-local.ps1`)
* `docs/TERMINOLOGY_DISAMBIGUATION.md` - Canonical naming conventions (SSOT)
* `docs/STATUS_FLOWS.md` - Assignment status state machine diagram
* `docs/FORM_EDITOR_WORKFLOW.md` - Detailed workflow for the visual form/view editor
* `docs/framework7_vue_theming_best_practices.md` - F7 theming, notch handling, spacing bug fixes
* `docs/ANDROID_BUILD_GUIDE.md` - Android build, signing, and APK release guide
* `docs/COOLIFY_GUIDE.md` - Production deployment guide (Coolify + Docker)
* `docs/DOCKER_DEV.md` - Local development with Docker backend
* `docs/task.md` - Current TODO list
* `references/SCREEN_FLOW.md` - Screen Flow & Routing Guide
* `ROADMAP.md` - Feature Roadmap
* `QUICKSTART.md` - Initial setup guide for new contributors / local dev

## Progress Log
- **2026-07-19**: Implementasi Google Sheet Sync MVP (DB → Sheet, Opsi B: App-Level Token Owner). Semua komponen selesai:
  - **DB**: Migration `google_oauth_tokens` + `pending_sheet_rows` (micro-batch staging table)
  - **Models**: `GoogleOAuthToken` (encrypted tokens) + `PendingSheetRow`
  - **Services**: `GoogleOAuthService` + `GoogleSheetColumnMapper` + `GoogleSheetsService` (dengan exponential backoff)
  - **Jobs**: `GoogleSheetEnqueueRowJob` (lightweight, no API call) + `GoogleSheetBatchFlushJob` (tiap 30s, 1 batchUpdate/spreadsheet) + `GoogleSheetInitialExportJob` + `GoogleSheetTokenRefreshJob` (hourly)
  - **API**: 8 routes via `GoogleSheetSyncController` — OAuth + Table-level connect/disconnect/status/export
  - **Hook**: `ResponseController::store` dispatch EnqueueRowJob setelah transaction commit; `Response::deleting` observer untuk delete sync
  - **Frontend**: Types di `@cerdas/types`, `GoogleSheetApi.ts`, composable `useGoogleSheetSync.ts`, komponen `TableSheetSyncPanel.vue` (6 UI states), tab "Sync" di sub-tab bar EditorTabContent, static `oauth-callback.html` untuk postMessage OAuth flow
  - **Pending**: `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URI` perlu diisi di `.env` sebelum bisa test end-to-end. `GOOGLE_REDIRECT_URI` harus mengarah ke `{EDITOR_URL}/oauth-callback.html` dan didaftarkan di GCP Console.
- **2026-07-19**: E2E Testing & Bugfixes Google Sheet Sync MVP Selesai:
  - **Table Model Fix**: Tambah `$table = 'google_oauth_tokens'` eksplisit di model `GoogleOAuthToken` untuk mencegah mismatch auto-infer Laravel `google_o_auth_tokens`.
  - **Worker Queue Flag**: Tambah `--queue=default,sheets-enqueue,sheets-batch` di `docker-compose.dev.yml` dan `docker-compose.prod.yml` agar queue worker mendengarkan job sinkronisasi Google Sheet.
  - **Field Mapping Fix**: `GoogleSheetColumnMapper` diperbarui menggunakan `$field['name'] ?? $field['key']` agar cocok dengan JSON data Cerdas, dan men-skip elemen UI layout murni (`separator`, `html_block`).
  - **Clean Re-Sync**: `GoogleSheetsService::bulkWriteRows` diperbarui memanggil `clearValues('A2:ZZ10000')` sebelum menimpa data, menjamin Sheet selalu 1-to-1 mirror tanpa duplikasi baris.
  - **Media Absolute URL**: Path media seperti `/storage/responses/...` dikonversi menjadi Full Clickable URL `http://.../media/responses/...` di Google Sheet.
  - **Auto-Delete Observer**: Observer `static::deleting` dipasang pada Model `Assignment.php` & `GoogleSheetEnqueueRowJob` diperbarui dengan `withTrashed()`, sehingga tombol Delete di UI Data & Monitoring otomatis menghapus baris di Google Sheet via background worker (~30s).
  - **Metadata Status & Enumerator**: Menambahkan kolom `Status` (`In Progress`, `Submitted`, `Approved`, `Rejected`) dan `Enumerator` di kolom metadata depan Google Sheet.
- **2026-07-19**: Pengayaan Audit Trail, CSV Template Generator, & Standardisasi Header:
  - **Status History Audit Log**: Menambahkan kolom `Status History` di Google Sheet Sync & Database (`status_history` JSON column) mencatat riwayat transisi status, ISO UTC timestamp, dan email petugas secara lengkap.
  - **Initial Status Event**: Event `static::creating` di Model `Assignment` merekam entri pertama `In Progress` secara otomatis.
  - **Download CSV Template Button**: Menambahkan tombol `Download CSV Template` di UI `CsvImportPopup.vue` menggunakan File System Access API (`showSaveFilePicker`) untuk mengunduh template CSV berformat UTF-8 BOM secara instant berdasarkan field kuesioner aktif.
  - **Idempotent Import Engine**: `PrelistImport.php` diperbarui dengan UPSERT (`updateOrCreate`) berbasis `table_id` dan fallback natural ID keys (`external_id`, `id_rumah`, `ID_rumah`, `id_kk`), menjamin pengimporan berulang-kali bebas duplikasi data.
  - **Standardized Header Names**: Standardisasi nama kolom Google Sheet Sync menggunakan `field.name` (`Nama_RT`, `ID_rumah`, `kepala_keluarga_list.nama`) agar 100% simetris dengan CSV Template & siap untuk 2-Way Sync.
