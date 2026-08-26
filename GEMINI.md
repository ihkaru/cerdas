# Workspace Rules & Comprehensive Context for Antigravity Agent

> **CRITICAL**: Always read `docs/architecture_principles.md` before any implementation work.

## Project Overview
**Cerdas** adalah AppSheet clone - self-hosted, offline-first, no-code/low-code app builder untuk pengumpulan data survey lapangan (data collection & field management).

## Active Version & Status
* **Version**: 0.2.49 (Latest Release — GitHub tag `v0.2.49`, APK: `cerdas-v0.2.49.apk`)
* **Core Functionalities**: Offline SQLite storage, reactive JavaScript form closures, multi-modal deck/map/table views, Google Sheets bidirectional sync with hierarchical sub-tab lineage.
* ⚠️ **Versioning Rule**: `package.json` version number must NEVER be edited manually. Release Please is the sole authority for version bumping. See `docs/VERSIONING_SOP.md`.

---

## Core Technical Stack
* **Backend API**: Laravel 12 (PURE API only - no Blade views, no Filament, Sanctum Auth)
* **Client App**: Framework7 v9 + Vue 3 + TypeScript (`<script setup lang="ts">`) for field enumerators / PWA / Android APK
* **Editor App**: Framework7 v9 + Vue 3 + TypeScript (`<script setup lang="ts">`) for admins / schema builders
* **Form & Expression Engines**:
  - `packages/form-engine`: FormRenderer, FieldRenderer, 16 field components, ClosureCompiler (`new Function('ctx', 'row', 'utils', body)`)
  - `packages/expression-engine`: Sandboxed formula evaluator
  - `packages/types`: Shared strict TypeScript contracts (`@cerdas/types`)
* **Offline Storage**: `@capacitor-community/sqlite` on native Android; `sql.js` + `IndexedDB` on Web
* **Database**: MySQL (multi-tenant shared DB)
* **Sync Layer**: Real-time Google Sheets 2-Way Sync Engine via micro-batch queue workers

---

## Monorepo Structure
```bash
apps/backend        - Laravel 12 + Sanctum API
apps/client         - Framework7 + Vue 3 (data collection PWA/APK)
apps/editor         - Framework7 + Vue 3 (visual form/view/navigation builder)
packages/types      - @cerdas/types (shared strict TS types)
packages/form-engine - @cerdas/form-engine (FormRenderer, Field components, Closures)
packages/expression-engine - @cerdas/expression-engine (expression evaluation)
```

---

