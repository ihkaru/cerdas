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
```
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

## Reference Documents
- `docs/architecture_principles.md` - Full technical principles
- `docs/implementation_plan.md` - Phase-by-phase plan
- `docs/task.md` - Current progress tracker
- `docs/DEVELOPMENT_LIFECYCLE.md` - **Development feedback loop & workflow**
- `references/SCREEN_FLOW.md` - **User Screen Flow & Routing Guide (Happy/Unhappy Paths)**
- `ROADMAP.md` - **Feature Roadmap & Progress Tracker (Live Status)**
- [System Reference & Specification](file:///C:/Users/Admin/.gemini/antigravity/brain/6aa89f4f-fdf3-448d-8799-1234dfbcf31c/system_reference.md) - **Single Source of Truth** for Requirements, Features, and Entity Relationships.

### Process Management Scripts (Root)
- `start-all.bat`: Starts Backend (9980), Client (9981), Editor (9982).
- `stop-all.bat`: **Surgical Stop**. Kills only Cerdas windows & processes. Safe to use.
- `restart-android.bat`: Restarts Android App & captures logs.
- `save-android-log.bat`: Captures current Android logs to `logs/`.

- **Version**: 0.1.0 (Current Stable Draft)

**⚠️ CRITICAL**: Always use `.\stop-all.bat` to stop servers. NEVER use `taskkill` directly - it may close IDE!

## User Memory Notes
- User prefers Indonesian communication
- User is Product Manager, I am fullstack developer + system architect
- User gives standing permission for necessary actions
- User wants strict TypeScript to catch errors early
- Update gemini.md with important changes/progress
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

