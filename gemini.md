# Cerdas Project - Agent Memory

> **CRITICAL**: Always read `docs/architecture_principles.md` before any implementation work.


## Project Overview

Cerdas adalah AppSheet clone - self-hosted, offline-first, no-code app builder untuk data collection.



## Core Technical Stack

- **Backend**: Laravel 12 (PURE API only - no Blade, no Filament)

- **Client App**: Framework7 v9 + Vue 3 + TypeScript (script setup)
- **Editor App**: Framework7 v9 + Vue 3 + TypeScript (script setup)  
- **Offline Storage**: capacitor-community/sqlite
- **Database**: MySQL (multi-tenant, shared DB)
- **Auth**: Laravel Sanctum


## Critical Architecture Decisions

1. **TypeScript Strict Mode**: MANDATORY - never disable, fix errors instead

2. **Context Object Pattern**: Use `AppContext` for DI in service layer
3. **UI per-app**: No shared UI package - client and editor have own components
4. **Schema Versioning**: Published versions are IMMUTABLE, responses tied to schema_version_id
5. **Validation Engine**: JavaScript closures executed CLIENT-SIDE (offline-capable)
6. **Sync Strategy**: Last-write-wins for conflict resolution
7. **Version Single Source of Truth**: MANDATORY - Never hardcode version strings in Vue templates or components. ALWAYS use __APP_VERSION__ injected dynamically by Vite from package.json.

## Multi-Tenant Hierarchy (Updated 2026-01-20)

**Organization** adalah entitas GLOBAL. Satu Org bisa di banyak App.

```
Organization (Global) ←→ App (via app_organizations pivot)
    │                      │
    └── AppMembership ─────┘ (User + Role per App+Org)
                           │
                      ┌────┴────┐
                      ↓         ↓
                   Form       View
                      │
                 Assignment (form_id, org_id)
```

**App Modes:**
- **Simple**: Membership di level App, 1 Default Org otomatis.
- **Complex**: Membership di level Organization, multiple Orgs.

Users can have DIFFERENT roles in different App+Org combinations.


## Monorepo Structure

```bash

apps/backend    - Laravel 12 + Sanctum
apps/client     - Framework7 + Vue 3 (data collection)
apps/editor     - Framework7 + Vue 3 (form builder)
packages/types  - @cerdas/types (shared strict TS types)
```


## Key Principles to Remember

1. **Boundaries are King**: Strict props/emits typing

2. **Avoid `any`**: Use `unknown` + narrowing
3. **Discriminated Unions**: For request state (idle/loading/success/error)
4. **Type API Responses**: Always define interfaces
5. **Modular Vue Structure**: `src/app/[module]/` with own routes, components
6. **Context Pattern**: Inject deps via `ctx` object, not argument drilling
7. **Utility Types**: Prefer `type-fest` for cleaner, stricter types (Except, Merge, etc) over manual helpers

## Reference Documents
- `docs/architecture_principles.md` - Full technical principles
- `docs/implementation_plan.md` - Phase-by-phase plan
- `docs/task.md` - Current progress tracker
- `docs/DEVELOPMENT_LIFECYCLE.md` - **Development feedback loop & workflow**
- `references/SCREEN_FLOW.md` - **User Screen Flow & Routing Guide (Happy/Unhappy Paths)**
- `ROADMAP.md` - **Feature Roadmap & Progress Tracker (Live Status)**
- **System Reference & Specification** (External specification) - **Single Source of Truth** for Requirements, Features, and Entity Relationships.

### Process Management Scripts (scripts/)
- `scripts/start-all.bat`: Starts Backend (8080), Client (9981), Editor (9982).
- `scripts/stop-all.bat`: **Surgical Stop**. Kills only Cerdas windows & processes. Safe to use.
- `scripts/restart-android.bat`: Restarts Android App & captures logs.
- `scripts/save-android-log.bat`: Captures current Android logs to `logs/`.

- **Map View Fixes (2026-02-15)**:
  - **Dynamic Popups**: Fixed "Buka Detail" button to use canonical `/assignments/:id` route, resolving the "View not found" error.
  - **Styling**: Enforced white text/icons on popup buttons to override default blue link styles.
  - **UX**: Aligned "Get Directions" icon/color with `GpsField.vue` standards.
  - **Navigation**: Implemented delegated click handling for F7 router compatibility in map popups.
- **Excel Import & Stability**: 
    - Reduced batch size and implemented recursive retry splitting logic in `ImportExcelJob.php`.
    - Added comprehensive GPS coordinate string parsing support in `geoUtils.ts` and `GpsField.vue`.
    - Fixed several strict `pre-push` style and type blockers.
- **Final Push**: Successfully pushed all verified code fixes to GitHub while excluding large CSV test files.
- **Excel Import (Recent)**:
  - Enhanced `ExcelImportModal` and backend `ExcelImportController` for more robust data handling (matching modified files).
- **App Hierarchy & UX (2026-02-17)**:
  - **Refactor**: `AppShell` now supports multi-table Apps via dynamic `resolvedTableId` switching based on `activeView` (View -> Form ID).
  - **Editor UX**: Added Breadcrumbs (`App Name / Table Name`) to `EditorHeader.vue` for better context.
  - **Map Optimization**:
      - Enabled Clustering (`cluster: true`, minPoints: 30) in `MapView.vue`.
      - **Async Rendering Engine**: Implemented chunked GeoJSON building with `setTimeout(0)` and `AbortController` to prevent ANR on Android (30k+ items).
      - **Memory Fix**: Used `shallowRef` for assignments and `toRaw` for map data to bypass Vue's deep reactivity, resolving OOM crashes.

- **Version**: 0.2.33 (Automated Release via Release-Please Merge)

- **Automated Release Verification (2026-07-18)**:
  - **Pipeline Automation**: Memverifikasi jalur integrasi rilis otomatis dengan me-merge Pull Request rilis resmi `#85` dari GitHub Release Please, yang secara otomatis memicu tag versi, pembuatan GitHub Release, dan build/upload APK secara terintegrasi penuh tanpa intervensi manual.

- **Version**: 0.2.32 (Dynamic APK Download Link Resolution & Version SSOT Sync)

- **Dynamic APK Download Resolution (2026-07-18)**:
  - **Dynamic Link**: Memperbaiki `ApkDownloadCard.vue` agar menghitung `downloadUrl` secara dinamis sesuai `latestVersion` untuk mencegah tautan mengarah ke rilis APK lama dari payload cache.
  - **Version Sync**: Menyinkronkan seluruh single source of truth versi di `package.json` root, client, editor, manifest, dan version.json ke `0.2.32`.

- **Version**: 0.2.31 (Null-Safe Assignment Deletion & PHP Array Method Fix)

- **Null-Safe Assignment Deletion (2026-07-18)**:
  - **Array Method Fix**: Memperbaiki `AssignmentController::destroy` di backend yang memanggil method `contains()` pada hasAppAccess logic.
  - **Null Relations & Cascade Cleanup**: Mengosongkan `parent_response_id` di response sebelum menghapus penugasan untuk mencegah error constraint database.

- **Version**: 0.2.30 (Editor Code Apply Navigation Sync & SQLite Soft-Delete Tombstone Fix)

- **Editor Code Apply & Navigation Sync (2026-07-18)**:
  - **Code Apply Sync**: Memperbaiki `CodeEditorTab.vue` dan `useEditorHandlers.ts` agar saat tombol "Apply Changes" ditekan di tab Code Editor, `navigation` dan `views` (view_configs) dari JSON langsung memperbarui state visual UI Editor dan tersimpan ke backend API secara end-to-end.
  - **SQLite Soft-Delete Tombstones**: Memperbaiki `AssignmentSyncHelpers.ts` di Client App agar data yang di-soft delete (`deleted_at != null`) di server/Editor otomatis dieksekusi `DELETE FROM assignments` & `DELETE FROM responses` di SQLite lokal saat user menekan Refresh/Sync.

- **Version**: 0.2.29 (Data Scrubbing, Required-If, UX Hints & Relocated Example App Schema)

- **Example App Relocation & Data Scrubbing (2026-07-18)**:
  - **Relocate Schema**: Memindahkan file `docs/kuesioner_sambora_app_schema.json` ke `examples/kuesioner-sambora/schema.json` agar terpisah dari platform code dan tidak memicu bump version platform.
  - **Visibility-Based Data Scrubbing**: Mengintegrasikan `getScrubbedData()` di `FormRenderer.vue` dan `useAssignmentSave.ts` untuk membersihkan field tersembunyi (`show_if=false`) sebelum disimpan.
  - **Kuesioner UX & Validasi**: Menambahkan `required_if_fn` pada field turunan suku/agama, mengubah sampah ke multi-select checkbox, dan menyematkan 17 hint text standar ODK/KoBoToolbox.

- **Version**: 0.2.28 (Pusat Unduhan APK & Auto-GitHub Sync)

- **Pusat Unduhan APK & Auto-GitHub Sync (2026-07-18)**:
  - **Auto-GitHub Sync**: Menambahkan perintah artisan `php artisan apk:sync-version` untuk mengambil metadata rilis APK terbaru dari GitHub Releases secara dinamis ke database `system_settings` pada saat inisialisasi kontainer.
  - **Public Download Redirect**: Menyediakan endpoint API `/api/apk/latest-info` dan `/api/apk/latest/download` yang melakukan redirect otomatis ke link unduhan APK aktual.
  - **Premium Dashboard Card**: Menambahkan widget `ApkDownloadCard.vue` di dashboard client app yang secara reaktif mendeteksi ketidakcocokan versi dan memberikan tombol unduhan yang berestetika tinggi (glassmorphism & pulse animation).

- **Version**: 0.2.27 (Null-Safe Assignment Deletion & Try-Catch Log Protection)

- **Null-Safe Assignment Deletion (2026-07-17)**:
  - **Null-Safe Relation Traversal**: Memperbaiki `AssignmentController::destroy` agar secara aman membaca `$assignment->tableVersion?->table?->app ?? $assignment->table?->app` untuk mencegah fatal PHP Error `Attempt to read property "table" on null` saat `tableVersion` bernilai null.
  - **Exception Protection**: Menambahkan blok `try/catch` komprehensif dengan logging trace yang mendalam agar memberikan pesan error terstruktur jika ada kegagalan saat proses penghapusan.

- **Version**: 0.2.26 (Seamless Join UX, Post-Login Token Handoff & Joined Members Management)

- **Seamless Join UX & Post-Login Token Handoff (2026-07-17)**:
  - **ApiClient 401 Bypass**: Mencegah redirect paksa ke `/login` ketika user membuka halaman publik `/join/:token` dengan token sesi lama yang kedaluwarsa.
  - **Immediate Join Token Persistence**: Mengamankan `pending_join_token` ke `localStorage` begitu user mendarat di `JoinPage.vue`.
  - **Post-Login Handoff**: `Login.vue` secara otomatis membaca `pending_join_token` setelah login (Google / Email) berhasil dan mengarahkan user kembali ke halaman konfirmasi join.
  - **Editor Joined Members UI**: Menambahkan panel visual `Joined Members & Surveyors` pada `AppSettingsPanel.vue` di Editor App untuk melihat seluruh enumerator/supervisor yang sudah bergabung serta fitur pencabutan akses (`Remove Member`).

- **Version**: 0.2.11 (Interactive URL / Hyperlink & Anti-Cache Sync)

- **Anti-Cache Sync Fix (2026-07-17)**:
  - **Global Header**: Menambahkan header `'Cache-Control': 'no-cache'`, `'Pragma': 'no-cache'`, dan `'Expires': '0'` di `ApiClient.ts`.
  - **Timestamp Cache-Buster**: Menyematkan query param `_t: Date.now()` otomatis pada seluruh API `GET` request agar bypass Cloudflare/Nginx/Browser cache di production.


- **URL / Hyperlink Field Type (2026-07-17)**:
  - **Tipe Data Terpusat**: Menambahkan `'url'` ke daftar `FieldType` global di `@cerdas/types`.
  - **UrlField.vue (NEW)**: Komponen input URL khusus di `@cerdas/form-engine` dengan fitur:
    - **Mode Edit**: `<input type="url">` dengan asisten `📋 Tempel` clipboard cepat dan tombol `↗ Tes Tautan` verifikasi tautan.
    - **Mode Read-Only**: Blok tombol tautan berikon yang bersih dengan dukungan `config.display_label` kustom untuk menyembunyikan URL panjang.
  - **Editor App Integration**: Mendaftarkan tipe data `'url'` di `FIELD_TYPE_META` editor agar muncul di dropdown tipe kolom Schema Editor.


