# Cerdas - Project Task Tracker

## Current Phase: Phase 7 - Polish & Production (Stable Release v0.2.37)

### Phase 0: Research & Planning ✅
- [x] Research AppSheet features and capabilities
- [x] Research Framework7 v9.0 + Vue 3 + TypeScript
- [x] Research capacitor-community/sqlite for offline storage
- [x] Gather requirements from Product Manager
- [x] Clarify technical decisions (validation, sync, multi-tenant)
- [x] Create architecture_principles.md (living reference doc)
- [x] Create comprehensive implementation plan
- [x] Get implementation plan approval from PM

### Phase 1: Foundation (Monorepo + Backend Core) ✅
- [x] Setup monorepo structure (pnpm workspaces)
- [x] Initialize Laravel 12 backend (pure API, no Filament, Sanctum Auth)
- [x] Initialize Framework7 + Vue 3 + TypeScript apps (client & editor)
- [x] Design and implement core database schema with UUIDs
- [x] Implement multi-tenant architecture (Organization -> App -> AppMembership)

### Phase 2: Schema Builder & Backend Services ✅
- [x] Dynamic table/column definition system
- [x] Field types implementation
- [x] Validation rules storage (JS closures executed client-side)
- [x] Expression engine design (@cerdas/expression-engine)
- [x] Prelist/Assignment import system (Excel/CSV with chunked upload support)

### Phase 3: Client App Foundation ✅
- [x] Initialize Framework7 + Vue 3 + TypeScript app
- [x] Setup capacitor-community/sqlite (Jeep-SQLite for Web)
- [x] Implement offline-first data layer (DashboardRepository + SQLite)
- [x] Create sync engine (pullGlobal, pushResponses)
- [x] Build authentication flow (Sanctum + AuthStore + Login)

### Phase 4: Dynamic Form Renderer ✅
- [x] Form schema interpreter (FormRenderer)
- [x] Basic field components (text, number, date, select, radio)
- [x] Advanced field components (image capture, GPS/geotagging with accuracy warnings, signature digital)
- [x] Nested form support (NestedFormField.vue with repeatable structures)
- [x] JS closure execution for validation/expressions (integrated with expression-engine)

### Phase 5: Visual No-Code Editor (Web) ✅
- [x] Visual form builder interface (Editor App)
- [x] Field configuration panels (Schema builder)
- [x] Monaco/CodeMirror JSON editor and live schema apply sync
- [x] Live preview system (iframe connection monitoring + fallback overlay)
- [x] Schema versioning (Immutable version publishing)

### Phase 6: Data Sync, Management & Security ✅
- [x] Robust offline sync with conflict handling (Last-Write-Wins)
- [x] SQLite Soft-Delete Sync (automatically cleans up orphaned/tombstoned records upon sync)
- [x] Chunked File Upload (supports large imports up to 200MB+ without size errors)
- [x] Role-Based Access Control (Spatie Laravel Permission in API and AppMembership on client)
- [x] Excel/CSV Export with zip compression for large media files
- [x] Impersonation & secure user access logic

### Phase 7: Polish & Production (Current State) ✅
- [x] Port conflict auto-detection & terminal warnings
- [x] Dynamic API origin fallback for Docker/Coolify deployments
- [x] Pusat Unduhan APK widget (ApkDownloadCard) with automated GitHub release sync command
- [x] IDE Model Table Property Type collision fixes via class-level docblocks
- [x] Clean Release tag name format (vX.Y.Z) for sorted releases list
- [x] Android APK production compile & release workflow automation (Release Please)

### Phase 8: Advanced Future Features (Up next) 🚀
- [ ] **Background Sync**: Automatic silent synchronization when device connectivity is restored.
- [ ] **Barcode/QR Scanner**: Add scanner field type for automated asset/barcode cataloging.
- [ ] **Reference Type Lookup**: Multi-table relationships and dynamic query/lookups between forms.
- [ ] **PDF Generator**: Generate custom styled PDF reports of assignments and print options.
- [ ] **2-Way Google Sheet Sync**: Enable automatic live synchronization with Google Sheets using Webhooks/Schedulers.
