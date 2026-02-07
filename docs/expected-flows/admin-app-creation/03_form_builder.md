# 3. Page: Form Builder (Schema Editor)

## Context
**Actor**: Supervisor
**Goal**: Design the "Kuesioner Utama" (Main Questionnaire).
**URL**: `/apps/housing-survey-2026/schema` (after creation)
**Table Name**: `component-showcase` ("Component Showcase")

## 3.1 Field Configuration

The Admin adds the following fields via the Drag-and-Drop Editor.

### Section 1: Basic Inputs
| Field Key | Label | Type | Settings/Validation |
| :--- | :--- | :--- | :--- |
| `basic_header` | - | HTML Block | Content: "Basic Inputs..." |
| `fullname` | "Full Name" | Text | **Required**, Searchable, Key, Preview. <br> *Warning*: "Nama terlalu pendek" if < 3 chars. |
| `age` | "Age" | Number | **Required**. Min: 0, Max: 120. <br> *Warning*: "Usia produktif" check (<17 or >65). |
| `birthdate` | "Date of Birth" | Date | **Required**. |

### Section 2: Selection Controls
| Field Key | Label | Type | Options |
| :--- | :--- | :--- | :--- |
| `choices_header` | - | HTML Block | Content: "Selection Controls..." |
| `gender` | "Gender" | Radio | `M` (Male), `F` (Female). Searchable. |
| `education` | "Education Level" | Select | `SD`, `SMP`, `SMA`, `S1`, `S2`. |

### Section 3: Rich Media & Sensors
| Field Key | Label | Type | Settings |
| :--- | :--- | :--- | :--- |
| `media_header` | - | HTML Block | Content: "Rich Media & Sensors..." |
| `location` | "Current Location" | GPS | **Required**. High Accuracy. |
| `house_photo` | "House Photo" | Image | **Required**. Max items: 3. |
| `signature` | "Signature" | Signature | **Required**. |

### Section 4: Nested Form (Family)
| Field Key | Label | Type | Sub-Fields |
| :--- | :--- | :--- | :--- |
| `family_members` | "Family Members" | Nested Form | 1. `member_name` (Text)<br>2. `member_age` (Number, Warning if > parent)<br>3. `member_relation` (Select: Head, Spouse, Child...)<br>4. `vacation_history` (Nested Level 2) |

### Section 5: Logic & Calculations
| Field Key | Label | Type | Logic Formula |
| :--- | :--- | :--- | :--- |
| `family_count` | "Total Family" | Number (Readonly) | `row.family_members.length` |
| `province` | "Province" | Select | Jabar, Jatim, Bali |
| `city` | "City" | Select | Options depend on `province` (Cascading Select). |
| `total_score` | "Total Score" | Number (Readonly) | `(item_a + item_b) * 10` |
| `conditional_show` | "Secret Field" | Text | Show only if `trigger_options === 'show'` |

## 3.2 View Configuration
Once schema is saved, Admin configures **Views**:

1.  **List View (Default)**:
    *   **Type**: Deck
    *   **Grouping**: By Province, City
    *   **Card Info**: Shows `fullname`, `description`, `house_photo`.
    *   **Actions**: Open, Delete, Complete.

2.  **Map View**:
    *   **Type**: Map
    *   **Source**: `location` (GPS field)
    *   **Label**: `fullname`

## 3.3 Publishing
*   Click **"Publish"**.
*   **Version**: 1 creates `TableVersion` 1.
*   Status becomes **Published/Active**.
