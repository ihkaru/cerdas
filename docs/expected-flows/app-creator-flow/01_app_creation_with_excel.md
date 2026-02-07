# 1. Page: App Creation & Data Import

## Context
**Actor**: App Creator / Admin
**Goal**: Create a new application and import data source from an Excel file to generate schema.
**URL**: `/apps/create` -> `/apps/{id}/editor`

## 1.1 App Creation
**Page**: "Create New Application"

| Field Label | Input Type | Value | Notes |
| :--- | :--- | :--- | :--- |
| **App Name** | Text | `Sales Tracker 2026` | Public name of the app. |
| **Description** | Text Area | `Tracking Sales Data` | Optional description. |
| **Mode** | Select | `Simple` | Select "Simple Mode" for direct access. |
| **Slug** | *Auto-generated* | `sales-tracker-2026` | generated from name |

### Expected Outcome
*   App is created.
*   Redirect to **App Editor** specific to the created app.

## 1.2 Data Source Setup
**Page**: App Editor -> Data Tab
**Action**: Click "Add Data Source" / "New"

### Modal: "New Data Source"
**Step 1: Source Type Selection**
User is presented with options:
1.  **Database (Backend)** - *Selected/Active*
2.  **Google Sheet (2-way binding)** - *Disabled/Coming Soon*

**Step 2: Database Configuration**
User provides:
*   **Table Name**: `sales_data` (Internal name for the table)
*   **Label**: `Sales Data` (Display name)

## 1.3 Excel Import & Schema Inference
**Feature**: "Import Structure from Excel"
**Location**: Within Data Source creation or immediately after.

### Workflow:
1.  **Upload Excel**: User clicks "Upload Excel" and selects a `.xlsx` or `.csv` file.
2.  **Select Sheet**:
    *   System reads the file and lists available sheets.
    *   User selects the target sheet (e.g., "Sheet1" or "Q1 Sales").
3.  **Column Preview & Mapping**:
    *   System reads the first row as headers.
    *   System samples data rows to infer types (Text, Number, Date, Boolean).
    *   **Default Type**: `Text` (safe fallback).
    *   **Primary Key Check**:
        *   System checks for a unique ID column (e.g., `id`, `uuid`, `code`).
        *   If no PK found, system suggests adding a generated `id` column or selecting a unique column manually.
4.  **Data Pre-fill**:
    *   If rows exist, they are imported as initial data for proposed table.

### Example Excel Structure:
| Product Name | Category | Price | Stock |
| :--- | :--- | :--- | :--- |
| Widget A | Gadgets | 1000 | 50 |
| Widget B | Gadgets | 2500 | 20 |

### Inferred Schema:
| Column | Inferred Type | Settings |
| :--- | :--- | :--- |
| `product_name` | Text | Required |
| `category` | Text | Select (maybe?) |
| `price` | Number | |
| `stock` | Number | |

### Expected Outcome
*   New Table `sales_data` created in App Schema.
*   Columns created based on Excel headers.
*   Data imported into the table.
*   Editor updates to show the new table in Data tab.
