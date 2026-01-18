# AppSheet UI Analysis & Database Map

> Analysis based on AppSheet Editor Screenshots.

## 1. Customizable UI Elements (Editor Capabilities)

The AppSheet editor allows users to define **Views** that sit on top of **Data Tables**.

### A. View Configuration
-   **View Name**: User-friendly label.
-   **Data Source**: Selects which Table (or Slice) this view displays.
-   **View Type**: Determines the rendering engine.
    -   *Collection Types*: Deck, Table, Gallery, Map, Chart, Calendar.
    -   *Single Record Types*: Detail, Form, Card.
    -   *Special Types*: Dashboard (Meta-view), Onboarding.
-   **Position**: Where it appears in the navigation (Primary specific slot, Menu, or Reference/Hidden).

### B. View Options (Type-Specific)
*Example (Map View):*
-   **Map Column**: Which column contains the Lat/Long data.
-   **Secondary Data**: Ability to overlay a second table.
-   **Map Style**: Road, Aerial, Automatic.
-   **Location Mode**: Tracking frequency (High/Normal).

---

## 2. Column/Field Editor (Data Tab)

> Based on "Rumah Mempawah" Editor Screenshot (Jan 2026)

AppSheet's Data Tab uses a **spreadsheet-like table editor** for configuring columns/fields.

### A. Editor Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header Bar                                                                   │
│ Source: [Data Source Name]  Qualifier: Appsheet  DataSource: google         │
│ Source Type: Sheets  Columns: 24                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Column Configuration Table                                                   │
├──────────────────┬────────┬─────┬───────┬─────────┬───────┬──────────┬──────┤
│ NAME             │ TYPE ▼ │KEY? │LABEL? │ FORMULA │ SHOW? │EDITABLE? │REQ?  │
├──────────────────┼────────┼─────┼───────┼─────────┼───────┼──────────┼──────┤
│ _RowNumber       │ Number │ ☐   │ ☐     │         │ ☐     │ ☐        │ ☐    │
│ Provinsi         │ Text ▼ │ ☑   │ ☑     │ =       │ ☑     │ ☑        │ ☐    │
│ Kabupaten/Kota   │ Text ▼ │ ☐   │ ☐     │ =       │ ☑     │ ☑        │ ☐    │
│ Kecamatan        │ Text ▼ │ ☐   │ ☐     │ =       │ ☑     │ ☑        │ ☐    │
│ Desa/Kelurahan   │ Text ▼ │ ☐   │ ☐     │ =       │ ☑     │ ☑        │ ☐    │
│ Nama*            │ Text ▼ │ ☐   │ ☐     │ =       │ ☑     │ ☑        │ ☐    │
│ Nomor KTP        │ Text ▼ │ ☐   │ ☐     │ =       │ ☑     │ ☑        │ ☐    │
│ Alamat**         │ Text ▼ │ ☐   │ ☐     │ =       │ ☑     │ ☑        │ ☐    │
│ ...              │ ...    │ ... │ ...   │ ...     │ ...   │ ...      │ ...  │
└──────────────────┴────────┴─────┴───────┴─────────┴───────┴──────────┴──────┘
│                                                   │ Preview Panel (Right)   │
│                                                   │ ├── All                 │
│                                                   │ ├── ANJONGAN >          │
│                                                   │ ├── JONGKAT >           │
│                                                   │ ├── MEMPAWAH HILIR >    │
│                                                   │ └── ...                 │
└───────────────────────────────────────────────────┴─────────────────────────┘
```

### B. Column Properties (Per-Column Configuration)

| Property | UI Type | Description | Cerdas Equivalent |
|----------|---------|-------------|-------------------|
| **NAME** | Text (readonly) | Column name from data source | `field.name` |
| **TYPE** | Dropdown | Data type selector | `field.type` |
| **KEY?** | Checkbox | Is this a primary key | `field.key` |
| **LABEL?** | Checkbox | Use as display label | `field.preview` |
| **FORMULA** | Formula Editor (=) | Computed value | `field.formula_fn` |
| **SHOW?** | Checkbox | Visible in forms | `field.show_if` (default true) |
| **EDITABLE?** | Checkbox | Can be modified | `field.editable_if` |
| **REQUIRED?** | Checkbox | Must have value | `field.required` / `required_if_fn` |
| **INITIAL VALUE** | Text/Formula | Default value | `field.initialValue` |
| **DISPLAY NAME** | Text | Human-readable label | `field.label` or `field.displayName` |

### C. Available Type Options (from Screenshot)

Based on the dropdown shown:
- `Number` - Numeric values
- `Text` - String values
- *(Other types available but not shown)*

**Full AppSheet Type List** (for reference):
- Text, LongText, Name, Email, Phone, URL
- Number, Decimal, Percent, Price
- Date, Time, DateTime, Duration
- Yes/No (Boolean)
- Enum, EnumList (Single/Multi select)
- Ref (Reference to another table)
- Image, Signature, Drawing, File
- LatLong (GPS coordinates)
- Address, ChangeLocation
- Color, Progress

### D. Key Observations for Editor Design

1. **Table-Based Editing**: Unlike form-based editors, AppSheet uses a spreadsheet-style table where each row is a field and columns are properties.

2. **Inline Checkboxes**: Boolean properties (KEY, LABEL, SHOW, EDITABLE, REQUIRED) use simple checkboxes for quick toggling.

3. **Type Dropdown**: Each field has a type dropdown, not requiring a separate panel.

4. **Formula Indicator**: The "=" symbol appears in FORMULA column when a formula exists, clicking opens formula editor.

5. **Live Preview**: Right panel shows live preview of the data with grouping applied.

6. **Scrollable Columns**: The table supports horizontal scrolling for additional columns (INITIAL VALUE, DISPLAY NAME, etc.)

---

## 3. Database Representation Strategy

To achieve this flexibility in **Cerdas**, we need to expand our Schema beyond just "Forms". We need an **"App Definition"** layer.

### JSON Structure Proposal (Updated)

The `AppSchemaVersion` stores both `schema` (fields) and `layout` (views):

```json
{
  "schema": {
    "fields": [
      {
        "name": "provinsi",
        "type": "text",
        "label": "Provinsi",
        "displayName": "Provinsi",
        "key": true,
        "preview": true,
        "searchable": true,
        "required": false,
        "show_if": true,
        "editable_if": true,
        "initialValue": null,
        "formula_fn": null
      },
      {
        "name": "kecamatan",
        "type": "select",
        "label": "Kecamatan",
        "options_fn": "return ctx.utils.lookupList('kecamatan', ctx.row.provinsi);",
        "required": true,
        "show_if_fn": "return ctx.row.provinsi !== '';"
      }
    ]
  },
  "layout": {
    "app_name": "Rumah Mempawah",
    "groupBy": ["kecamatan", "desa"],
    "views": {
      "default": {
        "type": "deck",
        "title": "Daftar Rumah",
        "deck": {
          "primaryHeaderField": "nama",
          "secondaryHeaderField": "alamat",
          "imageField": "foto_rumah"
        }
      }
    }
  },
  "settings": {
    "icon": "house",
    "actions": {
      "header": [...],
      "row": [...],
      "swipe": { "left": [...], "right": [...] }
    }
  }
}
```

### Database Schema Compatibility
-   **Current**: `AppSchemaVersion` table has `schema` and `layout` JSON columns.
-   **Verdict**: **Flexible Enough**. No new tables needed.

---

## 4. Editor UI Recommendations for Cerdas

### Option A: Table-Based Editor (AppSheet Style)
**Pros**: Familiar to spreadsheet users, compact, quick editing
**Cons**: More complex to implement, less space for advanced options

```
┌─────────────────────────────────────────────────────────────────┐
│ [+ Add Field]  [Import from CSV]  [Preview]                     │
├──────────────┬────────┬─────┬──────┬──────┬──────┬─────────────┤
│ NAME         │ TYPE ▼ │SHOW │EDIT  │REQ   │LOGIC │ ACTIONS     │
├──────────────┼────────┼─────┼──────┼──────┼──────┼─────────────┤
│ fullname     │ text   │ ☑   │ ☑    │ ☑    │ ƒ    │ [⚙] [🗑]   │
│ age          │ number │ ☑   │ ☑    │ ☐    │      │ [⚙] [🗑]   │
│ province     │ select │ ☑   │ ☑    │ ☑    │      │ [⚙] [🗑]   │
│ city         │ select │ ☑   │ ☑    │ ☐    │ ƒ    │ [⚙] [🗑]   │
└──────────────┴────────┴─────┴──────┴──────┴──────┴─────────────┘
                                                    ↓ Click [⚙]
                                        ┌───────────────────────────┐
                                        │ Field Settings Modal      │
                                        │ ├── Basic (name, label)   │
                                        │ ├── Options (for select)  │
                                        │ ├── Logic (show_if, etc)  │
                                        │ └── Advanced (formula)    │
                                        └───────────────────────────┘