## User Persona & Standing Operating Rules (SOP)
1. **User Persona**: User is Product Manager, AI is Senior Fullstack Developer + System Architect.
2. **Communication**: Prefer Indonesian language for conversations and explanations.
3. **TypeScript Strict Mode**: Strict Mode is MANDATORY across all packages and apps (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`). Never disable types or cast to `any` unless absolutely unavoidable; fix type errors properly.
4. **Verification & Quality Assurance (Linting)**:
   - **Always run linting after modifying code**: Whenever source code files in `apps/` or `packages/` are modified, always run `pnpm lint` (or `pnpm --filter <app> lint` / `npx eslint <modified_files>`) to verify that no linting errors or broken rules were introduced.
5. **Non-destructive File Creation**: Before creating a new file, verify whether a file with that name or purpose already exists. If it exists, read its content and align rather than blindly overwriting.
6. **No Browser Tool**: NEVER use browser tools. The user will verify UI and browser behavior manually.
7. **Framework7 Theming & Double-Spacing Bugs**:
   - Follow `docs/framework7_vue_theming_best_practices.md` for custom theming and device notches.
   - Use inline styles with `!important` on `<f7-page-content>` to override Framework7 page content double-spacing bugs where needed.
8. **Version Single Source of Truth**: NEVER hardcode version strings in Vue templates. Use `__APP_VERSION__` injected by Vite.
9. **Versioning Discipline — CRITICAL**: NEVER manually edit `package.json` version number. Release Please is the sole authority.
10. **"Bump Version" / "Naikan Versi" Protocol**:
    - Step 1: Ensure all commits are pushed to `main` with conventional commit format (`feat:`, `fix:`, `chore:`, etc.).
    - Step 2: Find open Release Please PR → `GITHUB_TOKEN="" gh pr list --repo ihkaru/cerdas --label "autorelease: pending"`
    - Step 3: Merge PR → `GITHUB_TOKEN="" gh pr merge <NUMBER> --merge --repo ihkaru/cerdas`
    - Step 4: Monitor GitHub Actions → `GITHUB_TOKEN="" gh run list --repo ihkaru/cerdas --limit 8`
    - Step 5: Confirm APK release → `GITHUB_TOKEN="" gh release view --repo ihkaru/cerdas`
11. **UI Flow Documentation**: Always update `references/SCREEN_FLOW.md` when changing/fixing UI navigation, routing, or screen states.

---

## Critical Architecture Decisions (Epistemic Foundation)
1. **Context Object Pattern**: Use `AppContext` for dependency injection in the service layer (`api`, `router`, `db`, `currentUser`, `notify`).
2. **UI per-app**: No shared UI components across client and editor; each app maintains its own specialized UI components.
3. **Schema Versioning**: Published table versions are IMMUTABLE.
4. **Validation & Closure Engine**:
   - All logic closures (`show_if_fn`, `editable_if_fn`, `required_if_fn`, `formula_fn`, `initial_value_fn`, `options_fn`, `validation_js`, `warning_fn`) are compiled client-side via `new Function('ctx', 'row', 'utils', body)`.
   - Closures have access to typed context:
     - `row`: current form row values
     - `value`: current field value (in validations/warnings)
     - `ctx.user`: `{ id, name, email, role, organizationId }`
     - `ctx.assignment`: `{ id, status, prelist_data, organization_id }`
     - `ctx.index` / `ctx.rowIndex`: current nested row index
     - `ctx.parent` / `ctx.parentRow`: parent form row
     - `ctx.parents`: all ancestor records
     - `ctx.allRows` / `ctx.items`: sibling records
     - `ctx.utils` (and `utils`): `now()`, `today()`, `uuid()`, `sum(arr, key?)`, `daysSince(dateStr)`, `log(...args)`
5. **Sync Strategy**: Last-write-wins with Google Sheets micro-batch staging table (`pending_sheet_rows`) and idempotent `parent_response_id` lineage.

---

## Dual Android Development Modes
* **Mode 1: Local Backend**: `./scripts/start-android-local.ps1` (Backend at `http://10.0.2.2:9980/api`)
* **Mode 2: Remote Backend**: `./scripts/start-android-remote.ps1` (Backend at remote staging)

---

## Key Reference Documents
* `docs/architecture_principles.md` - Technical principles (**READ FIRST**)
* `docs/DEVELOPMENT_LIFECYCLE.md` - Start/stop, coding loop, and Release/Versioning SOP
* `docs/WORKFLOW_AND_DEBUGGING.md` - Debugging workflow, CI/CD, and local verification (`verify-local.ps1`)
* `docs/TERMINOLOGY_DISAMBIGUATION.md` - Canonical naming conventions (SSOT)
* `docs/STATUS_FLOWS.md` - Assignment status state machine
* `docs/FORM_EDITOR_WORKFLOW.md` - Detailed workflow for visual form/view editor
* `docs/framework7_vue_theming_best_practices.md` - F7 theming, notch handling, spacing fixes
* `docs/VERSIONING_SOP.md` - Release Please + package.json sync rules
* `docs/ANDROID_BUILD_GUIDE.md` - Android build, signing, and APK release guide
* `docs/COOLIFY_GUIDE.md` - Production deployment guide (Coolify + Docker)
* `docs/DOCKER_DEV.md` - Local development with Docker backend
* `references/SCREEN_FLOW.md` - Screen Flow & Routing Guide
* `ROADMAP.md` - Feature Roadmap

---

## Progress Log
- **2026-07-19**: Implementasi Google Sheet Sync MVP (DB → Sheet, Opsi B: App-Level Token Owner). Semua komponen selesai:
  - **DB**: Migration `google_oauth_tokens` + `pending_sheet_rows` (micro-batch staging table)
  - **Models**: `GoogleOAuthToken` (encrypted tokens) + `PendingSheetRow`
  - **Services**: `GoogleOAuthService` + `GoogleSheetColumnMapper` + `GoogleSheetsService` (dengan exponential backoff)
  - **Jobs**: `GoogleSheetEnqueueRowJob` (lightweight, no API call) + `GoogleSheetBatchFlushJob` (tiap 30s, 1 batchUpdate/spreadsheet) + `GoogleSheetInitialExportJob` + `GoogleSheetTokenRefreshJob` (hourly)
  - **API**: 8 routes via `GoogleSheetSyncController` — OAuth + Table-level connect/disconnect/status/export
  - **Hook**: `ResponseController::store` dispatch EnqueueRowJob setelah transaction commit; `Response::deleting` observer untuk delete sync
  - **Frontend**: Types di `@cerdas/types`, `GoogleSheetApi.ts`, composable `useGoogleSheetSync.ts`, komponen `TableSheetSyncPanel.vue` (6 UI states), tab "Sync" di sub-tab bar EditorTabContent, static `oauth-callback.html` untuk postMessage OAuth flow
- **2026-07-19**: E2E Testing & Bugfixes Google Sheet Sync MVP Selesai:
  - **Table Model Fix**: Tambah `$table = 'google_oauth_tokens'` eksplisit di model `GoogleOAuthToken`.
  - **Worker Queue Flag**: Tambah `--queue=default,sheets-enqueue,sheets-batch` di `docker-compose.dev.yml` dan `docker-compose.prod.yml`.
  - **Field Mapping Fix**: `GoogleSheetColumnMapper` diperbarui menggunakan `$field['name'] ?? $field['key']`.
  - **Clean Re-Sync**: `GoogleSheetsService::bulkWriteRows` memanggil `clearValues('A2:ZZ10000')` sebelum menimpa data.
  - **Media Absolute URL**: Path media seperti `/storage/responses/...` dikonversi menjadi Full Clickable URL.
  - **Auto-Delete Observer**: Observer `static::deleting` pada Model `Assignment.php` menghapus baris di Google Sheet.
  - **Metadata Status & Enumerator**: Menambahkan kolom `Status` dan `Enumerator` di kolom depan Google Sheet.
- **2026-07-19**: Pengayaan Audit Trail, CSV Template Generator, & Standardisasi Header:
  - **Status History Audit Log**: Kolom `Status History` di Google Sheet Sync & Database (`status_history` JSON column).
  - **Initial Status Event**: Event `static::creating` merekam entri pertama `In Progress` otomatis.
  - **Download CSV Template Button**: Tombol `Download CSV Template` di UI `CsvImportPopup.vue`.
  - **Idempotent Import Engine**: `PrelistImport.php` dengan UPSERT (`updateOrCreate`) berbasis `table_id` dan natural ID keys.
  - **Standardized Header Names**: Standardisasi nama kolom Google Sheet Sync menggunakan `field.name`.
- **2026-07-19**: Dukungan Sinkronisasi Bertingkat (Recursive Multi-Level Nested Forms):
  - **Recursive Traversal**: `collectNestedRowsForPath` dan `enqueueNestedItems` untuk N-Level Deeply Nested Forms.
  - **Hierarchical Lineage ID**: ID unik `child_response_id` (`parentUuid_nestedKey_index_subKey_index`).
  - **Dot Notation Path Resolution**: `GoogleSheetColumnMapper` menyelesaikan path nested dengan dot notation.
  - **Idempotent Nested Updates**: Antrean `delete` berbasis `parent_response_id` sebelum batch `upsert` pada nested tab.
- **2026-08-26**: Upgrade Komprehensif AI Context Engine & Tombol AI Prompt Generator:
  - **Super-Context v4.0**: Memperbarui `generateAIPrompt.ts` dengan Technical Manual lengkap (16 tipe field, kontrak 8 closure, Google Sheet multi-tab sync, 7 production blueprints Sambora).
  - **SOP & Workspace Memory**: Menyelaraskan `GEMINI.md`, `gemini.md`, `.agents/AGENTS.md`, dan `.agent/AGENTS.md`.

