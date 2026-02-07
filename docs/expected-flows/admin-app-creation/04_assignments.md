# 4. Page: Assignment Management

## Context
**Actor**: Supervisor
**Goal**: Distribute survey targets (Prelist) to Enumerators.
**URL**: `/apps/housing-survey-2026/assignments`

## 4.1 Manual Assignment
**Action**: "Tambah Assignment Manual"

Admin creates specific test cases:

| Case | Target Enumerator | Properties |
| :--- | :--- | :--- |
| **Test Case 1** | `Test User` | **Empty Form**. <br> Name: "Test Case 1: All Empty" <br> City: Bandung (`bdg`) |
| **Test Case 2** | `Test User` | **Pre-filled Form**. <br> Name: "Test Case 2: Pre-filled Basic" <br> Data: John Doe, Age 35, Bogor. |

## 4.2 Bulk Assignment (Upload)
**Action**: "Import CSV" (Simulated by Seeder Loop)

Admin uploads a CSV containing **50 respondents**.

### Distribution Logic (Round Robin):
*   **Enumerator 1** (`Test User`): Receives Assignments #0, #2, #4... (~25 tasks)
*   **Enumerator 2** (`Siti Enumerator`): Receives Assignments #1, #3, #5... (~25 tasks)

### Data Variance:
*   **Provinces**: Distributed between Jabar, Jatim, Bali.
*   **Photos**: ~20% of assignments come with a pre-filled `house_photo` URL.
*   **Status**:
    *   ~30% are marked as `completed` (Simulating done work).
    *   ~70% are marked as `assigned` (To Do).

## 4.3 Monitoring Dashboard
**Page**: "Monitoring"

### Expected Stats:
*   **Total Target**: 52 (50 bulk + 2 manual)
*   **Completion**: ~15/52 (approx 30%)
*   **Map**: Shows pins distributed across 3 provinces (Jabar, Jatim, Bali) + Manual entries (Bandung, Bogor).
