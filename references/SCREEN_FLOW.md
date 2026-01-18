# User Screen Flow & Navigation Guide

This document outlines the user flows, routing logic, and navigation paths for the Cerdas Field Data Collection application. It serves as the reference for implementing routing, guards, and error handling.

## 1. Authentication Flow

**Goal**: Authenticate the enumerator securely to access assignments.
**Route**: `/login`
**Component**: `Login.vue`

### Happy Path
1.  **Initial Load**: User opens the app.
    -   *System Check*: Router Guard checks for valid Access Token in `localStorage`.
    -   *Result*: No token found -> Navigation resolves to `/login`.
2.  **Input**: User enters valid credentials (Email & Password).
3.  **Submission**: User taps "Sign In".
    -   *System Action*: `authStore.login(email, password)` called.
    -   *API Call*: POST `/api/auth/login`.
4.  **Success**:
    -   Server returns Token + User Info.
    -   State stored in `localStorage` + Pinia.
    -   Router navigates to `/` (Dashboard).
    -   Toast/Notification: "Welcome back, [Name]".

### Unhappy Paths
1.  **Invalid Credentials**:
    -   *Server*: Returns 401/422.
    -   *UI*: "Invalid email or password" displayed in alert/toast.
    -   *State*: User remains on Login screen. Input fields preserved (except password).
2.  **Network Error (Offline)**:
    -   *Server*: Unreachable (Connection Refused/Timeout).
    -   *UI*: "Connection failed. Please check your internet."
    -   *Action*: Retry button/mechanism available.
3.  **Already Authenticated**:
    -   User accidentally navigates to `/login`.
    -   Router Guard detects token -> Auto-redirects to `/`.

---

## 2. Dashboard & Synchronization Flow

**Goal**: Overview of tasks and synchronization of data with server.
**Route**: `/`
**Component**: `HomePage.vue`
**Context**: Secure (Requires Auth).

### Happy Path
1.  **Load**: Dashboard initializes.
2.  **Local Data**: `DatabaseService` polls local SQLite for 'Assignments' and 'Apps'.
    -   UI shows "My Assignments" list and "My Apps" grid.
3.  **Manual Sync**: User taps **Refresh/Sync Icon** (Top Right).
    -   *Step 1 (Push)*: Upload pending offline responses to Server.
    -   *Step 2 (Pull)*: Download new Form Schemas and Assignments from Server.
    -   *Step 3 (Update)*: Local SQLite updated.
    -   UI updates to reflect changes.
    -   Toast: "Sync completed successfully."

### Unhappy Paths
1.  **Sync Failed (Network/Server)**:
    -   Sync process throws exception.
    -   Logger records detailed error.
    -   UI Alert: "Sync failed. Working in Offline Mode."
    -   Existing local data remains accessible.
2.  **Token Expired**:
    -   API returns 401 during Sync.
    -   System detects expiry -> Clears Auth Store -> Redirects to `/login`.
3.  **Empty State**:
    -   No assignments assigned.
    -   UI shows friendly "No assignments found" message.

---

## 3. Assignment Execution Flow (Data Entry)

**Goal**: Fill out and submit a specific survey/form.
**Route**: `/assignments/:assignmentId`
**Component**: `AssignmentDetail.vue`
**Props**: `assignmentId` (passed from Route).

### Happy Path
1.  **Selection**: User taps an assignment card (e.g., "Bapak Budi") on Dashboard.
2.  **Navigation**: Router pushes `/assignments/123`.
3.  **Initialization**:
    -   Fetch Assignment Details from Local DB.
    -   Fetch Form Schema from Local DB.
    -   Check for existing Draft/Response.
4.  **Form Interaction**:
    -   `FormRenderer` generates UI based on Schema.
    -   User fills fields.
    -   **Auto-Save**: Changes saved to `responses` table (is_synced=0) every 1s (debounced). UI shows "Saved".
5.  **Completion**:
    -   User taps "Finish".
    -   Confirmation Dialog appears.
    -   User confirms.
    -   Status updated to `completed`.
    -   Navigation pops back to Dashboard.

### Unhappy Paths
1.  **Missing Schema**:
    -   Assignment exists but linked Schema is missing locally.
    -   UI Error Block: "Form definition not found. Please Sync first."
    -   Action Button: "Go Back" or "Sync Now".
2.  **Assignment Not Found**:
    -   Invalid ID passed.
    -   UI Error: "Assignment not found."
    -   Redirect back to Dashboard after timeout or user click.
3.  **Corrupt Data**:
    -   Parsing JSON fails (e.g., `prelist_data` invalid).
    -   UI shows error placeholder but allows attempting to Resync/Reset.

---

## 4. Generic App Flow (Future Expansion)

**Goal**: Access generic app modules defined by schemas.
**Route**: `/app/:schemaId`
**Component**: `AppShell.vue`

### Happy Path
1.  User clicks App Icon (e.g., "RTLH App") on Dashboard.
2.  Navigates to App Shell.
3.  Lists records/entries associated with that Schema.
4.  User can Create New Record or View Existing.

---

## 5. Logout Flow

**Goal**: Securely end session.
**Action**: Click "Logout" Icon on Dashboard.

### Flow
1.  User clicks Logout.
2.  Confirm Dialog: "Are you sure?".
3.  **Action**:
    -   Clear `localStorage` (Token, User).
    -   Reset Pinia Store.
    -   (Optional) Clear sensitive local DB data.
4.  Redirect to `/login`.

---

## Routing Implementation Reference

| Route | Component | Guard | Props | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage` | **Auth** | - | Main Dashboard. Resolves Login if unauth. |
| `/login` | `Login` | Guest | - | Login Screen. |
| `/assignments/:id` | `AssignmentDetail` | **Auth** | `id` | Form Entry. |
| `/sync` | `SyncPage` | **Auth** | - | Dedicated Sync Page. |