- **UX Post-Import "Aha Moment" (2026-07-17)**:
- User is Product Manager, I am fullstack developer + system architect
- User gives standing permission for necessary actions
- User wants strict TypeScript to catch errors early
- Update gemini.md with important changes/progress
- **FRAMEWORK7 VUE THEMING RULE**: Always follow [docs/framework7_vue_theming_best_practices.md](file:///home/ihza/Projects/cerdas/docs/framework7_vue_theming_best_practices.md) when designing custom themes, managing layout spacing offsets, or handling device notches. Use inline styles with `!important` on `<f7-page-content>` to safely override double-spacing bugs, and override standard F7 CSS variables in `:root` inside `style.css` for dynamic theme changes.
- **CRITICAL UI DOCUMENTATION RULE**: Whenever developing, changing, or fixing UI navigation, routing, or screen states, I MUST ALWAYS update the `references/SCREEN_FLOW.md` document (including adding/updating Mermaid diagrams if relevant) to ensure it stays as the single source of truth across all future sessions.
- **BROWSER TOOL USAGE**: NEVER use browser tool for ANY reason. User will verify manually. I am an agent for writing logic and code, not for clicking.
- **CRITICAL VERSION RULE**: Always update the project version (currently 0.1.0) in `README.md`, `package.json`, and `composer.json` whenever significant progress is made (equivalent to a "push").

## ClosureContext (App-Wide Context) - Updated 2026-01-20

Form closures now have access to typed user context:

```typescript
// In closures (validation_js, showIf, etc):
ctx.user.id           // number
ctx.user.email        // string
ctx.user.name         // string
ctx.user.role         // 'app_admin' | 'org_admin' | 'supervisor' | 'enumerator'
ctx.user.organizationId // number | null

ctx.assignment.id     // string | number
ctx.assignment.status // string
ctx.assignment.organization_id // number

ctx.utils.today()     // 'YYYY-MM-DD'
ctx.utils.now()       // ISO datetime
ctx.utils.daysSince('2026-01-01') // number
```

**Files Updated:**
- `packages/form-engine/src/utils/ClosureCompiler.ts` - Typed ClosureContext
- `apps/client/src/common/stores/authStore.ts` - User interface with role/org
- `apps/client/src/pages/AssignmentDetail.vue` - Pass userContext to FormRenderer

## Framework7 v9 + TypeScript Setup Notes
F7 Vue has incomplete TypeScript declarations. Required shims:

```typescript
// src/types/framework7-vue.d.ts
declare module 'framework7-vue/bundle' {
  export * from 'framework7-vue';
  export function registerComponents(app: App): void;
}

// src/types/css.d.ts
declare module 'framework7/css/bundle' {}
```

Key imports:
- Routes type: `Router.RouteParameters` from `framework7/types`
- App params: `Framework7Parameters` from `framework7/types`
- registerComponents: from `framework7-vue/bundle`

## Android Development Setup (2026-01-14)

### Configuration Complete
- **Min SDK**: Android 10 (API 29)
- **Target SDK**: API 36
- **Live Reload**: Enabled via `capacitor.config.ts`

### Key Files Modified
- `capacitor.config.ts`: Live Reload pointing to `10.0.2.2:9981`
- `variables.gradle`: `minSdkVersion = 29`
- `AndroidManifest.xml`: Network security config added
- `network_security_config.xml`: Allow HTTP to dev servers

### Verified Working Configuration (2026-01-14 11:46)
- **AGP**: 8.3.2 (compatible with Android Studio)
- **Gradle JDK**: 21 (Temurin)
- **compileSdkVersion**: 35 (for Capacitor VANILLA_ICE_CREAM constant)
- **minSdkVersion**: 29 (Android 10 - production target)
- **targetSdkVersion**: 34
- **Test AVD**: Pixel 5 API 30 (needs WebView 83+ for modern JS)

### Development Workflow
1. Run `start-all.bat` (starts backend:9980, client:9981, editor:9982)
2. Open Android Studio: `npx cap open android`
3. Run on emulator (use API 30+ for dev, app works on API 29+ in production)
4. Edit code → Auto-refresh in emulator!
5. Save logs: `.\save-android-log.bat` → logs saved to `logs/android.log`

### Dual Android Dev Modus (New 2026-02-12)

**Mode 1: Local Backend** (Standard)
```powershell
./scripts/start-android-local.ps1
```
- Backend: `http://10.0.2.2:8080/api` (Localhost)
- Database: Local MySQL
- Use for: Full-stack features, backend changes.

**Mode 2: Remote Backend** (UI Only)
```powershell
./scripts/start-android-remote.ps1
```
- Backend: `https://api.dvlpid.my.id/api` (Production)
- Database: Production DB
- Use for: UI/UX tweaks, verifying prod data.

> [!TIP]
> Both scripts automatically start `Pixel_5_API_30` emulator if no device is found! 🚀

> [!NOTE]
> **Caddyfile Conflict**: `apps/backend/Caddyfile` contained absolute Windows paths, causing 404s in Docker. Renamed to `Caddyfile.local` to let Octane use default config.

> [!IMPORTANT]
> **Production Fix**: `Dockerfile.prod` updated to install `curl`. This is required for `docker-compose.prod.yml` healthchecks. Without it, Coolify/Docker reports `502 Bad Gateway` (Unhealthy).

> [!NOTE]
> **CORS Bypass**: `CapacitorHttp` is enabled in `capacitor.config.ts`. This forces all API calls to go through the native layer, bypassing WebView CORS restrictions. This is critical for Mode 2 (Remote Backend).

See `.agent/workflows/android-local.md` and `android-remote.md`.

### Important IPs (Android Emulator)
- `10.0.2.2` → Host machine (your PC)
- `127.0.0.1` → Emulator itself (NOT your PC!)

### Android Debugging Feedback Loop (CRITICAL)
**Use these commands to debug Android without manual interaction:**

```powershell
# Quick: Restart app + capture log
.\restart-android.bat

# Manual commands:
adb shell am force-stop com.cerdas.client && adb shell am start -n com.cerdas.client/.MainActivity
adb logcat -d *:S Capacitor/Console:* > logs\android.log
```

Logs saved to: `logs/android.log` → I can read this file directly for debugging!
## Reference Documents
- `docs/architecture_principles.md` - Full technical principles
- `docs/implementation_plan.md` - Phase-by-phase plan
- `docs/task.md` - Current progress tracker
- `docs/DEVELOPMENT_LIFECYCLE.md` - **Development feedback loop & workflow**
- `references/SCREEN_FLOW.md` - **User Screen Flow & Routing Guide (Happy/Unhappy Paths)**
- `ROADMAP.md` - **Feature Roadmap & Progress Tracker (Live Status)**
- **System Reference & Specification** (External specification) - **Single Source of Truth** for Requirements, Features, and Entity Relationships.

### Process Management Scripts (scripts/)
- `scripts/start-all.bat`: Starts Backend (8080), Client (9981), Editor (9982).
- `scripts/stop-all.bat`: **Surgical Stop**. Kills only Cerdas windows & processes. Safe to use.
- `scripts/restart-android.bat`: Restarts Android App & captures logs.
- `scripts/save-android-log.bat`: Captures current Android logs to `logs/`.

- **Map View Fixes (2026-02-15)**:
  - **Dynamic Popups**: Fixed "Buka Detail" button to use canonical `/assignments/:id` route, resolving the "View not found" error.
  - **Styling**: Enforced white text/icons on popup buttons to override default blue link styles.
  - **UX**: Aligned "Get Directions" icon/color with `GpsField.vue` standards.
  - **Navigation**: Implemented delegated click handling for F7 router compatibility in map popups.
- **Excel Import & Stability**: 
    - Reduced batch size and implemented recursive retry splitting logic in `ImportExcelJob.php`.
    - Added comprehensive GPS coordinate string parsing support in `geoUtils.ts` and `GpsField.vue`.
    - Fixed several strict `pre-push` style and type blockers.
- **Final Push**: Successfully pushed all verified code fixes to GitHub while excluding large CSV test files.
- **Excel Import (Recent)**:
  - Enhanced `ExcelImportModal` and backend `ExcelImportController` for more robust data handling (matching modified files).
- **App Hierarchy & UX (2026-02-17)**:
  - **Refactor**: `AppShell` now supports multi-table Apps via dynamic `resolvedTableId` switching based on `activeView` (View -> Form ID).
  - **Editor UX**: Added Breadcrumbs (`App Name / Table Name`) to `EditorHeader.vue` for better context.
  - **Map Optimization**:
      - Enabled Clustering (`cluster: true`, minPoints: 30) in `MapView.vue`.
      - **Async Rendering Engine**: Implemented chunked GeoJSON building with `setTimeout(0)` and `AbortController` to prevent ANR on Android (30k+ items).
      - **Memory Fix**: Used `shallowRef` for assignments and `toRaw` for map data to bypass Vue's deep reactivity, resolving OOM crashes.

- **Version**: 0.2.24 (Zero Hardcoded Ports & Dynamic Origin API Fallback for Coolify / Docker)

- **Dynamic Origin API Fallback (2026-07-17)**:
  - **Dynamic Base URL**: Refactored `ApiClient.ts` di Client App dan Editor App untuk menggunakan `window.location.origin + '/api'` secara otomatis sebagai fallback dinamis jika tidak ada environment variable yang diset.
  - **Zero Hardcoded Fallbacks**: Menghapus seluruh fallback hardcoded `http://localhost:8080/api` dari `ApiClient.ts`, `SubmissionsPanel.vue`, `LivePreview.vue`, dan `.env.local` agar aplikasi aman dan siap dideploy secara fleksibel di environment Docker / Coolify tanpa konflik port.
  - **Helper Export**: Mengekspor `getApiBaseUrl()` dari Editor `ApiClient.ts` sebagai single source of truth resolusi URL API.

- **Version**: 0.2.23 (Automated Backend Port Conflict Detection)

- **Automated Backend Port Conflict Detection (2026-07-17)**:
  - **Conflict Detector**: Menambahkan logika pemeriksaan konflik port otomatis di `HealthCheckService.ts`. Jika client mendeteksi kedua backend Host (`8080`) dan Docker (`9980`) aktif bersamaan saat local development, client akan menampilkan Framework7 dialog alert untuk memperingatkan developer.
  - **Surgical Process Terminate**: Mematikan dan memverifikasi port `8080` host secara tuntas sehingga client hanya berinteraksi secara eksklusif dengan database Docker (`9980`).

- **Version**: 0.2.22 (Local Dev Precedence & Robust SQLite Merge)

- **Local Dev Precedence & Robust SQLite Merge (2026-07-17)**:
  - **Precedence Fix**: Mengubah urutan pembacaan API URL di `ApiClient.ts` agar memprioritaskan `VITE_API_URL` daripada `VITE_API_BASE_URL`. Ini memulihkan fungsi file `.env.local` untuk mengarahkan client & editor ke port local host dev (`8080`) secara sukses alih-alih tertahan di port Docker (`9980`).
  - **Robust Settings Merge**: Meningkatkan fungsi penggabungan settings di `TableSyncHelpers.ts` (`cacheAndSaveTable`) agar menggabungkan data layout settings dan table settings secara kokoh. Jika settings dari API terisi sebagian namun tidak memiliki key `actions`, logic ini menjamin key `actions` dari layout settings tetap diselamatkan.
  - **Docker Rebuild**: Membangun kembali container backend lokal untuk menyinkronkan kode `DashboardController` terbaru.
  - **Local Seeding**: Menambahkan script seeding lokal agar skema Kuesioner Sambora Mempawah ter-seed secara benar di database host lokal (`8080`).

- **Version**: 0.2.21 (FAB Final Fix — cacheAndSaveTable Empty Object Bug)

- **FAB Final Fix — cacheAndSaveTable Empty Object Bug (2026-07-17)**:
  - **Bug**: FAB muncul saat fresh login tapi HILANG setelah Sync Data.
  - **Root Cause**: `cacheAndSaveTable` baris 250 — `table.settings` dari API `/tables/{id}` adalah `{}` (empty object). Di JavaScript, `{}` adalah **truthy**, sehingga `table.settings || layoutData?.settings` selalu pakai `{}` dan tidak pernah fallback ke `layoutData.settings` yang berisi config `actions.header` yang benar.
  - **Fix**: Ganti logika dengan cek `Object.keys(table.settings).length > 0` sebelum pakai `table.settings`, fallback ke `layoutData?.settings` jika kosong.
  - **Dampak**: Setelah Sync, settings `{icon, actions: {header: [{create}]}}` tersimpan dengan benar ke SQLite → FAB muncul dan tetap ada ✅.

- **Code Quality Fix (2026-07-17)**:
  - **Error**: `sonarjs/pseudo-random` di `excelImportService.ts` baris 65 — penggunaan `Math.random()` sebagai fallback UUID dianggap tidak aman oleh SonarJS.
  - **Fix**: Hapus fallback `Math.random()`, gunakan `crypto.randomUUID()` langsung — didukung penuh di semua target browser (Chrome 92+, Android 10+).
  - **Dampak**: CI/CD Code Quality check kini lulus tanpa error.

- **FAB Root Cause Fix — DashboardController (2026-07-17)**:
  - **[ROOT CAUSE SESUNGGUHNYA]**: `DashboardController` tidak pernah menyertakan `fields`, `layout`, dan `settings` dalam payload `/dashboard` response untuk tabel. API hanya mengirim: `id`, `name`, `version`, dll — sehingga `syncTablesMetadata` di client selalu menyimpan `settings = {}` ke SQLite.
  - **Fix**: Eager load `latestVersion` di query tabel, lalu sertakan `fields`, `layout`, dan `settings` (dari `layout.settings` schema version) dalam setiap item tabel di response `/dashboard`.
  - **Dampak**: Setelah user melakukan Sync Data, SQLite lokal Android akan memiliki `settings.actions.header` yang berisi action `create` → `hasCreateAction = true` → **FAB muncul** ✅.
  - **APK tidak perlu direbuild** — cukup Sync Data sekali di APK yang sudah ada.


- **Android Mobile FAB Spacing Offset Fix (2026-07-17)**:
  - **Dynamic Spacing Offset**: Menambahkan kelas `fab-with-toolbar` pada `<f7-fab>` di `AppShell.vue` jika `appNavigation` aktif.
  - **CSS Offset**: Menggeser posisi `bottom` FAB ke atas setinggi `56px + 16px` di mobile/Android Chrome agar tidak tertimbun di belakang bottom tabbar menu utama.

- **Hapus Kolom Nomor KK (2026-07-17)**:
  - **Hapus nomor_kk**: Menghapus field `nomor_kk` dari properti `fields` di dalam nested form `kepala_keluarga_list` pada `kuesioner_sambora_app_schema.json` karena tidak diperlukan dalam pengolahan data.
  - **Panduan Update**: Menyederhanakan konten `panduan_kendala_lapangan` di HTML block awal untuk membuang instruksi bypass KK.

- **Android FAB & Table Metadata Sync Fix (2026-07-17)**:
  - **Table Metadata Sync Fix**: Memperbaiki `syncTablesMetadata` di `TableSyncHelpers.ts` agar menyertakan kolom `settings`, `layout`, dan `fields` saat menulis/memperbarui SQLite lokal dari payload API.
  - **Android FAB Re-appear**: Mengembalikan tombol terapung (FAB) tambah assignment di client app Android karena kolom `settings` (yang berisi permission action `create`) sekarang tersinkronisasi dan tersimpan dengan benar di SQLite database lokal.

- **Visual Guidelines HTML Block & Strict GPS Required (2026-07-17)**:
  - **Visual HTML Block Guide**: Menyisipkan html_block `panduan_kendala_lapangan` berisi aturan bypass kode khusus (9999999999999999 untuk KK, dan 99998 untuk WA) serta arahan akurasi GPS agar tampil rapi di form HP enumerator.
  - **Enforce Required GPS**: Memastikan input lokasi Geotagging tetap wajib (Required) diisi di lapangan dengan warning akurasi opsional.

- **Strict Data Quality Control & GPS Warning (2026-07-17)**:
  - **GPS Accuracy Warning**: Menambahkan `warning_js` pada geotagging lokasi jika akurasi GPS buruk (> 50 meter) agar mengarahkan petugas keluar ruangan.
  - **Bypass Code Validation**: Mengubah nomor KK dan nomor WA kembali menjadi wajib (`required: true`), namun memaksa pengisian kode khusus secara sadar (`9999999999999999` untuk KK hilang, dan `99998` untuk WA kosong) guna meminimalkan data kosong tak sengaja.

- **Layout Editor Fixes & Sambora Schema (2026-07-17)**:
  - **Apply Schema Fix**: Membenahi error `replaceAllFields is not defined` saat user mengklik Apply di Code editor tab (menambahkan destrukturisasi di `useEditorHandlers.ts`).
  - **Nested Fields Support**: Menambahkan computed `flatFields` di `FieldPicker.vue` sehingga editor secara cerdas memflaten nested form fields (notasi parent.0.child) agar bisa langsung dipilih dari menu dropdown Layout Configuration.
  - **View Layout Sambora**: Memperbaiki format view `default` di `kuesioner_sambora_app_schema.json` agar kompatibel dengan editor visual Cerdas, dan mengatur `Foto_Rumah` sebagai imageField preview untuk kartu kuesioner.
  - **Image Export Fix**: Mengubah `APP_URL` kontainer ke `http://localhost:9980` di `.env.docker` agar link export foto menunjuk ke port host yang valid dan dapat diakses dari luar kontainer.

- **Assignment Draft Status Bug Fix (2026-07-17)**:
  - **Bug**: Draf assignment (`in_progress`) berubah menjadi `Selesai` (submitted) setelah user melakukan sync.
  - **Root Cause (3 lapisan)**:
    1. **Backend logic**: Server memaksa status `submitted` jika assignment punya App, mengabaikan status dari client.
    2. **OPCache PHP**: `octane:reload` tidak cukup — perlu `docker restart` untuk membersihkan OPCache agar kode baru dimuat.
    3. **Root cause utama**: Field `responses.*.status` tidak ada di Laravel validation rules → di-strip dari `$validated` sebelum sampai ke logika backend. Client sudah mengirim `status: "in_progress"` tapi Laravel membuangnya.
  - **Fix**:
    - `ResponseController.php`: Tambah `'responses.*.status' => 'nullable|string|in:assigned,in_progress,...'` ke validation rules.
    - `ResponseController.php`: Backend kini menghormati status eksplisit dari client (tidak paksa `submitted`).
  - **Pelajaran**: Selalu pastikan field yang dibutuhkan ada di Laravel validation rules — field yang tidak terdaftar akan di-strip dari `$validated` meskipun ada di request body.


- **Anti-Cache Sync Fix (2026-07-17)**:
  - **Global Header**: Menambahkan header `'Cache-Control': 'no-cache'`, `'Pragma': 'no-cache'`, dan `'Expires': '0'` di `ApiClient.ts`.
  - **Timestamp Cache-Buster**: Menyematkan query param `_t: Date.now()` otomatis pada seluruh API `GET` request agar bypass Cloudflare/Nginx/Browser cache di production.


- **URL / Hyperlink Field Type (2026-07-17)**:
  - **Tipe Data Terpusat**: Menambahkan `'url'` ke daftar `FieldType` global di `@cerdas/types`.
  - **UrlField.vue (NEW)**: Komponen input URL khusus di `@cerdas/form-engine` dengan fitur:
    - **Mode Edit**: `<input type="url">` dengan asisten `📋 Tempel` clipboard cepat dan tombol `↗ Tes Tautan` verifikasi tautan.
    - **Mode Read-Only**: Blok tombol tautan berikon yang bersih dengan dukungan `config.display_label` kustom untuk menyembunyikan URL panjang.
  - **Editor App Integration**: Mendaftarkan tipe data `'url'` di `FIELD_TYPE_META` editor agar muncul di dropdown tipe kolom Schema Editor.


- **UX Post-Import "Aha Moment" (2026-07-17)**:
  - **Root Cause**: Preview iframe adalah Client App yang hanya menampilkan *assignment* (penugasan), bukan *rekaman data*. Data CSV yang baru diimport tidak pernah ter-assign → selalu kosong. Ini mismatch arsitektur yang menciptakan dead end.
  - **Backend**: Tambah endpoint `GET /tables/{id}/records?page=1&per_page=50` di `TableController::records()` — query `AppRecord` berdasarkan `table_id`, return data + metadata kolom dari versi field aktual.
  - **DataPreviewPanel.vue (NEW)**: Komponen grid data premium di dalam editor. Dark sticky header, striped rows, loading skeleton, pagination 50 rows/page, auto-reload saat tabel berubah. Menampilkan data langsung dari API tanpa iframe Client App.
  - **Sub-tab "Fields | Data Preview"**: Menambahkan sub-tab bar di panel kanan Schema tab. Creator bisa switch antara melihat field config dan melihat data aktual tanpa ganti tab utama.
  - **Race Condition Fix**: `handleExcelImported()` sebelumnya menggunakan `setTimeout(500)` yang menyebabkan `fetchAppViews()` berjalan sebelum fields ter-load → smart view detection fallback ke kolom kosong. Diperbaiki dengan `await doSelectTable()` — fields pasti tersedia sebelum view default dibuat.
  - **onImportSuccess Callback**: Setelah import selesai, editor otomatis switch ke sub-tab "Data Preview" dan menampilkan guidance toast 5 detik: "✓ Data berhasil diimport! Lihat data di tab **Data Preview**, lalu buka **Views** untuk mengatur tampilan."
  - **DeckView Fix (Client App)**: Memperbaiki masalah kolom kustom (seperti `nama_kk` atau `wid`) yang tidak tampil di list item preview sebelum form disubmit. Penyebabnya adalah `resolvePath` di `DeckView.vue` belum mengecek `prelist_data` tempat data Excel yang baru diimport disimpan. Telah ditambahkan step pencarian ke `prelist_data`.
  - **Preview Navigation Flickering Fix**: Menyelesaikan masalah kedipan animasi skeleton loading setiap kali berpindah tab/tampilan di editor. Penyebabnya adalah `EditorBridgeService.ts` memanggil `navigate` dengan `reloadCurrent: true` yang memicu remount komponen `AppShell.vue` dan reload query DB. Diubah menjadi `reloadCurrent: false` dan `animate: false` untuk update query parameter secara instan tanpa re-render penuh.

**⚠️ CRITICAL**: Always use `.\stop-all.bat` to stop servers. NEVER use `taskkill` directly - it may close IDE!

## User Memory Notes
- User prefers Indonesian communication
- User is Product Manager, I am fullstack developer + system architect
- User gives standing permission for necessary actions
- User wants strict TypeScript to catch errors early
- Update gemini.md with important changes/progress
- **FRAMEWORK7 VUE THEMING RULE**: Always follow [docs/framework7_vue_theming_best_practices.md](file:///home/ihza/Projects/cerdas/docs/framework7_vue_theming_best_practices.md) when designing custom themes, managing layout spacing offsets, or handling device notches. Use inline styles with `!important` on `<f7-page-content>` to safely override double-spacing bugs, and override standard F7 CSS variables in `:root` inside `style.css` for dynamic theme changes.
- **CRITICAL UI DOCUMENTATION RULE**: Whenever developing, changing, or fixing UI navigation, routing, or screen states, I MUST ALWAYS update the `references/SCREEN_FLOW.md` document (including adding/updating Mermaid diagrams if relevant) to ensure it stays as the single source of truth across all future sessions.
- **BROWSER TOOL USAGE**: NEVER use browser tool for ANY reason. User will verify manually. I am an agent for writing logic and code, not for clicking.
- **CRITICAL VERSION RULE**: Always update the project version (currently 0.1.0) in `README.md`, `package.json`, and `composer.json` whenever significant progress is made (equivalent to a "push").

## ClosureContext (App-Wide Context) - Updated 2026-01-20

Form closures now have access to typed user context:

```typescript
// In closures (validation_js, showIf, etc):
ctx.user.id           // number
ctx.user.email        // string
ctx.user.name         // string
ctx.user.role         // 'app_admin' | 'org_admin' | 'supervisor' | 'enumerator'
ctx.user.organizationId // number | null

ctx.assignment.id     // string | number
ctx.assignment.status // string
ctx.assignment.organization_id // number

ctx.utils.today()     // 'YYYY-MM-DD'
ctx.utils.now()       // ISO datetime
ctx.utils.daysSince('2026-01-01') // number
```

**Files Updated:**
- `packages/form-engine/src/utils/ClosureCompiler.ts` - Typed ClosureContext
- `apps/client/src/common/stores/authStore.ts` - User interface with role/org
- `apps/client/src/pages/AssignmentDetail.vue` - Pass userContext to FormRenderer

## Framework7 v9 + TypeScript Setup Notes
F7 Vue has incomplete TypeScript declarations. Required shims:

```typescript
// src/types/framework7-vue.d.ts
declare module 'framework7-vue/bundle' {
  export * from 'framework7-vue';
  export function registerComponents(app: App): void;
}

// src/types/css.d.ts
declare module 'framework7/css/bundle' {}
```

Key imports:
- Routes type: `Router.RouteParameters` from `framework7/types`
- App params: `Framework7Parameters` from `framework7/types`
- registerComponents: from `framework7-vue/bundle`

## Android Development Setup (2026-01-14)

### Configuration Complete
- **Min SDK**: Android 10 (API 29)
- **Target SDK**: API 36
- **Live Reload**: Enabled via `capacitor.config.ts`

### Key Files Modified
- `capacitor.config.ts`: Live Reload pointing to `10.0.2.2:9981`
- `variables.gradle`: `minSdkVersion = 29`
- `AndroidManifest.xml`: Network security config added
- `network_security_config.xml`: Allow HTTP to dev servers

### Verified Working Configuration (2026-01-14 11:46)
- **AGP**: 8.3.2 (compatible with Android Studio)
- **Gradle JDK**: 21 (Temurin)
- **compileSdkVersion**: 35 (for Capacitor VANILLA_ICE_CREAM constant)
- **minSdkVersion**: 29 (Android 10 - production target)
- **targetSdkVersion**: 34
- **Test AVD**: Pixel 5 API 30 (needs WebView 83+ for modern JS)

### Development Workflow
1. Run `start-all.bat` (starts backend:9980, client:9981, editor:9982)
2. Open Android Studio: `npx cap open android`
3. Run on emulator (use API 30+ for dev, app works on API 29+ in production)
4. Edit code → Auto-refresh in emulator!
5. Save logs: `.\save-android-log.bat` → logs saved to `logs/android.log`

### Dual Android Dev Modus (New 2026-02-12)

**Mode 1: Local Backend** (Standard)
```powershell
./scripts/start-android-local.ps1
```
- Backend: `http://10.0.2.2:8080/api` (Localhost)
- Database: Local MySQL
- Use for: Full-stack features, backend changes.

**Mode 2: Remote Backend** (UI Only)
```powershell
./scripts/start-android-remote.ps1
```
- Backend: `https://api.dvlpid.my.id/api` (Production)
- Database: Production DB
- Use for: UI/UX tweaks, verifying prod data.

> [!TIP]
> Both scripts automatically start `Pixel_5_API_30` emulator if no device is found! 🚀

> [!NOTE]
> **Caddyfile Conflict**: `apps/backend/Caddyfile` contained absolute Windows paths, causing 404s in Docker. Renamed to `Caddyfile.local` to let Octane use default config.

> [!IMPORTANT]
> **Production Fix**: `Dockerfile.prod` updated to install `curl`. This is required for `docker-compose.prod.yml` healthchecks. Without it, Coolify/Docker reports `502 Bad Gateway` (Unhealthy).

> [!NOTE]
> **CORS Bypass**: `CapacitorHttp` is enabled in `capacitor.config.ts`. This forces all API calls to go through the native layer, bypassing WebView CORS restrictions. This is critical for Mode 2 (Remote Backend).

See `.agent/workflows/android-local.md` and `android-remote.md`.

### Important IPs (Android Emulator)
- `10.0.2.2` → Host machine (your PC)
- `127.0.0.1` → Emulator itself (NOT your PC!)

### Android Debugging Feedback Loop (CRITICAL)
**Use these commands to debug Android without manual interaction:**

```powershell
# Quick: Restart app + capture log
.\restart-android.bat

# Manual commands:
adb shell am force-stop com.cerdas.client && adb shell am start -n com.cerdas.client/.MainActivity
adb logcat -d *:S Capacitor/Console:* > logs\android.log
```

Logs saved to: `logs/android.log` → I can read this file directly for debugging!

See `.agent/workflows/android-dev.md` for detailed ADB debugging guide.

### Workflow Files
- `.agent/workflows/android-dev.md` - Step-by-step Android dev guide
- `docs/DEVELOPMENT_LIFECYCLE.md` - Comprehensive documentation

## Log Pekerjaan AI Asisten

### 17 Jul 2026 - Perbaikan Bug Sinkronisasi & Deserialisasi Schema Actions (Root Cause Fixes)
- **Client App Sync (Root Cause A)**: Menambahkan fallback pada `TableSyncHelpers.ts` agar mengambil data `settings` dari `layoutData.settings` jika properti `settings` dari tabel root bernilai `null`/kosong di DB. Ini memastikan client app di HP (dan production) selalu berhasil menyinkronkan data tombol aksi (seperti tombol FAB plus) dari server.
- **Editor App Code Apply (Root Cause B)**: Mengintegrasikan `useTableStore` di `CodeEditorTab.vue` dan memancarkan event `apply` setelah user mengeklik "Apply Changes". Hal ini menyinkronkan memori Editor Visual (`editorState`) secara instan, sehingga Live Preview emulator (iframe) langsung ter-update reaktif tanpa harus me-reload halaman browser secara manual.
- **Editor App ApiClient Anti-Cache**: Menambahkan header `'Cache-Control': 'no-cache'`, `'Pragma': 'no-cache'`, dan `'Expires': '0'` serta parameter buster `_t: Date.now()` pada Axios GET request di `ApiClient.ts` editor app. Ini memecahkan masalah caching agresif browser/Vite dev server pada request skema tabel yang menyebabkan editor memuat skema lama dan meng-override preview.
- **Auto-generated ID Rumah**: Mengubah field `ID_rumah` menjadi auto-generated (`RMH-[UUID]`) dan menyembunyikannya dari enumerator (`show_if_fn: false`) untuk mencegah kesalahan input manual.
- **Trash Management UI**: Menambahkan sistem "Trash / Deleted Data Sources" via modal dialog khusus pada tab Data editor. Modal ini terhubung dengan store state `trashedTables` dan Endpoint `GET /trash`, `PUT /restore`, serta `DELETE /force` di backend `TableController`. Pembersihan permanen wajib mengetik konfirmasi *EXACTLY DELETE*.
- **Automated Trash Cleanup**: Menulis dan Mendaftarkan daemon artisan `php artisan app:clean-trash --days=30` menggunakan Laravel Scheduler di `routes/console.php` agar setiap *soft-deleted variables* yang berusia di atas 30 hari dihapus selamanya secara ootmatis setiap malam untuk mengamankan limit kapasitas Database production.
- **Queue Worker Reliability**: Menemukan & memperbaiki _bug_ fatal error pada `ImportExcelJob` yang selalu stuck saat import data jumlah besar karena memotong `max-time` di level script worker dan limit PHP (3600 detik). Limit telah dikalibrasi menjadi 14400 (4 Jam) agar tidak macet / ter-*kill* di tengah jalan oleh sistem operasi.
- **Local DB Sync Error**: Ditemukan *bug* pada `DatabaseService.ts` di App Client dimana me-reset local database menyebabkan error `no such table: responses` saat sinkronisasi. Hal ini karena fungsi `resetDatabase` hanya mendrop tabel SQLite tanpa membuat kerangkanya kembali. Table recreation statement sudah disisipkan sebelum *State* disimpan agar API sinkronisasi selanjutnya berjalan lancar melalui *table* yang *fresh*.
- **Enterprise-Grade Delta Sync**: Melakukan optimasi drastis pada arsitektur offline sinkronisasi (Endpoint `/dashboard` dan `/responses`). Sebelumnya `SyncService` selalu melakukan _Full Sync_ dengan membuang payload yang masif. Kini dirombak menjadi **Delta Sync** berbasis `updated_since` dan menggunakan `localStorage` timestamp checkpoint, sangat meringankan kinerja bandwidth dengan hanya menarik data yang termofidikasi (serta array `deleted_apps` / `deleted_tables` untuk menghapus _orphan data_ SQLite lokal).

### Strategic Logging System

Import and use the logger anywhere:

```typescript
import { useLogger } from '@/common/utils/logger';

const log = useLogger('MyComponent');
log.debug('Debug message', { data: someData });
log.info('Info message');
log.warn('Warning');
log.error('Error', error);
```

**Control verbosity** in `main.ts`:
```typescript
import { setVerbose } from './common/utils/logger';
setVerbose(true);  // Enable DEBUG level
setVerbose(false); // Only WARN and ERROR
```

Log format: `[TIME] [CERDAS] [LEVEL] [Context] Message`


### Default Login Credentials (Seeder)
Use these to login during development:

| Role | Email | Password |
|------|-------|----------|
| **Enumerator** | `user@example.com` | `password` |
| **Supervisor** | `supervisor@cerdas.com` | `password` |
| **Admin** | `admin@cerdas.com` | `password` |

**Note**: App defaults to `user@example.com` on Login screen.

### Recent Progress (2026-01-14)
- **Phase 4 Complete**: Form Renderer now supports:
  - **Premium UI**: Professional form styling with compact `f7-list no-hairlines`, cleaner separators, and better spacing.
  - **HTML Blocks**: New `html_block` field type for rich text instructions, notes, and alerts (Info/Warning/Success styles).
  - **Performance**: Debounced input fields (Text/Number) to eliminate UI lag on large forms.
  - **Advanced Fields**: 
    - `GpsField`: Leaflet Map Preview, Robust Retry Strategy (High->Low Accuracy), Permission Handling.
    - `ImageField`: Flexible 'Box Style' with `object-fit: contain`, Zoom/Fullscreen support, and Overlay controls.
    - `SignatureField`: (Planned/In Progress).
  - **Dependency Fix**: Added `leaflet` to form-engine package.
  - **Error Handling**: Standardized error display across all field components.
  - **Persistence Fix**: Replaced unstable LocalStorage Mock Adapter with **Jeep-SQLite (WASM)** for Web/Laptop, ensuring robust offline persistence identical to Native.
- **Bug Fixes (Session 2 - 17:57)**:
  - **Database Connection**: Fixed `isConnection()` check-first pattern in DatabaseService to avoid "Connection already exists" error.
  - **Form Input Lag**: Implemented Debounce logic validation in TextField/NumberField.
  - **GPS Hanging**: Added Permission/Retry logic.
  - **Image Performance**: Reduced camera quality (90→60) and added 800px max dimension to prevent main thread freeze from large Base64 strings.
  - **Vue Prop Handling**: All form fields now handle `undefined` values with `withDefaults` + computed `safeValue` pattern.
  - **GPS Permissions**: Added `ACCESS_BACKGROUND_LOCATION` (API 29+), `FOREGROUND_SERVICE_LOCATION` (API 34+), `READ_MEDIA_IMAGES` (API 33+).
  - **Framework7 TouchRipple**: Enhanced error suppression and disabled touchRippleElements entirely.
- **Bug Fixes (Session 1)**:
  - **UUID**: Replaced `crypto.randomUUID()` with `uuid` library for WebView compatibility.
  - **GPS Permissions**: Added `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` to AndroidManifest.xml.
  - **Camera Permissions**: Added `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`.
  - **CSS Selector Error**: Added global error handler to suppress Framework7 touch ripple error on older WebView.
- **Next**: Phase 5 (No-Code Editor) or Phase 6 (Data Sync polish).

## Session 2026-01-15 (Typing Lag + Screen Flow)
- **Typing Lag Investigation**:
  - Root cause: Circular update cycle (child emit → parent update → child watch trigger).
  - Fix: Removed `watch` on `props.value` in TextField/NumberField. Child owns input state.
  - Additional: Removed CSS transitions, reduced renderLimit to 8, used shallowReactive.
  - Result: Zero typing lag in production build.
- **Screen Flow Refactoring**:
  - **Flow**: Dashboard (Apps + Stats) → App Detail (Assignment List) → Assignment Form
  - Backend: Added `app_schema_id` accessor to Assignment model with `$appends`.
  - SyncService: Updated to use `assign.app_schema_id` from accessor.
  - AppShell: Filter assignments by `app_schema_id`, fallback to AssignmentList when no layout.
  - DashboardPage: Removed AssignmentList, only shows Apps + Stats.
- **Live Reload Toggle**: `capacitor.config.ts` → `useLiveReload = true/false`.

## Session 2026-01-16 (Caddy + Actions + UX)
- **Caddy Backend Setup**:
  - Switched from `php artisan serve` to Caddy + PHP-CGI on port 8080.
  - Fixed hardcoded `baseUrl` in `ApiClient.ts` that ignored `VITE_API_URL`.
  - Resolved CORS duplication (removed manual injection in `index.php`).
- **Assignment Status Indicator Fix**:
  - Added `in_progress` status update on draft save.
  - Fixed `AppShell.vue` to refresh list on return from detail (Silent Refresh).
  - Prevented double load flicker with `justMounted` flag.
- **Dynamic Actions System (Full-Stack)**:
  - **Backend**: Added `settings.actions` to `app_schemas` table (already had JSON column).
  - **Seeder**: Updated `ComponentShowcaseSeeder` with header and row actions.
  - **Frontend (`AppShell.vue`)**:
    - Overflow menu (kebab icon) for header actions via `f7-actions`.
    - Actions read from `schemaData.settings.actions.header`.
    - `executeAction` handler routes action types.
  - **Frontend (`AssignmentList.vue`)**:
    - Implemented F7 swipeout for row actions.
    - Swipe left/right actions configurable via `swipeConfig` prop.
    - `handleRowAction` in parent handles delete, complete, etc.
  - **Schema Design**:
    ```json
    {
      "actions": {
        "header": [{ "id": "create", "label": "Tambah Baru", "icon": "plus", "type": "create" }, ...],
        "row": [{ "id": "delete", "label": "Hapus", "icon": "trash", "type": "delete", "color": "red" }, ...],
        "swipe": { "left": ["delete"], "right": ["complete"] }
      }
    }
    ```
- **Next**: Test swipe actions, implement export/settings handlers, Phase 5 Editor.

### Search, Filter & Preview System
- **Field Metadata Expansion** in Seeder:
  - Added `searchable`, `displayName`, `description`, `key`, `preview` properties to fields.
- **AppShell.vue Enhancements**:
  - **Search Bar**: `f7-searchbar` component, searches across `prelist_data` for fields with `searchable: true`.
  - **Status Filter**: Segmented control (All, Pending, In Progress, Completed).
  - **Preview Bottom Sheet**: Shows fields with `preview: true` before opening full form.
  - `filteredAssignments` computed for reactive filtering.
- **Schema-aware Logic**: Parses `schemaFields` from schema, filters for `searchableFields` and `previewFields`.

### Validation Summary Feature (AssignmentDetail)
- **FAB Button**: Bottom-right, shows shield icon with badge count of issues.
- **Bottom Sheet** displays 3 categories:
  - 🔴 **Errors**: Validation failures (red header).
  - 🟡 **Warnings**: Custom warnings from `warning_fn`/`warning_js` (orange header).
  - ⚪ **Blanks**: Required fields that are empty (gray header).
- **Click to Navigate**: Clicking an item closes sheet and scrolls to that field with highlight animation.
- **FormRenderer Enhancements**:
  - `getValidationSummary()`: Returns errors, warnings, blanks arrays.
  - `scrollToField(fieldName)`: Scrolls to field and highlights it.
  - `data-field-name` attribute added to FieldRenderer wrapper.
- **FieldDefinition Type**: Added `warning_fn` and `warning_js` properties.

### 2026-01-16: UX Polish & Scalability Refactor
- **Form Navigation Improves**:
  - **Review Nested Form Navigation**: Clicking validation summary item for nested field (e.g. `family_members[0].age`) auto-opens popup, scrolls to index, and highlights field.
  - **Smart Popup Management**: Navigating from nested popup to parent field automatically closes nested popups first.
- **Form Renderer Scalability Refactor**:
  - Split `FormRenderer.vue` (was 530 lines) into composables:
    - `useFormLogic.ts`: State, Formulas, Visibility.
    - `useFormValidation.ts`: Validation, Summary.
    - `useFormNavigation.ts`: Scrolling, Dispatching.
  - Result: FormRenderer is now ~130 lines, focused on UI/VirtualScrolling.
- **UX Enhancements**:
  - **GPS Directions**: Added "Get Directions" button to `GpsField` (links to Google Maps).
  - **Signature Styling**: Matched `SignatureField` style with `TextField` (padding, border radius).
  - **AppShell Status Counts**: Filter buttons now show counts (e.g. "Pending (5)").
  - **AppShell UI Upgrade**: Elevated Search Bar to `f7-subnavbar`. Chips sticky on scroll. Optimized spacing. Used Primary Color for 'All' filter.
  - **AppShell Refactor**: Extracted logic into `useAppShellLogic.ts` (Data, Sync, Filters) for scalability.
  - **Version Verification**: If encountering issues with a library/tool, ALWAYS verify documentation online for the specific version in use, especially if it's newer than your training data (e.g., Capacitor 8, Laravel 11). Do not rely solely on memory.
  - **Navigation Final**: Resolved navigation lock and animation issues by using `router.navigate('/', { clearPreviousHistory: true, transition: 'f7-fade' })` and handling props correctly in AppShell.
  - **Dashboard Fix**: Corrected `f7.view.main` to `f7.views.main` in DashboardPage to prevent navigation lock after returning from AppShell.
  - **Infinite Scroll**: Implemented client-side pagination to safe-render large Lists (10,000+ items) while maintaining full offline search capability.
  - **Dynamic Status Counts**: Refactored filter logic so status chips reflect search results (e.g. searching updates "All" count from 10k to 30).
  - **FAB Visibility**: Fixed Validation FAB disappearing behind popups (moved to Teleport + cleanup).

### 2026-01-16 (Session 2): Android Back Button + Editor Analysis
- **Android Back Button Fix**:
  - Installed `@capacitor/app` plugin for hardware back button interception.
  - Registered global listener in `main.ts` (before Vue mount) for earliest detection.
  - Logic: Close modals → Navigate back → Exit at root.
  - Required Java 21 upgrade (Capacitor 8.x requirement).
- **Java 21 Upgrade**:
  - Installed Eclipse Temurin JDK 21.0.9 via winget.
  - Updated `build.gradle` to use `JavaVersion.VERSION_21`.
  - Rebuilt APK successfully.
- **Form Context Enhancement**:
  - Added `user` object to `FormView.vue` context via `useAuthStore`.
  - Now `ctx.user` available in all closures (show_if_fn, editable_if_fn, etc.) including nested forms.
  - Enables role-based field visibility/editability (e.g. PML vs PPL).
- **AppSheet Editor Analysis**:
  - Updated `docs/references/appsheet_analysis.md` with detailed Column Editor UI analysis.
  - Documented table-based field editing pattern (NAME, TYPE, KEY, LABEL, FORMULA, SHOW, EDITABLE, REQUIRED columns).
  - Proposed editor UI options: Table-based (AppSheet style) vs List+Detail Panel (simpler).
  - Defined implementation roadmap for Phase 5 (Editor).
- **Reference Docs Updated**:
  - `docs/APPSHEET_LAYOUT_REFERENCE.md` - Grouping & Deck View config.
  - `docs/references/appsheet_analysis.md` - Full editor UI analysis.
- **Next**: Build Schema Editor UI (Phase 5).

### 2026-01-16 (Session 3): Schema Editor Fixes
- **TypeScript Fix**: Resolved strict null check errors in useSchemaEditor.ts for removeField and duplicateField. Added safeguards against undefined array access from path.split('.').

### 2026-01-17: Major Terminology Refactoring (Apps & Forms)

#### Disambiguation Decision
- **Projects** → **Apps** (container for multiple forms, like AppSheet apps)
- **Schemas** → **Forms** (data collection forms within an app)
- **SchemaEditor** → **FormEditor**

This aligns better with user mental model: An **App** contains multiple **Forms** (not the reverse).

#### Database Migrations Created
1. `2026_01_17_090000_rename_projects_to_apps.php`:
   - Renames `projects` → `apps`
   - Renames `project_memberships` → `app_memberships`
   - Updates `project_id` → `app_id` foreign key

2. `2026_01_17_090001_rename_app_schemas_to_forms.php`:
   - Renames `app_schemas` → `forms`
   - Renames `app_schema_versions` → `form_versions`
   - Updates foreign keys throughout

#### New Models Created
- `App.php` (replaces Project.php)
- `Form.php` (replaces AppSchema.php)
- `FormVersion.php` (replaces AppSchemaVersion.php)
- `AppMembership.php` (replaces ProjectMembership.php)

#### Frontend Changes
- **Routes Updated**: `/apps`, `/apps/:id`, `/forms/new`, `/forms/:id`
- **Pages Renamed**:
  - `ProjectsPage.vue` → `AppsPage.vue`
  - `SchemaListPage.vue` → Removed (Forms accessed via App)
  - Created `AppDetailPage.vue` (lists Forms within App)
- **Folder Renamed**: `schema-editor/` → `form-editor/`
- **File Renamed**: `SchemaEditorPage.vue` → `FormEditorPage.vue`
- **AppLayout.vue**: Updated sidebar navigation (Dashboard, Apps)
- **HomePage.vue**: Updated stats, recent items, quick actions

#### Documentation Updated
- `docs/SCHEMA_EDITOR_WORKFLOW.md` → Fully rewritten with new terminology

#### Navigation Flow (New)
```
Dashboard (/) → Apps (/apps) → App Detail (/apps/:id) → Form Editor (/forms/:id)
```

### 2026-01-17: Backend Refactoring Completed
- **Database Migrations Executed**:
  - `rename_projects_to_apps`: Renamed tables and foreign keys.
  - `rename_app_schemas_to_forms`: Renamed tables and foreign keys.
- **Backend Refactoring**:
  - **Controllers**:
    - Renamed/Refactored `SchemaController` → `FormController` (Simplified: Removed legacy relational fields logic, fully JSON-based).
    - Created `AppController` (App CRUD + Memberships).
    - Updated `DashboardController` (Uses App/Form models, returns correct structure).
    - Updated `AssignmentController` (Uses Form/FormVersion models and logic).
  - **Models**:
    - Updated `User.php` (Added `apps` relation, updated helpers).
    - Updated `Assignment.php` (Renamed relations/accessors).
    - Created `Start-up` Models for App, Form, FormVersion.
  - **Routes**:
    - Updated `api.php`: Grouped under `/apps` and `/forms`.
  - **Cleanup**:
    - Deleted legacy models (`Project`, `AppSchema`, `AppSchemaVersion`, `ProjectMembership`).
    - Note: `fields` table left in DB but ignored/deprecated.
- **Full Stack Consistency Achieved**:
  - Frontend and Backend now speak the same "Apps & Forms" language.

### 2026-01-17: Frontend Integration (Apps & Forms)
- **Stores Implementation**:
  - `useAppStore`: Manages Apps list, current App, Dashboard Stats.
  - `useFormStore`: Manages Forms list, CRUD, Versioning (Draft/Publish), Schema Loading.
  - `ApiClient`: Created axios wrapper with auth interceptors.
- **Page Integration**:
  - **HomePage.vue**: Connected to `fetchDashboard`. Shows real stats (from backend) and recent forms.
  - **AppsPage.vue**: Connected to `fetchApps`. Shows list of Apps with random colors (until logo support). Implemented Create App.
  - **AppDetailPage.vue**: Connected to `fetchApp`. Shows App details + Forms list + Members list. Implemented Create Form.
  - **FormEditorPage.vue**: Connected to `formStore`.
    - Auto-creates/fetches Draft on load.
    - Loads JSON schema into `useSchemaEditor` state.
    - Implemented "Save Draft" (writes to `form_versions` table).
    - Implemented "Publish" (updates status).

**Ready for End-to-End Testing.**

### 2026-01-17 17:00: Database Reset & Seeded
- Executed `php artisan migrate:fresh --seed` successfully.
- Fixed migration order (Drop Foreign Keys before Rename) for `rename_projects_to_apps` and `rename_app_schemas_to_forms`.
- Updated `project_memberships` migration to use `app_admin` role in ENUM column.
- Database is now populated with Test Users, App, Forms, and 10k Performance Assignments.
- **Client Build Fixed**:
  - Ran `pnpm build` in `apps/client`.
  - Fixed 6 TypeScript errors:
    - `uuid.ts`: Fixed possible undefined buffer index.
    - `logger.ts`: Fixed unused variable and converted `enum` to `const object` for erasable syntax compatibility.
    - `useAppShellLogic.ts`: Removed unused `searchableFields`.
    - `SyncService.ts`: Removed unused `formId` parameter.
  - Build successful (Exit Code 0).

- **Editor Build Fixed**:
  - Ran `pnpm build` in `apps/editor`.
  - Fixed TypeScript errors:
    - `editor.types.ts`: Added `hint`, `preview`, `searchable` to `EditableFieldDefinition`.
    - `DeviceFrame.vue`: Fixed nullable check for dimensions.
    - `AppSettingsPanel.vue`: Fixed unused variable by implementing proper method call.
    - `useSchemaEditor.ts`: Exported missing `updateLayout` function and removed duplicate export.
    - `vite.config.ts`: Added missing `@` alias to `resolve.alias`.
  - Build successful (Exit Code 0).



- **Doc Terminology Fix**: Renamed SCHEMA_EDITOR_WORKFLOW.md to FORM_EDITOR_WORKFLOW.md. Added terminology glossary (App, Form, FormVersion, Assignment, Prelist Data) untuk konsistensi.


### 2026-01-17: Form Editor UI Enhancement
- **FieldConfigPanel Enhanced**: Added missing logic fields (editable_if_fn, warning_fn, options_fn, initial_value_fn) to Advanced Logic section.
- **FieldPicker Component**: Created reusable field picker dropdown for Views tab. Supports filtering by type, 'None' option, and field icons.
- **ViewsPanel Refactored**: Integrated FieldPicker for GroupBy and Deck View config. Connected to global schema editor state.
- **CsvImportPopup**: Created 3-step CSV import wizard (Upload, Preview/Map, Success). Features drag-drop, auto-column mapping, and CSV parsing.
- **AddAssignmentPopup**: Created dynamic form for manually adding assignments based on schema fields.
- **AssignmentsPanel Wired**: Connected Import CSV and Add Single buttons to new popup components.
- **AppSettings & Actions Polish**:
  - `AppSettingsPanel.vue`: Refactored to focus on basic form info (Name, Description, Icon).
  - `ActionsPanel.vue`: Fully integrated with global state (`useSchemaEditor`), supporting persistence for Header, Row, and Swipe actions.
  - `useSchemaEditor.ts`: Enhanced `loadSchema` to handle full state restoration (description, settings, layout). Added `description` and `updateDescription` to state and actions.
- **Bug Fix**: Resolved `f7.preloader` crash in `FormEditorPage.vue` by switching to proper `f7ready` callback approach.
- **True WYSIWYG Live Preview**:
  - Replaced mock preview with real **Iframe integration (PWA Client)**.
  - Implemented **Cross-App Bridge** via `postMessage` for transparent Auth sharing and Live Schema Overrides.
  - Enabled "Start from Home" flow, allowing full UX testing including Dashboards and real data sync.
  - Optimized Phone Preview layout: Increased panel width (420px) and scale (1.0) for better visibility.
  - Added support for multiple View Types (Map, Calendar, etc.) in preview state.



### 2026-01-17: One App, Multiple Views Architecture
- **Backend Migration**:
  - Created `views` table (id, app_id, form_id, type, config).
  - Added `navigation` JSON column to `apps` table.
  - Updated Models (`App`, `View`) with relationships and casts.
- **Seeding**:
  - Updated `ComponentShowcaseSeeder` to generate an App with multiple Views (Default Assignment Deck + Map Monitoring) and Navigation Menu.
- **Client UI (AppShell)**:
  - Updated `useAppShellLogic` to fetch full App Metadata (Forms + Navigation) from API if online (Offline fallback to local Forms).
  - Updated `AppShellMenu` to accept and render `navigation` prop.
  - Implemented Basic 'Link' navigation.
  - *Note*: View-based navigation requires further implementation (Mapping View ID -> Form ID in Client).
- **Client Logic Completion**:
  - Implemented Client-side Filtering in `ViewRenderer` (supports exact match filtering based on View Config).
  - Wired up `AppShell` to render dynamic Views based on URL query param (`?view=xxx`).
  - Enabled recursive View Navigation via `AppShellMenu`.

### 2026-01-18: Sync Controller Fix
- **ResponseController Refactor**:
  - Replaced legacy `AppSchema` and `Project` references with `Form` and `App` models to fix `Undefined type 'App\Models\AppSchema'` error.
  - Updated assignment creation logic to use `form_version_id` and correct `organization_id` lookup via `appMemberships`.
  - Ensures accurate sync processing and assignment handling compliant with the new `App`/`Form` terminology.
- **Frontend Data Join Fix**:
  - `DeckView` and `AssignmentDetail` were receiving Assignments without their Response Data after a refresh.
  - Updated `DashboardRepository.getAssignments` and `getAssignmentById` to perform a `LEFT JOIN` on the `responses` table.
   - This populates `response_data` in the Assignment object, resolving the "Data disappears on refresh" issue.
- **Grouping Logic Fix (Offline First)**:
  - `AssignmentQueryService.getGroupedAssignments` was previously only grouping by `prelist_data`, ignoring user-submitted `response_data`.
  - Updated the SQL query to `LEFT JOIN responses` and use `COALESCE(response, prelist)` for determining the group key.
  - This ensures that if a user fills in a grouping field (e.g. City), the item correctly moves to that group even if the prelist data was empty.
  - Added debug logs to `useAppShellLogic.refreshData` to track grouping activation and item loading counts.
  - **Sync Robustness**: Updated `SyncService.pullResponses` to explicitly cast `assignment_id` to string before SQLite insertion to prevent type mismatches during `LEFT JOIN`.

### 2026-01-21: App Shell Scalability Refactor
- **Refactoring `useAppShellLogic.ts`**:
  - Addressed scalability concerns by decomposing the monolithic `useAppShellLogic.ts` file (~480 lines).
  - Created `apps/client/src/app/dashboard/composables/app-shell/` directory.
  -  Extracted logic into dedicated composables:
    - `useAppShellState.ts`: Manages all reactive state.
    - `useAppMetadata.ts`: Handles app navigation, views, forms, and metadata syncing.
    - `useAppContext.ts`: Fetches user role and organization context.
    - `useGroupingLogic.ts`: Encapsulates drill-down navigation and group path logic.
    - `useAssignmentQueries.ts`: Centralizes data fetching and assignment/group queries.
    - `useSearchAndFilter.ts`: Manages client-side filtering and search computation.
    - `useSchemaLoader.ts`: Handles loading form schema and layout from the local database.
  - **Conductor Pattern**: `useAppShellLogic.ts` now acts as an orchestrator, importing and coordinating these composables.
  - **Improvements**:
    - Improved type safety (`type Ref` imports).
    - Cleaner dependency injection between composables.
    - Easier to unit test isolated logic chunks.

### 2026-01-21: Editor UX Improvements

- **UI/UX Review**: Analyzed editor hierarchy against `FORM_EDITOR_WORKFLOW.md` documentation.
- **Implemented 3 Improvements**:
  1. **Auto-Select Single Form**: If app has only 1 form, automatically select it and navigate to Fields tab (reduces friction for simple apps).
  2. **Disabled Tabs with Visual Feedback**: Tabs that require form selection (Fields, Actions, Assign) are now visually disabled with lock icon and tooltip ("Pilih Data Source terlebih dahulu").
  3. **Empty State Messages**: Each tab that requires form shows helpful empty state with icon, message, and "Go to Data Sources" button.
- **FieldConfigPanel Professional Styling**:
  - Redesigned input fields with elevated styling (clear borders, backgrounds, focus states).
  - Section headers with uppercase labels and consistent typography.
  - Enhanced option inputs with monospace styling for values (purple accent).
  - Improved accordion sections with gradient backgrounds.
  - Focus states with blue glow effect for better UX feedback.
  - Logic labels with accent bar indicator.
- **Global Editor Theme (Scalable Solution)**:
  - Created `editor-theme.css` - single source of truth for all F7 overrides.
  - Imported in `main.ts` after F7 CSS for proper cascade.
  - Defines CSS variables (--editor-primary, --editor-border, etc.) for consistency.
  - Eliminates need to duplicate F7 overrides in every component.
  - Components now use CSS variables instead of hardcoded colors.
- **Files Modified**:
  - `EditorSidebar.vue`: Added `hasFormSelected` prop, disabled state logic, lock icon, and styles.
  - `AppEditorPage.vue`: Pass `hasFormSelected` computed, auto-select logic in `onMounted`, empty state UI.
  - `FieldConfigPanel.vue`: Simplified CSS using global theme variables.
- **Files Created**:
  - `apps/editor/src/editor-theme.css`: Global F7 overrides and design system.

### 2026-01-22: ViewsPanel Scalability Refactoring

- **Problem**: `ViewsPanel.vue` had ~640 lines with multiple responsibilities (views, navigation, UI state, API calls).
- **Solution**: Decomposed into smaller, single-responsibility components:
  - **Components Created**:
    - `ViewsSidebar.vue`: Sidebar with view/navigation lists.
    - `ViewConfigPanel.vue`: Main view configuration wrapper.
    - `NavigationConfigPanel.vue`: Navigation item configuration.
    - `DeckViewConfig.vue`: Deck-specific settings.
    - `MapViewConfig.vue`: Map-specific settings.
    - `ViewActionsSelector.vue`: Action checkboxes.
  - **Composables Created**:
    - `useViewManagement.ts`: CRUD operations for views.
    - `useNavigationManagement.ts`: Navigation state and API persistence.
    - `useViewConfigSync.ts`: Syncing local layout state with global editor state.
  - **Utilities Created**:
    - `viewHelpers.ts`: Helper functions for icons and default configurations.
    - `validations.ts`: Config validation utilities.
- **Result**: `ViewsPanel.vue` is now a thin orchestrator (~120 lines).
- **Directory Structure**:

  ```text
  views/
  ├── ViewsPanel.vue (orchestrator)
  ├── sidebar/
  │   └── ViewsSidebar.vue
  ├── config/
  │   ├── ViewConfigPanel.vue
  │   ├── NavigationConfigPanel.vue
  │   ├── ViewActionsSelector.vue
  │   └── view-types/
  │       ├── DeckViewConfig.vue
  │       └── MapViewConfig.vue
  └── utils/
      ├── viewHelpers.ts
      └── validations.ts
  ```

- **CSS Fixes**: Added scoped CSS with utility classes since Tailwind is not compiled in this project.

### 2026-01-22: Resizable Panel Feature

- **Problem**: Users cannot resize config panels to maximize screen real estate on wider monitors.
- **Solution**: Created `ResizableDivider` component for drag-to-resize functionality.
- **Components Modified**:
  - `ResizableDivider.vue`: New reusable drag divider component.
  - `EditorShell.vue`: Added resizable preview panel (320px-600px).
  - `AppEditorPage.vue`: Added resizable field list panel in Fields tab (250px-600px).
  - `ViewsPanel.vue`: Added resizable sidebar (200px-450px).
- **Features**:
  - Drag handle with visual feedback (hover/active states).
  - Min/max width constraints for usability.
  - Smooth cursor changes during drag.
- **Files Created**:
  - `apps/editor/src/app/form-editor/components/shared/ResizableDivider.vue`

### 2026-02-08: App Schema System Implementation

- **App-Level JSON Schema**:
  - Designed schema covering: `app` metadata, `tables` (keyed by slug), `views`, `navigation`.
  - Created TypeScript types: `AppSchema`, `TableSchema`, `ViewSchema`, `NavigationItem`, `TableSourceType`.
  - Implemented `validateAppJson()` in `jsonValidator.ts` with cross-reference validation (views→tables, navigation→views).

- **Backend API (`AppSchemaController.php`)**:
  - `getSchema(App $app)`: Returns full App JSON with tables, views, navigation.
  - `updateSchema(Request $request, App $app)`: Updates from App JSON (creates/updates/deletes tables & views).
  - `exportSchema(App $app)`: Download JSON file.
  - `importSchema(Request $request)`: Create new App from JSON.
  - Routes: `GET/PUT /apps/{app}/schema`, `GET /apps/{app}/schema/export`, `POST /apps/import`.

- **Code Editor Enhancements (`CodeEditorTab.vue`)**:
  - Auto-detection: `isAppLevel` computed detects App vs Table level JSON.
  - Schema badges: Blue "APP" or gray "TABLE" indicator.
  - Import/Export toolbar: Copy, Download, Upload buttons.
  - File upload: JSON file import with validation.

- **Files Created/Modified**:
  - `apps/backend/app/Http/Controllers/Api/AppSchemaController.php` (NEW)
  - `apps/backend/routes/api.php` (Added schema routes)
  - `apps/editor/src/app/app-editor/types/editor.types.ts` (Added App types)
  - `apps/editor/src/app/app-editor/utils/jsonValidator.ts` (Added validateAppJson)
  - `apps/editor/src/app/app-editor/components/code/CodeEditorTab.vue` (Added import/export UI)

### 2026-02-08: Resizable Code Editor

- **Feature**: Code Editor panel is now resizable (drag-to-resize) between 400px and 1000px width.
- **Implementation**:
  - Added `codeEditorWidth` state to `AppEditorPage.vue`.
  - Wrapped `CodeEditorTab` in a resizable container with `ResizableDivider`.
  - Added JSON Preview placeholder area effectively splitting the view.
  - Added CSS styles for `.code-content`, `.code-editor-panel`, and `.code-preview-placeholder` in `app-editor.css`.

### 2026-02-12: CORS Fix & Debug Menu Popup

- **CORS Fix**: Updated `COOLIFY_GUIDE.md` to include `capacitor://localhost,https://localhost` in `CORS_ALLOWED_ORIGINS` example. **User must update Coolify env var** on server for Android login to work.
- **Debug Menu Scroll Fix**: Converted `DebugMenuSheet.vue` from `f7-sheet` (80vh, manual overflow hack) to `f7-popup` with `f7-page`/`f7-navbar` for native scrolling on Android.

### 2026-02-12: Production Crash Fix (PailServiceProvider)
- **Issue**: Local `bootstrap/cache` files containing `PailServiceProvider` (dev tool) leaked into production image, causing crash.
- **Fix**: Added `bootstrap/cache/*.php` to `.dockerignore` and `.gitignore` to prevent infected cache from leaking to prod.

## Push to GitHub Workflow (Best Practice)

**ALWAYS follow this sequence when pushing code:**

1. **Scan for secrets** — Check diffs for passwords/keys before staging
2. **`git add`** — Stage files
3. **`git commit`** — Lint-staged hook runs ESLint auto-fix on staged `.js/.ts/.vue/.json` files
4. **`git pull --rebase`** — Sync with remote, rebase local commits on top
5. **`git push`** — Pre-push hook runs `verify-build.ps1` with smart tiering:
   - `.vue/.ts/.css` only → Web build only (~30s)
   - `android/` or `capacitor.config` → Full build (~5-10m)
   - `apps/backend/` only → Skipped (instant)

**⚠️ NEVER use `--no-verify` unless explicitly instructed by user.**

Reference: `.agent/workflows/verify-build.md`, `.agent/workflows/scan-secrets.md`

### 2026-02-13: View Draft Save Fix (Editor)
- **Problem**: Views created/modified in the Views tab disappeared after saving draft and reloading.
- **Root Cause**: 3 bugs in view save flow:
  1. `updateLayout()` merged views with `{ ...old, ...new }` — deletions re-added from spread.
  2. Circular deep watcher in `useViewConfigSync` re-synced `localLayout` after every commit.
  3. Unlike fields (direct mutation), views went through unnecessary indirection.
- **Fix**:
  - `useEditorState.ts`: Changed `updateLayout()` to use `Object.assign` (in-place mutation, like fields).
  - `useViewConfigSync.ts`: Removed circular deep watcher. Added identity-tracking for table-switch detection only.
  - `useViewManagement.ts`: Cleaned up debug console.log statements.
- **Verified**: `vue-tsc --noEmit` passed (exit code 0).

### 2026-02-14: Response Version Pinning + Schema-Aware Export

- **Problem**: When form schema changes, existing drafts lose field data and exports contain ghost data.
- **Client-Side Version Pinning** (6 files):
  - `schema.ts`: Added `table_versions` cache table + `schema_version` column on `responses`.
  - `DatabaseService.ts`: Registered `table_versions` in CREATE/DROP flows.
  - `SyncService.ts`: `pullTable` caches current + new schema versions before UPDATE.
  - `DashboardRepository.ts`: `getResponse` returns `schemaVersion`, `saveResponse` pins on INSERT, `getSchemaForVersion` added.
  - `AssignmentDetail.vue`: Loads pinned schema for drafts, shows info banner.
- **Backend Schema-Aware Export** (2 files):
  - `ExportController.php` (NEW): Filters response JSON via `array_intersect_key`.
  - `api.php`: Added `GET /api/tables/{table}/export?version=N` route.

### 2026-02-14: Fix Assignment Detail Empty Data

- **Problem**: `AssignmentDetail` form was valid but empty (no values).
- **Root Cause**: Race condition in `useAssignmentLoader`. `schema` was set (triggering `FormRenderer` mount) *before* `formData` was populated from `DashboardRepository.getResponse`.
- **Constraint**: `FormRenderer` uses `useFormLogic` which initializes `formData` from `initialData` prop *once* on creation (via `shallowReactive`). It does not watch for `initialData` changes for performance/architectural reasons.
- **Fix**: Refactored `useAssignmentLoader.ts` to collect all data (Schema, Version Info, Response Data) first, then update reactive state in a single synchronous block at the end.
- **Result**: `FormRenderer` now mounts with fully populated `initialData`.

### 2026-02-15: Docker Production Audit & CORS Cleanup

- **Audit Completed**: Full analysis of Docker production request flow.
- **Architecture**: Traefik (Coolify) → FrankenPHP/Caddy (backend :8080) + Nginx (client/editor :80).
- **CORS Fix**: Scoped `cors.php` paths from `*` to `api/*`, `sanctum/csrf-cookie`, `broadcasting/auth`. Added production domain documentation.
- **Sanctum Fix**: Added production `SANCTUM_STATEFUL_DOMAINS` documentation to `sanctum.php`.
- **Redundancies Removed**:
  - Duplicate `REVERB_HOST` in `docker-compose.prod.yml`.
  - Unused `mariadb_data` volume in `docker-compose.prod.yml`.
  - Deleted orphaned `apps/backend/docker-compose.yml` (legacy serversideup image).
- **Regenerated** `DOCKER_CONTEXT.md`.
- **CRITICAL**: Ensure Coolify env vars include:
  - `CORS_ALLOWED_ORIGINS=https://app.dvlpid.my.id,https://editor.dvlpid.my.id,capacitor://localhost`
  - `SANCTUM_STATEFUL_DOMAINS=app.dvlpid.my.id,editor.dvlpid.my.id`
  - Verify Traefik is NOT adding duplicate CORS headers.

### 2026-02-17: Map Performance Optimization (30k+ Points)

- **Problem**: Map View with 30k+ points caused OOM crash on Android. Secondary `GoogleAuth NullPointerException` was a side effect of OOM.
- **Root Cause**: Clustering was explicitly disabled (`cluster: false`) despite all cluster layers already being defined.
- **Fix (MapView.vue)**:
  - Enabled MapLibre built-in clustering (`cluster: true`, `clusterMaxZoom: 16`, `clusterRadius: 60`, `clusterMinPoints: 3`).
  - Added `generateId: true` for correct `getClusterExpansionZoom` behavior.
  - Optimized `buildGeoJson` — pre-extract style function, reducing CPU overhead.

### 2026-02-17: App Hierarchy Refactor

- **Problem**: Client Dashboard showed unconnected Forms as Apps. "Rumah" App was missing.
- **Fix**:
  - **SyncService**: Added `syncApps()` to pull app metadata (id, slug, name, navigation) from `/dashboard`.
  - **Dashboard**: Switched `DashboardRepository` to fetch from `apps` table instead of `tables`.
  - **AppShell**: Verified `useAppShellLogic` handles App ID resolution (defaults to first table) and Sidebar allows switching tables.
- **Result**: Dashboard now correctly shows "Rumah" as the App. Internally navigates to "master sls" form by default.
- **Verified**: `vue-tsc --noEmit` passed (exit code 0).

### 2026-02-22: MapView Component Refactoring

- **Problem**: `MapView.vue` had grown to ~800 lines, violating single-responsibility principles.
- **Solution**: Decomposed the component into utilities (`mapCoordinates`, `mapStyles`, `mapColorResolver`), composables (`useMapUserLocation`, `useMapInstance`, `useMapGeoJson`, `useMapLayers`, `useMapPopup`), and sub-components (`MapContainer`, `MapListPanel`).
- **Result**: `MapView.vue` operates purely as an orchestrator (~130 lines).
- **Verified**: `vue-tsc --noEmit` passed (exit code 0) and local linting on the Map components reported 0 errors.

### 17 April 2026 - Smart Update System & Version Synchronization
- **Smart Update System (PWA & Android)**:
    - **Logic**: Diimplementasikan `UpdateService` di `apps/client` yang melakukan polling ke `version.json` setiap 15 menit.
    - **Build-Time Injection**: Menggunakan konstanta global `__APP_VERSION__` dan `__BUILD_TIMESTAMP__` via Vite `define` untuk identifikasi versi yang akurat (menghindari error property access `window`).
    - **Hardened Reload**: Pada mode PWA, sistem menggunakan *cache-busting* (`?reload_v=timestamp`) saat melakukan reload aplikasi untuk memaksa browser mengambil `index.html` terbaru dari server.
    - **Native Safety**: Mendeteksi platform via `Capacitor.isNativePlatform()`. Jika Native, update diarahkan ke GitHub Releases guna menghindari modifikasi URL internal yang berisiko pada mobile WebView.
    - **Data Integrity**: Filter `SyncService.getUnsyncedCount()` ditambahkan pada `UpdateSheet.vue`. Update diblokir jika ada data lokal yang belum tersinkronisasi ke backend untuk mencegah data loss.
- **Monorepo Version Syncing**:
    - **Mechanism**: Menemukan & menguji `scripts/sync-version.mjs` sebagai jembatan sinkronisasi versi.
    - **Release Please Fix**: Menyelaraskan disconnect antara Release Please (yang hanya mengubah `package.json`) dengan Android Native (`build.gradle`). Script sync ini kini menyamakan `versionName` dan `versionCode` secara otomatis di seluruh monorepo.
- **Vite ESM Docker Fix**: Memperbarui script `version-gen` agar menggunakan `fs.readFileSync` (bukan `require`) supaya kompatibel dengan lingkungan production Docker ESM yang ketat.
- **Build Hardening**: Menyelesaikan 9 error TS kritis termasuk *verbatimModuleSyntax*, null-safety pada `firstItem`, dan *index signature* pada `ExpressionContext`.

### 07 July 2026 - Docker Rebuild Requirements, Vue Reactivity Loop & F7 Transition Safety
- **Docker Backend Image Baking**:
    - **Constraint**: `docker-compose.dev.yml` untuk `backend` didasarkan pada `Dockerfile.prod` dan tidak me-mount kode sumber PHP (`apps/backend`) ke dalam container secara dinamis.
    - **Impact**: Perubahan kode lokal (seperti file routes `api.php` dan Controller) tidak akan tersinkronisasi otomatis ke container. Menjalankan request akan memicu `405 Method Not Allowed` atau `404 Not Found`.
    - **Resolution**: Setiap kali melakukan perubahan kode backend, jalankan perintah rebuild: `docker compose -f docker-compose.dev.yml up -d --build backend`.
- **Vue Watch Array Reference Trap**:
    - **Reactivity Trap**: Menulis watcher seperti `watch(() => [appStore.currentApp?.id], ...)` akan membuat array baru di setiap daur evaluasi reaktivitas Vue.
    - **Impact**: Perbandingan memori array yang selalu berbeda menyebabkan watcher terpicu secara rekursif tak terbatas (Infinite Request Loop).
    - **Resolution**: Pantau variabel secara primitif langsung: `watch(() => appStore.currentApp?.id, ...)`.
- **Framework7 Vue Transition Safety**:
    - **Router Lock**: Memicu navigasi `router.navigate()` di dalam hook `onMounted` Vue saat halaman sedang melakukan transisi masuk dapat menyebabkan konflik transisi internal pada router Framework7, berujung pada loop unmount/remount halaman.
    - **Resolution**: Jalankan navigasi pengalihan rute/redirect pada event **`onPageAfterIn`** (di mana halaman telah selesai bertransisi masuk dan status router sudah dalam keadaan idle/siap).

- **Framework7 Vue Toggle Event Loop Gotcha**:
    - **Reactivity Trap**: Komponen `<f7-toggle>` di Framework7 Vue memicu event `@toggle:change` (atau `@change`) baik saat pengguna melakukan klik interaktif maupun saat properti `:checked` diperbarui secara programatis (misal, saat inisialisasi state awal atau pembaruan store).
    - **Impact**: Jika event handler melakukan pembaruan status ke server (via API `PUT`) yang kemudian memperbarui store dan properti `:checked` kembali, hal ini akan memicu event `@toggle:change` secara terus-menerus dalam putaran tak terbatas (Infinite Request Loop).
    - **Resolution**: Selalu tambahkan kondisi pembanding (guard) di dalam event handler untuk keluar lebih awal (`return`) jika nilai event baru sama dengan status store/lokal saat ini: `if (!!storeValue === checkedState) return;`.

- **Client Delta Sync App Deletion**:
    - **Problem**: Saat aplikasi dihapus di backend (soft-delete), aplikasi tersebut tetap muncul di dashboard client setelah proses sinkronisasi (Sync).
    - **Root Cause**: Backend menyertakan ID aplikasi yang dihapus ke dalam array `deleted_apps` pada respons API `/dashboard`. Namun, pada client, `SyncService.pullGlobal()` tidak meneruskan `deleted_apps` ke fungsi `cleanupOrphansAndTombstones()`, dan fungsi tersebut sendiri hanya menghapus data dari tabel `tables` (tidak menyentuh tabel `apps`, `assignments`, atau `responses`).
    - **Resolution**: Mengubah `pullGlobal()` untuk meneruskan `res.deleted_apps`, dan memperbarui `cleanupOrphansAndTombstones()` untuk menghapus data aplikasi yang terdaftar di `deleted_apps` secara berjenjang (menghapus data di tabel `apps`, `tables`, `table_versions`, `assignments`, dan `responses` terkait) guna menghindari data yatim (*orphaned data*) di database lokal SQLite.

### 08 July 2026 - PWA SW SkipWaiting, Nginx Anti-Cache, MySQL JSON Filters, Laravel Touch & Release Please Manifest Syncing
- **PWA Update Loop & Service Worker SKIP_WAITING**:
    - **Problem**: Pengguna mengklik tombol "Update & Restart" namun modal sheet update `0.2.x` terus-menerus muncul kembali (loop).
    - **Root Cause**: Browser terus-menerus memuat berkas JS/HTML lama dari *Cache Storage* lokal yang dikontrol oleh Service Worker lama yang berstatus `waiting` (menunggu seluruh tab ditutup).
    - **Resolution**: Memodifikasi `UpdateService.performUpdate()` untuk secara aktif mengirim pesan `{ type: 'SKIP_WAITING' }` ke Service Worker yang sedang menunggu (`reg.waiting`), memaksanya segera aktif dan mengklaim PWA client sebelum melakukan reload halaman.
- **Nginx Anti-Cache for index.html (Best Practice 2026)**:
    - **Problem**: Parameter reload PWA (`?reload_v=timestamp`) dilewati browser karena Chrome secara heuristik meng-cache file `index.html` jika tidak dilarang oleh server.
    - **Resolution**: Menambahkan header `Cache-Control "no-cache, no-store, must-revalidate";` secara khusus pada lokasi root `/` di `apps/client/nginx.conf`. Hal ini menjamin file entry `index.html` selalu diperiksa keasliannya ke server, sementara aset JS/CSS hasil hashing Vite tetap aman di-cache selamanya.
- **Advanced JSON Filtering (LOWER & CAST AS DECIMAL)**:
    - **Feature**: Implementasi pencarian dinamis data pengisian (pada kolom JSON `prelist_data` atau `responses.data`) secara raw di backend MySQL.
    - **Implementation Details**: 
      - Menggunakan operator pointer database Laravel (`->`) untuk menyaring isi JSON.
      - **Case-Insensitive Query**: Membungkus field json dengan fungsi **`LOWER()`** dan membandingkannya dengan `strtolower($value)` untuk pencarian teks yang fleksibel.
      - **Numeric Casting Query**: Melakukan casting value string di dalam JSON menggunakan **`CAST(... AS DECIMAL(10,2))`** agar operator perbandingan angka (`>`, `<`) dievaluasi secara matematika presisi, bukan secara teks (alfabetis).
- **Laravel Touch & Mass-Assignment Bypass**:
    - **Problem**: Pemanggilan `$assignment->update(['updated_at' => now()])` gagal memperbarui kolom `updated_at` di database server secara diam-diam.
    - **Root Cause**: Laravel memblokir pembaruan kolom `updated_at` via mass-assignment `update()` karena kolom tersebut tidak terdaftar di array properti `$fillable` model `Assignment.php`.
    - **Resolution**: Gunakan method bawaan Eloquent **`$assignment->touch()`** (atau set properti langsung `$assignment->updated_at = now();` diikuti `$assignment->save()`) yang dirancang khusus untuk memintas (bypass) proteksi mass-assignment dan memaksa update timestamp database.
- **Release Please Manifest Syncing**:
    - **Problem**: Bot rilis otomatis `release-please` di GitHub Actions berhenti/menolak membuat Pull Request rilis baru secara otomatis.
    - **Root Cause**: Terjadi ketidakcocokan (*version mismatch*) antara berkas `.release-please-manifest.json` yang masih mencatat versi lama (`0.1.68`) dengan berkas `package.json` lokal yang telah kita bump manual ke `0.2.x`.
    - **Resolution**: Selalu selaraskan nomor versi di berkas manifest `.release-please-manifest.json` secara manual ketika melakukan bump versi paksa pada `package.json` agar Release Please dapat melanjutkan perhitungan rilis secara aman.

### 17 July 2026 - Branch Syncing & Git Rebase
- **Git Rebase and Stash Conflict Resolution**:
    - **Goal**: Synchronize local `main` branch with `origin/main` (behind by 130 commits).
    - **Resolution**:
        - Stashed local uncommitted changes.
        - Performed `git rebase origin/main` to fast-forward local `main` to the latest release (`0.2.9`).
        - Popped the stash, which caused merge conflicts in several files: `cors.php`, `api.php`, `ExportController.php`, `DashboardController.php`, `TableController.php`, `SyncService.ts`, and `gemini.md`.
        - Resolved conflicts in `cors.php` and `ExportController.php` by choosing the cleaner upstream implementation.
        - Resolved conflicts in `api.php` by merging the impersonation route from the stash.
        - Resolved conflicts in `DashboardController.php` and `TableController.php` by keeping the upstream's active app filters and the cleaner `hasAppAccess` logic.
        - Resolved conflicts in `SyncService.ts` and `gemini.md` by checking out upstream (ours) versions, as the local stashed changes in `SyncService.ts` were old pre-refactored implementations of methods that are now successfully extracted into separate helper files (`TableSyncHelpers.ts` & `AssignmentSyncHelpers.ts`).
        - Cleaned up the stash stack by dropping the conflicted WIP stash.

### 17 July 2026 - Port Conflict Resolution & Documentation Audit
- **Port Conflict Analysis & Resolution**:
    - **Problem**: Default ports (`8090` for backend, `3000`/`8000` for client, `3001`/`8001` for editor) conflicted with active host processes: Wondershare's `WsToastNotification` on port `8090`, `fasih-nexus-vpn` on ports `3000`/`8000`, and `bps-mcp-server` on ports `3001`/`8001`.
    - **Resolution**: Shifted all monorepo development ports to a completely free range: Backend API to `9980`, Client App to `9981`, and Editor App to `9982`.
    - **Files Updated**: Updated `docker-compose.dev.yml`, client & editor `.env.docker-web` configurations, client `.env.docker-android` emulator settings, `AppSettingsPanel.vue` (for swap join links), and startup scripts (`start-dev-docker.ps1`, `start-android-docker.ps1`, `start-dev-docker.sh`).
- **Documentation & Script Path Audit**:
    - **Problem**: Documentation files (`QUICKSTART.md`, `DOCKER_DEV.md`, and `docs/WORKFLOW_AND_DEBUGGING.md`) contained outdated or mismatched port references. Batch script wrappers (`start-dev-docker.bat`, `start-android-docker.bat`, `stop-dev-docker.bat`, `restart-android.bat`, `dump-structure.bat`, and `detect-large-files.bat`) had invalid relative paths (`%~dp0scripts\...`) because they were run from within the `scripts/` directory itself.
    - **Resolution**: Updated all documentation to reflect the new port layout (`9980`, `9981`, `9982`). Fixed all relative script path bugs in the batch wrappers to prevent execution failures when cloned fresh.

### 17 July 2026 - Editor Codemirror Import & TypeScript Build Fixes
- **Vite Import Resolution & Codemirror Dependency**:
    - **Problem**: Vite failed to resolve import `@codemirror/autocomplete` inside `useSchemaAutocomplete.ts` during runtime/build. Additionally, TypeScript failed on `@codemirror/view`'s `Extension` type import (as it is not exported from `@codemirror/view`).
    - **Resolution**: Added `@codemirror/state` directly to `apps/editor/package.json` dependencies and ran `pnpm install`. Refactored `useSchemaAutocomplete.ts` to import `Extension` from `@codemirror/state` directly.
- **Strict TypeScript Type Safety Fixes**:
    - **Problem**: Build errors on `editor.types.ts` where `FieldType` was declared locally but not exported to consuming files. Modulo arithmetic operations on `app.id` in `AppsPage.vue` failed since `app.id` was typed as `string | number`. Parameter `payload` type on `appStore.createApp` was incompatible with the dynamically constructed object in `AppsPage.vue`.
    - **Resolution**: Explicitly exported `FieldType` from `editor.types.ts`. Safely parsed/casted `app.id` using `parseInt`/`Number` before doing modulo operations in `AppsPage.vue`. Updated `createApp` signature inside `app.store.ts` to include optional fields (`start_date`, `end_date`, `expired_behavior`) and declared the payload type in `AppsPage.vue` cleanly.

### 17 July 2026 - Docker Backend Upload Limit Resolution (500 Error Fix)
- **PHP File Upload Configuration Path**:
    - **Problem**: Uploading a ~20.8MB Excel file to `/api/excel/upload` failed with `500 Internal Server Error` due to PHP's default constraints: `upload_max_filesize = 2M` and `post_max_size = 8M`. Our custom `upload.ini` (designed to increase limits to 100MB) was copied to `/usr/local/etc/php/conf.d/99-upload.ini` in `Dockerfile.prod`, but FrankenPHP's static binary actually scans `/etc/frankenphp/php.d` for additional `.ini` files. Thus, the custom limits were completely ignored.
    - **Resolution**: Updated `apps/backend/Dockerfile.prod` to copy `upload.ini` to `/etc/frankenphp/php.d/99-upload.ini`. Rebuilt and recreated the backend container via `docker compose -f docker-compose.dev.yml up -d --build backend`, successfully updating the limits to `100M`.

### 17 July 2026 - Client-Side Chunked File Upload (200MB+ Import Support)
- **Chunked File Upload System**:
    - **Problem**: Uploading files larger than 100MB (like a 200MB+ Excel/CSV file) in a single HTTP request triggers request timeouts and is blocked by reverse proxies or Cloudflare's free-tier body size limit.
    - **Resolution**: Implemented client-side chunked file upload:
        - **Backend**: Added route `POST /api/excel/upload-chunk` and method `uploadChunk()` in `ExcelImportController.php` to save chunks sequentially under `storage/app/chunks/{uuid}/chunk_{index}`. Assembles all chunks in correct order into a final file path under `imports/` once the last chunk is received.
        - **Frontend**: Extended `excelImportService.ts` with `uploadChunked()` to slice raw files into 5MB chunks and transmit them sequentially. Updated `ExcelImportModal.vue` to invoke the chunked upload method, show real-time progress state, and render a styled progress bar showing the upload percentage.

### 17 July 2026 - Layout & Preview Stabilizations (TypeError & Timeout Handling)
- **New Table Layout Generation Crash (TypeError Fix)**:
    - **Problem**: Creating a new table resulted in a blank/white canvas on the right due to a crash in `applySmartDefaults()` inside `useEditorState.ts`. It attempted to populate `smartLayout.views.default.deck` properties, but `defaultLayout` lacked the `views` key completely, causing a `Cannot read properties of undefined (reading 'default')` TypeError.
    - **Resolution**: Updated `defaultLayout` definition inside `useEditorState.ts` to fully initialize the `views.default.deck` structures and actions array, aligning with strict TypeScript definitions.
- **Iframe Connection Timeout Overlay (Outdated Optimize Dep Handler)**:
    - **Problem**: Outdated Vite cache in local development sometimes throws `504 (Outdated Optimize Dep)` on the client app, crashing the iframe preview silently with a white blank screen.
    - **Resolution**: Implemented a connection monitoring system in `LivePreview.vue`. If the client iframe doesn't reply with the `EDITOR_CLIENT_READY` message handshake within 7 seconds, a premium connection overlay is displayed showing: "Preview Offline or Out of Sync", prompting the user with a "Reload Preview" button that manually recreates the iframe source.

### 17 July 2026 - Manual Join Code Entry & APK Join UX Improvements
- **Manual Invitation Code / Link Input**:
    - **Problem**: When a user downloads the APK first and installs it, they cannot join an app via the invitation link because the link opens in the system browser and has no way to pass the invitation token to the installed native app. This left the user stuck with an empty dashboard after logging into the APK.
    - **Resolution**: Implemented a manual invitation join feature in the Client App:
        - **Dashboard Settings Sheet**: Added a "Gabung Aplikasi Baru" list item.
        - **App Gallery**: Added a "+ Gabung Aplikasi" link next to "My Apps" header and a prominent "Masukkan Kode Undangan" button in the empty state.
        - **Dashboard Controller**: Added `triggerJoinApp()` method in `DashboardPage.vue` that displays a native prompt for the user to input the link or code, parses the token (extracting it from the URL if needed), submits the join request to the backend `/api/join`, and automatically triggers a local database sync to fetch the new app metadata and assignments immediately.

### 18 July 2026 - Pusat Unduhan APK & Auto-GitHub Sync (Version 0.2.28)
- **Database System Settings**:
    - **Problem**: Storing system-wide metadata like the latest APK version information in app-specific or local static files is not maintainable, and administrators need a central database configuration layer.
    - **Resolution**: Created a migration for the `system_settings` table to serve as a key-value store, seeding the initial `latest_apk` configuration containing version, url, changelog, and force_update properties.
- **Command & Deployment Sync**:
    - **Problem**: Keeping the backend database updated with the latest compiled APK version and download link from GitHub Releases manually on every build/release is error-prone.
    - **Resolution**: Created a console command `php artisan apk:sync-version` that fetches the latest release data from the GitHub Releases API for `ihkaru/cerdas`. It parses the tag name, selects the `.apk` asset URL, parses markdown list bullets into a JSON changelog array, and caches it in `system_settings`. Integrated this command in the Docker startup script `start-container.sh` with a fail-safe fallback (`|| true`), ensuring the database is automatically up-to-date upon coolify autodeploy.
- **Client App Dashboard Widget**:
    - **Problem**: Users need an easy, clean, and highly visible way to download the latest APK directly on their dashboard after logging in.
    - **Resolution**: Developed a dedicated `ApkDownloadCard.vue` component that:
        - Compares the running local `__APP_VERSION__` with the server's `latest_apk` version.
        - Displays a vibrant, glassmorphic alert card with a pulsating dot and expandable changelog if a new version is available.
        - Shows a clean, minimalist green checkmark badge with a "Download Ulang APK" link if the application is up-to-date.
        - Added background cache syncing in `TableSyncHelpers.ts` to store the latest metadata to localStorage, allowing instant offline availability.

