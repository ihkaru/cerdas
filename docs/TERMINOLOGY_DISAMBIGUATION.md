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

### 2.3. Assignment Status Mapping
* **Database & Eloquent Model:** The `status` enum accepts `'assigned' | 'in_progress' | 'completed' | 'synced'`.
* **Client App UI (`apps/client`):** Maps the database `'assigned'` status to `'pending'` in the UI view state. The `Assignment` interface defines it as:
  ```typescript
  status: 'pending' | 'in_progress' | 'completed' | 'synced';
  ```

---

## 3. Deprecated & Orphaned Fields

### 3.1. Parent-Child Responses (`parent_response_id` / `parentResponseId`)
* **Backend Model (`Response.php`):** Contains a `parent_response_id` field and relations to `parentResponse`/`childResponses`.
* **Shared Types (`responses.ts`):** Mentions `parentResponseId`.
* **Database Schema ([schema-final.sql](database/schema-final.sql)):** **Does not contain** the `parent_response_id` column.
* **Frontend Apps:** **Do not use** `parentResponseId`.

> [!CAUTION]
> Nested/hierarchical forms are handled inside the JSON `data` column of the `responses` table, not through self-referential sql relationships. Treat `parent_response_id` as deprecated code.
