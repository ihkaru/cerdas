# 1. Page: Login & Dashboard

## Context
**Actor**: Admin / Supervisor
**Goal**: Log in to the platform and prepare to create a new survey application.
**URL**: `/login`

## 1.1 Login Page
**URL**: `/login`

| Field | Expected Value (Seeder Data) | Notes |
| :--- | :--- | :--- |
| **Email** | `supervisor@cerdas.com` | Using Supervisor account for App Creation workflow. |
| **Password** | `password` | Default seeder password. |

### Expected Outcome
*   Redirect to **Dashboard** (`/dashboard`).
*   User is authenticated with `Organization: Default Organization` context.

---

## 1.2 Dashboard
**URL**: `/dashboard`

### Expected UI Elements
1.  **Welcome Message**: "Welcome, Budi Supervisor"
2.  **App List**:
    *   Ideally empty if this is a fresh start, OR
    *   Shows existing apps if seeders ran previously (e.g., *Housing Survey 2026* if `ComponentShowcaseSeeder` already ran).
3.  **Create Function**:
    *   Button: **"Buat Aplikasi Baru"** (Create New App)
