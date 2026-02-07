# Organization Management: Expected User Flows

This document outlines the expected user journeys for managing Organizations and Members in the Cerdas App Editor.

## 1. Accessing Organizations
**Page:** Dashboard / Home
**URL:** `/`

- **User Action**: User logs in and lands on the dashboard.
- **Expected UI**:
    - A "Quick Actions" card labeled **"Organizations"** is visible.
- **Flow**:
    1.  Click **Organizations** card.
    2.  Redirects to `/organizations`.

## 2. Managing Organizations (List & Create)
**Page:** Organizations Page
**URL:** `/organizations`

- **User Action**: View list of owned organizations.
- **Expected UI**:
    - **List Sections**: "My Organizations" (Owner) and "Public Organizations" (Global).
    - **Navbar**: "Add" button (top right).
    - **Searchbar**: Filter organizations by name.

### Flow A: Create New Organization
1.  Click **"Add"** (Plus icon) in navbar.
2.  **Popup Opens**: "Create Organization" form.
3.  Enter **Name** (e.g., "Team West Java") and **Code** (e.g., "TEAM-WJ").
4.  Click **"Create Organization"**.
5.  **Success**: Popup closes, list refreshes, new organization appears in "My Organizations".

### Flow B: Delete Organization
1.  Swipe Left on an organization row (under "My Organizations").
2.  Click **"Delete"** (Red button).
3.  **Confirm**: "Are you sure?".
4.  **Success**: Organization is removed from list.

## 3. Managing Details & Members
**Page:** Organization Details (Dialog)
**URL:** `/organizations` (Overlay)

- **User Action**: Click on an organization row (under "My Organizations").
- **Expected UI**:
    - Popup opens with tabs: **"Details"** and **"Members"**.

### Flow A: Edit Details
1.  Select **"Details"** tab.
2.  Edit Name or Code.
3.  Click **"Save Changes"**.
4.  **Success**: Toast notification "Organization updated".

### Flow B: Manage Members (Reusable Teams)
1.  Select **"Members"** tab.
2.  **View Members**: List of users currently in the organization.
3.  **Add Member**:
    - Enter specific **Email** (e.g., `surveyor01@cerdas.com`) in "Add Member" section.
    - Click **"Add"**.
    - **Success**: User added to list immediately.
4.  **Remove Member**:
    - Click **"Remove"** button next to a user.
    - **Confirm**: "Remove [Name]?".
    - **Success**: User removed from list.

## 4. Using Organization in App (Complex Mode)
**Page:** App Editor -> App Details
**URL:** `/apps/[app-slug]`

- **Prerequisite**: App must be in **Complex Mode**.
- **User Action**: Attach a team to an App.

### Flow: Attach Team
1.  Scroll to **"Participating Organizations"** section.
2.  Click **"Add Organization"**.
3.  **Dialog Opens**: List of available organizations (including the one just created).
4.  **Select**: Click on "Team West Java".
5.  **Success**: Organization is attached to the App.
6.  **Impact**: All members of "Team West Java" **instantly** gain access to this App on their mobile client.
