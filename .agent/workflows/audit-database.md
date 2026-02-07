---
description: Audit database schema against architectural requirements (UUIDs, JSON, Soft Deletes)
---

# Database Schema Audit Workflow

This workflow audits the Laravel database migrations to ensure they align with the "Cerdas App Editor" architecture defined in `docs/FORM_EDITOR_WORKFLOW.md`.

## 1. Preparation

1.  **List Migrations:**
    Run `ls -F apps/backend/database/migrations/` to see the current migration history.
    *Goal:* Identify the history of renames (`app_schemas` -> `forms` -> `tables`) and determine a strategy for "squashing" them into a clean state.

## 2. Structural Audit Checks

For each major entity (`apps`, `tables`, `table_versions`, `views`, `assignments`, `organizations`, `users`), verify the following:

### A. UUID Adoption
*   **Requirement:** All syncable entities MUST have a UUID.
*   **Check:** Does the table have an `id` (UUID) or `uuid` (String/UUID) column?
*   **Goal:** Move towards `id` as UUID Primary Key. If `id` is Integer, ensure a unique `uuid` column exists for offline sync.

### B. JSON Column Usage
*   **Requirement:** Flexible configuration data must be stored in JSON columns.
*   **Check:**
    *   `apps.navigation` -> JSON
    *   `tables.fields` (or `table_versions.fields`) -> JSON
    *   `tables.settings` -> JSON
    *   `views.config` -> JSON
    *   `assignments.prelist_data` -> JSON
    *   `responses.data` -> JSON

### C. Soft Deletes
*   **Requirement:** Offline-first sync requires Soft Deletes to track deletions.
*   **Check:** Do the following tables have a `deleted_at` column?
    *   `assignments`
    *   `responses`
    *   `tables` (Optional, but good for recovery)
    *   `views` (Optional)

### D. Foreign Key Constraints
*   **Requirement:** Data integrity.
*   **Check:** Are foreign keys explicitly defined?
    *   `assignments.table_id` references `tables.id`
    *   `views.app_id` references `apps.id`
    *   `table_versions.table_id` references `tables.id`

## 3. Migration Hygiene (Squashing)

*   **Goal:** Replace the chain of "Create -> Rename -> Rename" migrations with a single "Create Final Schema" migration set.
*   **Action:** Identify which files can be consolidated.
    *   *Example:* Merge `create_app_schemas` + `rename_app_schemas_to_forms` + `rename_forms_to_tables` into `create_tables_table`.

## 4. Execution

1.  **Analyze** the migration files content.
2.  **Compare** against the checks above.
3.  **Produce** a `DATABASE_AUDIT_REPORT.md` listing:
    - [ ] Missing UUIDs
    - [ ] Missing Soft Deletes
    - [ ] Improper Column Types
    - [ ] Proposed "Squash" Plan (List of files to delete vs. new files to create)

## 5. Reporting

Create `DATABASE_AUDIT_REPORT.md` with findings and a specific action plan for the user to approve before refactoring.