```

### Option B: List + Detail Panel (Simpler)
**Pros**: Easier to implement, more space for options
**Cons**: More clicks to edit, less compact

```
┌─────────────────┐ ┌─────────────────────────────────────────────┐
│ FIELDS          │ │ FIELD DETAILS                               │
├─────────────────┤ ├─────────────────────────────────────────────┤
│ ▸ fullname      │ │ Name: fullname                              │
│   age           │ │ Label: [Full Name              ]            │
│   province      │ │ Type: [text ▼]                              │
│   city          │ │                                             │
│                 │ │ ☑ Show in Form                              │
│ [+ Add Field]   │ │ ☑ Editable                                  │
│                 │ │ ☑ Required                                  │
│                 │ │                                             │
│                 │ │ [Advanced Logic...]                         │
└─────────────────┘ └─────────────────────────────────────────────┘
```

### Recommendation
Start with **Option B** (List + Detail Panel) as it's simpler to implement and allows more room for the complex logic editors (show_if_fn, formula_fn). Can evolve to table-based later.

---

## 5. Implementation Roadmap

| Phase | Feature | Priority |
|-------|---------|----------|
| 1 | Field List CRUD (add, edit, delete, reorder) | 🟢 High |
| 1 | Field Type Selection with type-specific options | 🟢 High |
| 1 | Basic Properties (name, label, required, show) | 🟢 High |
| 2 | Options Editor (for select/radio types) | 🟢 High |
| 2 | Logic Editor (show_if_fn, editable_if_fn) | 🟡 Medium |
| 2 | Formula Editor (formula_fn) | 🟡 Medium |
| 3 | View Configuration (groupBy, deck options) | 🟡 Medium |
| 3 | Actions Configuration | 🟡 Medium |
| 4 | Nested Form Editor (recursive field editor) | 🔴 Low |
| 4 | Import/Export Schema | 🔴 Low |

---

## 6. Reference Screenshots

### View Editor
> Source: Previous analysis

### Column/Data Editor  
> Source: "Rumah Mempawah" - Monitoring Rumah Tidak Layak Huni - Kabupaten Mempawah
> Captured: January 2026

Key elements visible:
- Table-based field editor with checkbox columns
- Type dropdown per field
- Formula indicator (=)
- Live preview panel with grouping structure
- 24 columns defined
- Data source: Google Sheets via Appsheet qualifier
