# 2. Page: Create App Wizard

## Context
**Actor**: Supervisor
**Goal**: Configure the core settings of the new survey application.
**URL**: `/apps/create` (or modal trigger from `/dashboard`)

## 2.1 App Details Form
**Modal / Page**: "Create New Application"

| Field Label | Input Type | Value to Input (Based on Seeder) | Notes |
| :--- | :--- | :--- | :--- |
| **App Name** | Text | `Housing Survey 2026` | Public name of the app. |
| **Description** | Text Area | `Demo App for Cerdas Platform` | Visible in app info. |
| **Mode** | Select | `Simple` | "Simple Mode" means direct member assignment (no complex organization hierarchy). |
| **Slug** | *Auto-generated* | `housing-survey-2026` | Generated from App Name. |

## 2.2 Organization & Team
**Section**: Team Setup

| Field | Value | Logic |
| :--- | :--- | :--- |
| **Organization** | `Default Organization` | Selected by default or via dropdown (`default-org`). |
| **Supervisor** | `Budi Supervisor` | Auto-assigned as creator. |
| **Enumerators** | Add Member > `user@example.com` | Adding "Test User" as enumerator. |
| **Enumerators** | Add Member > `enum2@cerdas.com` | Adding "Siti Enumerator" as enumerator. |

### Expected Outcome
*   App is created in database.
*   Redirect to **App Dashboard** / **Form Builder**.
*   `AppMembership` records are created for Supervisor and 2 Enumerators.
