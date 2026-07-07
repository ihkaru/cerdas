# Terminology & Schema Disambiguation

This document serves as the Single Source of Truth (SSOT) to bridge naming and data-type differences between the Laravel 12 Backend database and the Vue 3 Frontend (apps/packages) codebase.

Due to the incremental transition from a generic "Form Builder" to a relational "AppSheet-like Table Builder", several historical names and typing discrepancies exist across the monorepo layers.

---

## 1. Core Entity Mapping

The table below maps how core concepts are named across different layers of the codebase:

| Concept | Database / Backend Model | Shared Types (`@cerdas/types`) | Frontend Apps (`apps/client` & `apps/editor`) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **App Wrapper** | `apps` / `App` | `App` | `App` | Top-level workspace container. |
| **App Foreign Key** | `app_id` | `projectId` | `app_id` | Reference to the App parent. |
| **Table Definition** | `tables` / `Table` | `AppSchema` | `Table` / `AppSchema` | The layout and fields of a collection form. Previously named "Form". |
| **Table Foreign Key** | `table_id` | `schemaVersionId` / `appSchemaId` | `table_id` (sometimes `form_id` in legacy comments) | Reference to the parent Table. |
| **Schema Version** | `table_versions` / `TableVersion` | `AppSchemaVersion` | `TableVersion` / `AppSchemaVersion` | A specific immutable or draft version of the table fields. |
| **Field Definitions** | Column `fields` (JSON) | `schema` property | `fields` property | List of input elements (e.g., text, GPS, signature). |

---

## 2. Structural & Field-Level Details

### 2.1. `fields` vs. `schema`
* **In Database & Backend Model:** The JSON column in the `table_versions` table is named `fields`.
* **In `@cerdas/types` (`AppSchemaVersion`):** The field definitions are typed as `schema: Field[]`.
* **In `@cerdas/form-engine` (`AppSchema`) & Client App (`Table`):** The property is named `fields`. 

> [!TIP]
> When defining or handling form field arrays in components or local stores, use **`fields`** instead of `schema` to match the active runtime data from the backend API.

### 2.2. ID Types (UUID Strings vs. Numbers)
* **Backend Database & Eloquent Models:** Almost all entities use UUID string IDs (`char(36)`), auto-generated on creation (e.g., `apps`, `tables`, `table_versions`, `assignments`, `responses`).
* **Shared Types (`@cerdas/types`):** Several legacy definitions type IDs as `number` (e.g. `Assignment.id`, `Response.id`).
* **Active Frontend Code:** Uses `string` for all UUID properties to avoid runtime compilation errors.

> [!WARNING]
> Do not rely on numeric comparison (`id === 0` or similar) for entities. Always treat IDs as string UUIDs.

### 2.3. Assignment Status — Canonical Values

> [!IMPORTANT]
> **Canonical status values** are the single source of truth for `assignments.status` across the entire stack. All frontend components, API filters, and TypeScript types **must** use these exact strings. Legacy aliases (`'pending'`, `'approved'`, `'completed'`) have been removed as of July 2026.

#### Status Flow Diagram

**Simple Mode** (no supervisor review — data goes directly from enumerator to synced):
```
assigned → in_progress → synced
```

**Complex Mode** (supervisor review required before data is accepted):
```
assigned → in_progress → submitted → synced
                                   ↘ rejected → (enumerator revises) → in_progress → submitted
```

#### Canonical Status Reference Table

| Status | Who Sets It | Description | Simple? | Complex? |
| :--- | :--- | :--- | :---: | :---: |
| `assigned` | System / Supervisor | Assignment created but enumerator hasn't started yet | ✅ | ✅ |
| `in_progress` | System (auto on first sync) | Enumerator has submitted at least one response | ✅ | ✅ |
| `submitted` | System (auto after `in_progress`) | Data sent to server and waiting for supervisor review | ❌ | ✅ |
| `synced` | System (simple) / Supervisor (complex) | Final accepted state — data is fully synchronized | ✅ | ✅ |
| `rejected` | Supervisor | Submission rejected and returned to the enumerator for revision | ❌ | ✅ |

#### Layer Consistency Map

| Layer | File | Canonical Values Used |
| :--- | :--- | :--- |
| **Database** | `assignments` table (enum column) | `assigned`, `in_progress`, `submitted`, `synced`, `rejected` |
| **Backend Model** | `Assignment.php` | `markInProgress()`, `markCompleted()`, `markSynced()` helpers |
| **Backend API Filter** | `ResponseController.php` | `submitted`, `synced`, `rejected`, `in_progress`, `assigned` |
| **Backend Stats** | `DashboardController.php` | Uses canonical values directly in queries |
| **TypeScript Type** | `apps/client/src/app/dashboard/types/index.ts` | `'assigned' \| 'in_progress' \| 'submitted' \| 'synced' \| 'rejected'` |
| **Status Helpers** | `statusHelpers.ts` | All 5 values mapped for color + label |
| **Monitoring Panel** | `SubmissionsPanel.vue` | Filter buttons conditioned by `appMode` |
| **Assignment List** | `AssignmentList.vue` | `statusColor()` covers all 5 values |

> [!CAUTION]
> The following legacy aliases are **deprecated and removed**. Do not use them anywhere in the codebase:
> - ~~`'pending'`~~ → use `'assigned'`
> - ~~`'approved'`~~ → use `'synced'`
> - ~~`'completed'`~~ → this was a transitional state; `'synced'` is the terminal state in simple mode, `'submitted'` is the pre-review state in complex mode

---

## 3. Deprecated & Orphaned Fields

### 3.1. Parent-Child Responses (`parent_response_id` / `parentResponseId`)
* **Backend Model (`Response.php`):** Contains a `parent_response_id` field and relations to `parentResponse`/`childResponses`.
* **Shared Types (`responses.ts`):** Mentions `parentResponseId`.
* **Database Schema ([schema-final.sql](database/schema-final.sql)):** **Does not contain** the `parent_response_id` column.
* **Frontend Apps:** **Do not use** `parentResponseId`.

> [!CAUTION]
> Nested/hierarchical forms are handled inside the JSON `data` column of the `responses` table, not through self-referential sql relationships. Treat `parent_response_id` as deprecated code.
