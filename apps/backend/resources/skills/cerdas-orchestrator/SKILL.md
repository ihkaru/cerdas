---
name: cerdas-orchestrator
version: 1.1.0
description: End-to-end autonomous survey, census, and statistical data collection orchestration engine for Cerdas aligned with GSBPM (Generic Statistical Business Process Model). Manages activity blueprints (Phase 1 & 2), questionnaire table schemas, the 16 field types, and reactive JS closures (Phase 3), sampling frame/prelist ingestion (Phase 4.1), enumerator task allocation (Phase 4.2), submission supervision & quality review (Phase 5), data extraction (Phase 6 & 7), and audit trail governance (Phase 8) using the agent-first cerdas CLI and API Key authentication.
---

# 📊 Cerdas GSBPM Survey & Field Data Orchestrator

The `cerdas-orchestrator` skill empowers autonomous AI agents and technical teams to design, author, launch, allocate, supervise, and audit statistical data collection activities end-to-end using the **`cerdas`** agent-first CLI.

The orchestration workflow strictly reflects the international standard **GSBPM (Generic Statistical Business Process Model)**, coupled with the **Cerdas Super-Context Technical Manual** for questionnaire design and reactive JavaScript closures.

---

## 🏛️ GSBPM Statistical Lifecycle Alignment

| GSBPM Phase | Statistical Activity in Cerdas | CLI Command Subsystem | Key Output / Invariant |
|:---|:---|:---|:---|
| **Phase 1 & 2: Specify Needs & Design** | Create new survey activity, set operational mode (`simple` or `complex`), define organizational context. | `cerdas app create`, `cerdas app get`, `cerdas app update` | Generates immutable App UUID and sets role-based verification policies. |
| **Phase 3: Build Instrument** | Create questionnaire table layout, configure the 16 field types, write reactive JS closures (*Formula*, *Show If*, *Validation*), and publish schema versions. | `cerdas table create`, `cerdas table publish`, `cerdas table get` | `TableVersion` is locked upon publishing; changes require new version increments. |
| **Phase 4.1: Frame Ingestion (Prelist)** | Ingest target sampling list (households, buildings, business units) with smart reconciliation strategies (`upsert`, `append`, `merge_columns`, `replace_prelist`). | `cerdas prelist upload --strategy upsert --match-key <id>` | Ingested prelist rows automatically initialize `Assignment` tasks and preview records. |
| **Phase 4.2: Data Collection Allocation** | Distribute assignments to field enumerators, assign supervisors, monitor enumeration progress in real-time. | `cerdas assignment list`, `cerdas assignment create`, `cerdas assignment bulk-reassign` | Every assignment update records an immutable entry into `status_history`. |
| **Phase 5: Process & Verification** | Supervise field submissions, inspect questionnaire responses, approve high-quality records, or reject anomalies with corrective feedback. | `cerdas submission list`, `cerdas submission approve`, `cerdas submission reject` | In Complex Mode, terminal state is `approved`; rejected records return to enumerator. |
| **Phase 6 & 7: Analyse & Disseminate** | Query clean datasets, filter responses by date/status, extract lightweight JSON streams via field masking. | `cerdas submission list --fields id,data,created_at` | Enforces Context Window Discipline to avoid token bloat. |
| **Phase 8: Evaluate & Audit** | Audit non-repudiation logs, inspect system telemetry, verify actor identities and mutation timestamps. | `cerdas audit logs`, `cerdas health` | Full traceability for statistical governance and audit compliance. |

---

## ⚡ Agent-First CLI Core Doctrines (2026 Standards)

1. **Default Machine-Readable JSON First**:
   All commands output structured JSON containing `ok: true/false`, HTTP `code`, `message`, payload `data`, and optional `next_actions` hints.
   *Tip: Use `--table` only when human-readable presentation is explicitly requested.*
2. **Runtime Schema Introspection (`cerdas schema`)**:
   Never guess subcommand arguments or hallucinate flags. Run `cerdas schema` to introspect the full command tree and parameter definitions on demand.
3. **Strict Non-Interactivity**:
   Commands never block on terminal prompts. Destructive actions require the explicit `--force` flag.
4. **Context Window Discipline**:
   Always project needed fields using `--fields <comma-separated>` and paginate via `--limit <N>` and `--page <N>` to preserve model context tokens.
5. **Idempotency by Default**:
   Use `--if-not-exists` when creating apps or resources, and use `--strategy upsert` with a unique `--match-key` when uploading prelist frames.

---

## 🔑 Authentication & Environment Configuration

The CLI communicates with the Cerdas backend over HTTPS using API Key authentication:

```bash
# 1. Probe current CLI status and active base URL
cerdas config show

# 2. Configure endpoint (aliases: set-base-url, set-url, or generic set)
cerdas config set-base-url https://api.dvlpid.my.id
# or: cerdas config set base-url https://api.dvlpid.my.id

# 3. Configure API Key (aliases: set-api-key, set-key, or generic set)
cerdas config set-api-key crd_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 4. Ad-Hoc / One-Shot CLI Flags (without modifying persistent config):
cerdas --base-url https://api.dvlpid.my.id --api-key crd_live_xxx health
cerdas -u https://api.dvlpid.my.id -k crd_live_xxx app list

# 5. Environment variables (highest priority for container/CI workflows):
export CERDAS_BASE_URL="https://api.dvlpid.my.id"
export CERDAS_API_KEY="crd_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 🚀 End-to-End Survey Orchestration Playbook

### Step 1: Healthcheck & Telemetry Inspection (GSBPM Pre-Flight)

```bash
# Verify backend availability and DB latency
cerdas health
```

### Step 1.5: Pre-Flight Survey Doctor & Readiness Audit (`cerdas app doctor`)

Before distributing links or sending enumerators to the field, run the **Survey Doctor** to perform an automated 11-point GSBPM readiness audit:

```bash
# 1. Audit a specific survey app (JSON by default, with actionable remediations):
cerdas app doctor <app_id>

# 2. Human-readable scorecard with status badges ([PASS], [WARN], [FAIL]):
cerdas app doctor <app_id> --human

# 3. Global workspace audit of all survey activities:
cerdas app doctor --all --human

# 4. Strict CI/CD or Agent Gate (exits with code 1 if status != 'ready'):
cerdas app doctor <app_id> --strict

# 5. One-Shot Auto-Remediation Gate:
# Auto-publishes all draft tables, auto-scaffolds bottom navigation tabs & deck views,
# activates survey, and enables surveyor join link in one guarded command!
cerdas app doctor <app_id> --fix --human

# Direct REST Endpoints:
# GET /api/agent/v1/apps/{app}/doctor
# GET /api/agent/v1/apps/doctor
```

#### What Survey Doctor Verifies & Fully-Guarded CLI Remediation Paths:

| Check ID | Verification Rule | Guarded CLI Remediation Command |
|:---|:---|:---|
| `APP_ACTIVE` | Survey activity is active and unarchived. | `cerdas app update <app_id> --active true` |
| `APP_SCHEDULE` | Survey timeline is within active dates. | `cerdas app update <app_id> --end-date "2026-12-31T23:59:59Z"` |
| `ENUMERATORS_ENROLLED` | Field enumerators enrolled in activity. | `cerdas app member add <app_id> --user <email_or_uuid> --role enumerator` |
| `JOIN_LINK_READY` | Shareable surveyor join link is active. | `cerdas app share-link <app_id> enable --role enumerator` |
| `TABLES_EXIST` | App has at least 1 questionnaire instrument. | `cerdas table create --app <app_id> --name "Kuesioner Utama" --publish` |
| `TABLES_PUBLISHED` | Questionnaire schemas are published and locked. | `cerdas table publish --app <app_id> --all` *(or `--table <tbl>`)* |
| `SCHEMA_FIELD_TYPES` | Questionnaire fields strictly adhere to the 16 canonical types, verify `options` as object arrays `[{label, value}]`, and ensure `nested_form` has defined child fields. | Align schema definitions with Cerdas Technical Manual Chapter 3. |
| `NAVIGATION_CONFIGURED` | Bottom navigation bar tabs are configured. | `cerdas app setup-navigation <app_id> [--force]` |
| `VIEW_BINDINGS` | Navigation views link to valid tables. | `cerdas app setup-navigation <app_id> [--force]` |
| `VIEW_FIELDS_INTEGRITY` | Card header (`primaryHeaderField`, `secondaryHeaderField`) & `groupBy` fields exist in schema, are text-renderable (not raw `image`/`file`), and verified present against sample prelist data rows. Also audits ordinal deduplication key collision risks (e.g. intra-cluster `nus` / `no_urut` without cluster identifiers) and auto-backfills unindexed `external_id` columns from prelist JSON in MySQL. | Auto-resolved by `setup-navigation`, `app update --view-configs-json`, or running `cerdas app doctor` |
| `DATA_AND_FAB_READINESS` | Guarantees non-empty Deck or `+` create FAB. | **Prelist**: `cerdas prelist upload --app <app> --table <tbl> --file prelist.json`<br>**Ad-Hoc**: `cerdas table update --app <app> --table <tbl> --enable-create-action` |
| `ASSIGNMENT_ALLOCATION` | Tasks are allocated to field enumerators. | `cerdas assignment bulk-reassign --app <app> --unassigned-only --enumerator <uuid>` |

#### 🔬 Full Parity: Web Editor JSON Schema Validator & Survey Doctor Engine

The CLI Survey Doctor (`SurveyDoctorService` & `SurveySchemaAuditor`) operates as the exact backend twin of the Web Editor's client-side JSON Schema Validator (`apps/editor/src/app/app-editor/utils/validators/`).

This guarantees **Zero Validation Drift**: an instrument schema that passes or fails the validation banner in the Web Editor (`CodeEditorTab.vue`) will produce the exact same outcome in `cerdas app doctor`.

| Validator Rule (Web Editor & CLI Doctor) | Failure Severity | Failure Trigger Condition & Remediation |
|:---|:---:|:---|
| **Duplicate Field Names** (`seenNames`) | `[FAIL] (critical)` | Two or more fields share the same `name` within a table or within the same `nested_form` scope. Rename fields to be strictly unique. |
| **Missing Field `name` or `label`** | `[FAIL] (critical)` | Field missing non-empty `name` string, or missing `label` (note: `html_block` is exempt from requiring `label`). |
| **Canonical Field Types & Aliases** | `[FAIL] (critical)` | Field `type` is not in the recognized list: `text`, `long_text`, `textarea`, `number`, `url`, `date`, `time`, `datetime`, `select`, `radio`, `checkbox`, `gps`, `image`, `signature`, `nested_form`, `nested`, `separator`, `html_block`, `lookup`. Hallucinated types like `string`, `photo`, `file`, `boolean` will fail immediately. |
| **Options Object-Array Contract** | `[FAIL] (critical)` | For `select`, `radio`, or `checkbox`, missing both `options` and `options_fn`, or `options` contains raw strings `["A", "B"]` instead of objects `[{"label": "A", "value": "A"}]`. |
| **Sub-Form Recursive Definition** | `[FAIL] (critical)` | Field of type `nested_form` or `nested` without a valid `fields` array or containing empty child fields. |
| **Google Sheets Sub-Tab Lineage** | `[FAIL] (critical)` | If `source_type == 'google_sheets'` and `tabs` contains a `nested` tab, `field_key` must match an actual `nested_form` field in the schema. |
| **Map View `gps_column` Integrity** | `[FAIL] (critical)` | A view with `type: 'map'` must specify a `gps_column` that exists in the referenced table AND has `type: 'gps'`. |
| **Card Header Media Disallowance** | `[WARN] (medium)` | Card `primaryHeaderField` or `secondaryHeaderField` cannot be of media type (`image`, `file`, `signature`), which cannot be rendered as text title. |
| **Intra-Cluster Ordinal Collision** | `[WARN] (medium)` | Card header uses an ordinal (`nus`, `no_urut`) without `external_id` or cluster code (`sls`, `kode_sls`), risking card collision in mobile DeckView. |

---

### Step 2: Create & Configure Survey Activity (GSBPM Phase 1 & 2)

#### A. Create Initial Activity Blueprint
```bash
# Create a new survey activity with Complex Mode (Supervisor review required)
cerdas app create \
  --name "Survei Ekonomi Pertanian 2026" \
  --description "Pendataan sampel komoditas pertanian dan hortikultura tingkat desa" \
  --mode complex \
  --if-not-exists
```

#### B. Configure Editor Toggles, Schedules & Policies
All settings in the Web Editor (`AppSettingsPanel`) can be tuned via CLI:
```bash
# Update activity status, schedule deadline, and behavior
cerdas app update <app_id> \
  --active true \
  --mode complex \
  --start-date "2026-11-01T08:00:00Z" \
  --end-date "2026-11-30T23:59:59Z" \
  --expired-behavior read_only \
  --public-access false \
  --allow-comments true \
  --icon "folder"
```

#### C. Shareable Enrollment Links (Surveyor Onboarding)
Manage public enrollment links without entering the web UI:
```bash
# 1. Inspect current active join link & full shareable URL:
cerdas app share-link <app_id> get

# 2. Enable link with default role (enumerator, supervisor, viewer):
cerdas app share-link <app_id> enable --role enumerator

# 3. Invalidate current token and generate a fresh URL:
cerdas app share-link <app_id> regenerate --role enumerator

# 4. Disable public enrollment:
cerdas app share-link <app_id> disable
```

#### D. Manage Surveyors & Supervisors Directly
```bash
# 1. List all enrolled members and assigned roles:
cerdas app member list <app_id>

# 2. Enroll an enumerator or supervisor by email or user ID:
cerdas app member add <app_id> --user "budi@bps.go.id" --role enumerator
cerdas app member add <app_id> --user "eko@bps.go.id" --role supervisor

# 3. Remove a member from the activity:
cerdas app member remove <app_id> --user "budi@bps.go.id"
```

---

## 📐 CHAPTER 3: QUESTIONNAIRE INSTRUMENT ARCHITECTURE & SCHEMA SPECIFICATION (GSBPM PHASE 3)

The Application Schema is the single source of truth (SSOT) defining the Data Layer, Logic Closures, Presentation Views, and Google Sheets Sync.

### 3.1 The "Holy Grail" Root Application Schema Contract
The top-level JSON document adheres strictly to the following structure:

```json
{
  "app": {
    "name": "string (Human-readable app name, e.g. 'Kuesioner Sambora Mempawah')",
    "slug": "string (Kebab-case identifier: /^[a-z0-9-]+$/)",
    "description": "string (Detailed summary of the application)",
    "mode": "'simple' | 'complex' (simple: direct app-level membership; complex: multi-organization tenant)"
  },
  "tables": {
    "<table_slug>": {
      "name": "string (Table display name)",
      "description": "string (Optional description)",
      "source_type": "'internal' | 'google_sheets' | 'airtable' | 'api'",
      "source_config": {
        "google_sheet": {
          "spreadsheet_id": "string (GCP Sheet ID, e.g. '100meBm-NKXoxnHKS-TioAZWt407vOh5mlcWBgRD70Lg')",
          "spreadsheet_url": "string (Full edit URL)",
          "sync_enabled": true,
          "tabs": [
            {
              "type": "root",
              "field_key": null,
              "sheet_gid": 0,
              "sheet_name": "string (Name of root tab)"
            },
            {
              "type": "nested",
              "field_key": "string (Exact field name of nested_form field, e.g. 'kepala_keluarga_list')",
              "sheet_gid": 123456789,
              "sheet_name": "string (Name of child tab)"
            }
          ]
        }
      },
      "fields": [
        /* Array of FieldDefinition objects (see 3.2) */
      ],
      "settings": {
        "icon": "string (Framework7 icon name, e.g. 'doc_text', 'house_fill', 'person_2', 'building_2')",
        "public_access": false,
        "allow_comments": false,
        "actions": {
          "header": [
            { "id": "create", "label": "Tambah Baru", "icon": "plus", "type": "create", "primary": true }
          ],
          "row": [
            { "id": "edit", "label": "Edit", "icon": "pencil", "type": "edit" },
            { "id": "delete", "label": "Hapus", "icon": "trash", "type": "delete", "color": "red" }
          ],
          "swipe": {
            "left": ["edit"],
            "right": ["delete"]
          }
        }
      }
    }
  },
  "views": {
    "<view_id>": {
      "table": "string (Must exactly match a key in 'tables')",
      "name": "string (View title in UI)",
      "type": "'deck' | 'map' | 'table' | 'calendar'",
      "description": "string (Optional)",
      "config": {
        "groupBy": ["string (field_name, e.g. 'Nama_RT')"],
        "sortBy": "string (field_name)",
        "sortOrder": "'asc' | 'desc'",
        "filter": "object (Optional key-value match filter, e.g. { 'status': 'in_progress' })",
        "actions": ["string (action_ids, e.g. 'edit', 'delete')"],
        "deck": {
          "primaryHeaderField": "string (field name or dot notation for nested child: 'kepala_keluarga_list.0.nama_kk')",
          "secondaryHeaderField": "string (field name, e.g. 'Nama_RT')",
          "imageField": "string | null (field name storing photo path/URL or null, e.g. 'Foto_Rumah')",
          "imageShape": "'square' | 'circle'"
        },
        "map": {
          "gps_column": "string (field name of type 'gps', e.g. 'Lokasi_Geotagging')",
          "lat": "string (Optional numeric field for latitude)",
          "long": "string (Optional numeric field for longitude)",
          "label": "string (field name for popup title, e.g. 'kepala_keluarga_list.0.nama_kk')",
          "subtitle": "string (field name for popup subtitle, e.g. 'Nama_RT')",
          "mapbox_style": "string (e.g. 'mapbox://styles/mapbox/streets-v11')",
          "marker_style_fn": "string (JavaScript closure returning { color: string, icon: string })"
        }
      }
    }
  },
  "navigation": [
    {
      "id": "string (Unique identifier, e.g. 'nav_home')",
      "type": "'view' | 'link'",
      "view": "string (Must match a key in 'views' if type is 'view')",
      "url": "string (Full URL if type is 'link')",
      "label": "string (Bottom nav label, e.g. 'Daftar')",
      "icon": "string (F7 icon name, e.g. 'list_bullet', 'map_fill', 'chart_bar', 'person_crop_circle')"
    }
  ]
}
```

---

### 3.2 Complete Field Types Master Matrix (The 16 Canonical Types)

Every element in a table's `fields` array defines an input variable, computed metric, layout divider, or guideline banner.

#### Universal Field Properties
- **`name`** (`string`, REQUIRED): Unique key per table/level. Use clean snake_case or PascalCase (e.g. `Nama_Lengkap`, `Jumlah_KK`, `Lokasi_Geotagging`).
- **`label`** (`string`, REQUIRED except for `html_block`): Human-readable UI label.
- **`type`** (`FieldType`, REQUIRED): Exactly one of the 16 valid types below.
- **`hint`** (`string`, optional): Contextual helper text displayed under the field (1-3 sentences).
- **`placeholder`** (`string`, optional): Ghost placeholder text inside the input box.
- **`required`** (`boolean`, optional): If true, field cannot be submitted blank/empty.
- **`readonly`** (`boolean`, optional): If true, field is not manually editable (use with `formula_fn` or `initial_value_fn`).
- **`pii`** (`boolean`, optional): Marks personally identifiable/confidential data for encryption and masked exports.
- **`preview`** (`boolean`, optional): Highlights field in card previews, search results, and list deck items.
- **`searchable`** (`boolean`, optional): Indexes field for real-time client-side search filtering.

> [!IMPORTANT]
> **Strict Validation Invariants Enforced by Survey Doctor & Web Editor:**
> 1. **No Duplicate Names**: Every field `name` must be strictly unique within the table or nested form level. Duplicate names will trigger `[FAIL] (SCHEMA_FIELD_TYPES)`.
> 2. **Mandatory Labels**: Every field requires a non-empty string `label`, except for `type: "html_block"`.
> 3. **Supported Aliases**: For developer convenience, the validator accepts `long_text` and `textarea` as valid text variants, and `nested` as an alias for `nested_form`.
> 4. **Options Contract**: `select`, `radio`, and `checkbox` must provide `options: [{ "label": "Text", "value": "Val" }]` or dynamic `options_fn`. Raw string arrays `["A", "B"]` will fail validation immediately.


#### Detailed Field Type Specifications
| Type | Description | Specific JSON Attributes & Options | Storage Value Type |
|---|---|---|---|
| **`text`** | Single-line text input | `maxLength` (number), `pattern` (regex) | `string` |
| **`number`** | Numeric input (integer/float) | `min`, `max`, `step`, `decimal` (precision) | `number` |
| **`url`** | Web URL with click-to-open | `placeholder` | `string` |
| **`date`** | ISO Date picker | `min` / `minDate`, `max` / `maxDate`, `format` (e.g. "YYYY-MM-DD") | `string` ("YYYY-MM-DD") |
| **`time`** | Time picker | `min`, `max`, `config: { use24h: boolean }` | `string` ("HH:mm") |
| **`datetime`** | Combined Date & Time picker | `min`, `max`, `config: { use24h: boolean }` | `string` (ISO string) |
| **`select`** | Dropdown single choice | `options: [{ label: string, value: any }]` OR `options_fn`, `multiple` (bool), `allowOther` (bool) | `string \| number \| any[]` |
| **`radio`** | Radio button group | `options: [{ label: string, value: any }]` OR `options_fn`, `layout: 'horizontal' \| 'vertical'` | `string \| number` |
| **`checkbox`** | Multi-select checkboxes | `options: [{ label: string, value: any }]` OR `options_fn` | `any[]` (array of values) |
| **`gps`** | Geolocation coordinates | `accuracy` (meters), `autoCapture` (bool), `allow_manual_input` (bool) | `{ coords: { latitude, longitude, accuracy, altitude?, heading?, speed? }, timestamp }` |
| **`image`** | Camera photo or gallery | `source: 'camera' \| 'gallery' \| 'both'`, `maxSize` (MB), `compression` (0.1 - 1.0) | `string` (asset path) |
| **`signature`** | Digital signature canvas | `canvasWidth` (number), `canvasHeight` (number) | `string` (Base64 data URL) |
| **`nested_form`** | 1-to-N Repeatable sub-form | `fields: FieldDefinition[]` (recursive child fields), `min` (minRows), `max` (maxRows) | `Array<Record<string, any>>` |
| **`separator`** | Thematic section divider | `label: string` (Section header title, e.g. "I. Data Wilayah"). UI only. | None (No data stored) |
| **`html_block`** | Operational guideline banner | `content: string` (HTML markup), `blockStyle: 'default' \| 'info' \| 'warning' \| 'success' \| 'danger' \| 'note'`. UI only. | None (No data stored) |
| **`lookup`** | Foreign table reference | `sourceTable`, `displayColumn`, `valueColumn`, `filterJs` | `any` |

> [!IMPORTANT]
> **CRITICAL RULE FOR OPTIONS**:
> `options` must ALWAYS be an array of objects: `[{ "label": "Label Text", "value": "Value" }]`. NEVER output raw string arrays `["A", "B"]`.

---

### 3.3 Runtime Closure & Logic Engine (The 8 Closure Contracts)

All dynamic calculations, validations, visibility checks, and automated defaults are executed client-side via sandboxed JavaScript function bodies.

#### Execution Environment & Injected Variables
Closures are compiled dynamically as: `new Function('ctx', 'row', 'utils', body)` and called with:
- **`row`** (or `ctx.row`): Direct dictionary of all current form field values (e.g. `row.Nama_RT`, `row.Jumlah_KK`).
- **`value`**: Current field's raw value (specifically injected during `validation_js`, `warning_fn`, and `warning_js`). For a `nested_form`, `value` is the array of child rows `Array<Record<string, any>>`.
- **`ctx`**: Global contextual payload:
  - `ctx.row`: Current record values.
  - `ctx.index` / `ctx.rowIndex`: 0-based array index when evaluating inside a `nested_form`.
  - `ctx.parent` / `ctx.parentRow`: Immediate parent record when evaluating child items inside a `nested_form`.
  - `ctx.parents`: Array of all parent records up to the root in deeply nested forms.
  - `ctx.allRows` / `ctx.items`: Array of all sibling items in a nested list or visible table records.
  - `ctx.user`: `{ id: number, name: string, email: string, role: 'app_admin' | 'org_admin' | 'supervisor' | 'enumerator' | 'viewer', organizationId: number | null }`.
  - `ctx.assignment`: `{ id: string | number, status: string, form_id?: number, organization_id?: number, prelist_data?: Record<string, any> }`.
  - `ctx.vars`: Ephemeral key-value object for caching intermediate calculations across closures.
- **`utils`** (or `ctx.utils`): Built-in mathematical and date helpers:
  - `utils.now()`: Current ISO 8601 string (`"2026-08-26T14:30:00.000Z"`).
  - `utils.today()`: Current date string (`"YYYY-MM-DD"`).
  - `utils.uuid()`: Unique alphanumeric identifier.
  - `utils.sum(arr, key?)`: Computes numeric sum of array values or object properties (`utils.sum(row.anggota_list, 'penghasilan')`).
  - `utils.daysSince(dateStr)`: Integer count of days between dateStr and today.
  - `utils.log(...args)`: Console debug logging helper.

#### The 8 Closure Properties & Exact Return Contracts
1. **`show_if_fn`**: `(ctx, row, utils) => boolean`
   - Returns `true` to display field; `false` to hide it.
   - Hidden fields are automatically excluded from submission validation.
   - *Sentinel Pattern*: `"return false;"` creates an invisible sentinel field used for background aggregation/validation.
2. **`editable_if_fn`**: `(ctx, row, utils) => boolean`
   - Returns `true` if editable; `false` if read-only.
   - *Sentinel Pattern*: `"return false;"` locks field as permanently read-only.
   - *Role check*: `"return ctx.user?.role === 'app_admin' || ctx.user?.role === 'supervisor';"`
3. **`required_if_fn`**: `(ctx, row, utils) => boolean`
   - Dynamically requires field if true.
   - *Example*: `"return row.memiliki_usaha === 'Ya';"`
4. **`formula_fn`**: `(ctx, row, utils) => any`
   - **REACTIVE**: Recalculates automatically upon ANY field value change. Combine with `readonly: true`.
   - *Example (List Length)*: `"return Array.isArray(row.kk_list) ? row.kk_list.length : 0;"`
   - *Example (Derived Sum)*: `"return Number(row.pria || 0) + Number(row.wanita || 0);"`
   - *Example (Concatenation)*: `"return (row.kode_rt || '') + '/' + (row.nomor_bangunan || '');"`
5. **`initial_value_fn`**: `(ctx, row, utils) => any`
   - Evaluated **EXACTLY ONCE** on record creation.
   - *Example (Generated ID)*: `"return 'RMH-' + utils.uuid().substring(0, 8).toUpperCase();"`
   - *Example (Prelist Copy)*: `"return ctx.assignment?.prelist_data?.nama_kepala_keluarga || '';"`
   - *Example (Enumerator Auto)*: `"return ctx.user?.name || '';"`
   - *Example (Default Date)*: `"return utils.today();"`
6. **`options_fn`**: `(ctx, row, utils) => Array<{ label: string, value: any }>`
   - Dynamically computes dropdown options based on other answers (Cascading Select).
7. **`validation_js`**: `(ctx, row, utils) => string | null | undefined | boolean`
   - **HARD BLOCK**: Prevents form saving/submission if condition fails.
   - Return a non-empty `string` to show that specific error message.
   - Return `null`, `undefined`, or `true` if valid. Returning `false` shows default "Invalid value".
8. **`warning_fn`** (or **`warning_js`**): `(ctx, row, utils) => string | null | undefined`
   - **SOFT WARNING**: Alerts the enumerator without blocking submission (e.g. GPS accuracy, unusual outliers).

---

### 3.4 Google Sheets 2-Way Sync Architecture

When `source_type: 'google_sheets'`, Cerdas automatically keeps the database in 1-to-1 parity with a Google Spreadsheet:
1. **Root Tab**: Mirrors the main table fields. Headers in row 1 match field `name`s exactly (e.g. `Nama_RT`, `ID_rumah`, `Lokasi_Geotagging`).
2. **Nested Sub-Tabs**: Each repeatable `nested_form` is exported to its own designated sub-tab configured in `source_config.google_sheet.tabs`.
3. **Relational Lineage**: Sub-tabs include auto-generated `parent_response_id` and `child_response_id` (e.g. `parentUuid_nestedKey_index`) ensuring parent-child integrity during bidirectional upserts and deletes.
4. **Layout Filtering**: Layout elements (`separator`, `html_block`) are automatically excluded from spreadsheet columns.
5. **Media URLs**: Uploaded photos are exported as clickable absolute media URLs.

---

### 3.5 Survey UX Design Principles (The Gold Standard)

1. **Semantic Separation of Guidance**:
   - **`hint`**: MUST be used for field-specific input instructions (e.g. *"Format: NIK 16 digit"*). Max 2-3 sentences. Plain text only.
   - **`html_block`**: MUST be used ONLY for section-wide operational guidelines, definition boxes, or multi-field criteria. Supports rich HTML (`<strong>`, `<ul>`, `<li>`, `<br/>`) and styles (`info`, `warning`, `note`, `success`, `danger`). NEVER use `html_block` for a single field's prompt.
   - **`separator`**: MUST be used to delineate major thematic chapters and distinct questionnaire clusters.
2. **Reactivity Over Manual Double-Entry**:
   - NEVER ask enumerators to calculate and manually type counts that can be derived from sub-tables. Use `formula_fn` + `readonly: true`.
3. **Age Bracket Boundary Integrity**:
   - Align demographic groups with standard census cohorts: 0-5 (balita), 6-17 (usia sekolah), 18-59 (usia produktif), 60-64 (pra-lansia), 65+ (lansia). NEVER create ambiguous straddling buckets like `60-69`.
4. **Security & Search Indexing**:
   - Flag sensitive personal columns with `"pii": true`.
   - Flag key lookup identifiers with `"preview": true` and `"searchable": true`.

---

### 3.6 Proven Real-World Recipes & Patterns (The Sambora Blueprints)

#### Recipe 1: Hidden Sentinel Demographic Checksum Pattern
Enforces mathematically strict demographic balance across age, gender, education, and job breakdowns without cluttering the UI:
```json
{
  "name": "Total_Usia_Check",
  "type": "number",
  "readonly": true,
  "show_if_fn": "return false;",
  "formula_fn": "return (Number(row.Jumlah_usia_0_4||0)+Number(row.Jumlah_usia_5_9||0)+Number(row.Jumlah_usia_10_14||0)+Number(row.Jumlah_usia_15_19||0)+Number(row.Jumlah_usia_20_24||0)+Number(row.Jumlah_usia_25_29||0)+Number(row.Jumlah_usia_30_34||0)+Number(row.Jumlah_usia_35_39||0)+Number(row.Jumlah_usia_40_44||0)+Number(row.Jumlah_usia_45_49||0)+Number(row.Jumlah_usia_50_54||0)+Number(row.Jumlah_usia_55_59||0)+Number(row.Jumlah_usia_60_64||0)+Number(row.Jumlah_usia_65_keatas||0));",
  "validation_js": "const total = Number(row.Total_Usia_Check||0); const anggota = Number(row.Jumlah_Anggota_Keluarga_di_Rumah||0); if (anggota > 0 && total !== anggota) { return 'Total rincian kelompok usia (' + total + ') harus persis sama dengan Jumlah Anggota Keluarga (' + anggota + '). Selisih: ' + (anggota - total) + ' jiwa.'; } return null;"
}
```

#### Recipe 2: Dynamic Multi-Select Checkbox Expansion Pattern
When checking an option in a multi-select checkbox, dynamically reveal and mandate the corresponding quantity input:
```json
{
  "name": "Agama_yang_Ada_di_Rumah",
  "type": "checkbox",
  "label": "Pilih Agama yang Ada di Rumah",
  "options": [
    { "label": "Islam", "value": "Islam" },
    { "label": "Kristen", "value": "Kristen" },
    { "label": "Katolik", "value": "Katolik" }
  ]
},
{
  "name": "Jumlah_orang_beragama_islam",
  "type": "number",
  "label": "Jumlah orang beragama Islam di rumah",
  "show_if_fn": "return Array.isArray(row.Agama_yang_Ada_di_Rumah) ? row.Agama_yang_Ada_di_Rumah.includes('Islam') : row.Agama_yang_Ada_di_Rumah === 'Islam';",
  "required_if_fn": "return Array.isArray(row.Agama_yang_Ada_di_Rumah) ? row.Agama_yang_Ada_di_Rumah.includes('Islam') : row.Agama_yang_Ada_di_Rumah === 'Islam';"
}
```

#### Recipe 3: Dynamic Repeatable Sub-Form with Gating & Count Validation
Repeatable sub-form only renders when counter > 0, and validates that the number of added sub-rows strictly equals the counter:
```json
{
  "name": "Jumlah_pekerjaan_lainnya",
  "type": "number",
  "label": "Jumlah Anggota dengan Pekerjaan Lainnya"
},
{
  "name": "daftar_pekerjaan_lainnya",
  "type": "nested_form",
  "label": "Rincian Jenis Pekerjaan Lainnya",
  "hint": "Daftarkan nama anggota dan jenis pekerjaannya.",
  "show_if_fn": "return Number(row.Jumlah_pekerjaan_lainnya || 0) > 0;",
  "validation_js": "const target = Number(row.Jumlah_pekerjaan_lainnya || 0); const list = Array.isArray(value) ? value : []; if (list.length !== target) { return 'Jumlah baris rincian pekerjaan lainnya (' + list.length + ') harus cocok dengan Jumlah Pekerjaan Lainnya (' + target + ' orang).'; } return null;",
  "fields": [
    { "name": "nama_pekerja", "type": "text", "label": "Nama Anggota", "required": true },
    { "name": "jenis_pekerjaan", "type": "text", "label": "Rincian Profesi", "required": true }
  ]
}
```

#### Recipe 4: Three-Tier Cascading Filter (Bansos Pattern)
Filter Question (Yes/No) -> Count Question -> Recipient Names:
```json
{
  "name": "Filter_Penerima_Bansos",
  "type": "select",
  "label": "Apakah keluarga ini menerima Bantuan Sosial (Bansos)?",
  "options": [{ "label": "Ya", "value": "Ya" }, { "label": "Tidak", "value": "Tidak" }],
  "required": true
},
{
  "name": "Jml_Penerima_Terdaftar_PKH",
  "type": "number",
  "label": "Jumlah Anggota Penerima PKH",
  "show_if_fn": "return row.Filter_Penerima_Bansos === 'Ya';",
  "warning_js": "const val = Number(row.Jml_Penerima_Terdaftar_PKH||0); const anggota = Number(row.Jumlah_Anggota_Keluarga_di_Rumah||0); if (anggota > 0 && val > anggota) { return '⚠️ Jumlah penerima PKH (' + val + ') melebihi jumlah anggota keluarga (' + anggota + ').'; } return null;"
},
{
  "name": "Nama_Penerima_Terdaftar_PKH",
  "type": "text",
  "label": "Nama Penerima Manfaat PKH",
  "show_if_fn": "return row.Filter_Penerima_Bansos === 'Ya' && Number(row.Jml_Penerima_Terdaftar_PKH || 0) > 0;"
}
```

#### Recipe 5: GPS Geotagging with Quality Soft-Warning
```json
{
  "name": "Lokasi_Geotagging",
  "type": "gps",
  "label": "Lokasi Geotagging (GPS)",
  "required": true,
  "allow_manual_input": true,
  "hint": "Ambil titik koordinat tepat di depan atau di dalam rumah.",
  "warning_js": "if (row.Lokasi_Geotagging && row.Lokasi_Geotagging.coords && row.Lokasi_Geotagging.coords.accuracy > 50) { return '⚠️ Akurasi GPS kurang optimal ('+Math.round(row.Lokasi_Geotagging.coords.accuracy)+' meter). Disarankan mengambil titik koordinat di luar ruangan untuk sinyal terbaik.'; } return null;"
}
```

---

### 3.7 Anti-Patterns & Common Pitfalls Matrix

| Anti-Pattern | Fatal Flaw | Canonical Cerdas Solution |
|---|---|---|
| Manual count field when nested list exists | Data discrepancy and double-entry errors | `type: "number"`, `readonly: true`, `formula_fn: "return Array.isArray(row.list) ? row.list.length : 0;"` |
| `html_block` above every single input | Massive visual clutter and broken spacing | Use field `hint` for single fields; reserve `html_block` for multi-field chapters |
| Missing `separator` between question groups | Context-switching invisible to enumerator | Place `type: "separator"` with clear roman-numeral section titles |
| Mixing terminology (e.g. 'KK' vs 'Kepala Keluarga') | Enumerator confusion in the field | Standardize on ONE official term throughout the entire schema |
| Disconnected view table or navigation reference | Broken app navigation / 404 views | Ensure `view.table` matches `tables[slug]` and `nav.view` matches `views[view_id]` |
| Side-effects / mutations inside closures | Unpredictable infinite loops | Closures must be pure functions returning a value |
| Overlapping age group brackets | Impossible cross-variable demographic balance | Split at standard cutoffs (0-5, 6-17, 18-59, 60-64, 65+) |
| Raw string arrays in `options` | UI renderer crash / options unparseable | Always format as objects: `[{ label: "X", value: "X" }]` |

---

### 3.8 CLI Workflow for Building & Publishing Instrument

```bash
# Create the household questionnaire table with schema definitions
cerdas table create \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --name "Kuesioner Rumah Tangga Tani" \
  --description "Blok I s/d Blok IV Kuesioner Pertanian" \
  --fields-json '[
    {"name": "nama_krt", "type": "text", "label": "Nama Kepala Rumah Tangga", "required": true},
    {"name": "jumlah_art", "type": "number", "label": "Jumlah Anggota Keluarga", "required": true},
    {"name": "luas_lahan_ha", "type": "number", "label": "Luas Lahan Garapan (Ha)", "required": true},
    {"name": "ada_ternak", "type": "select", "label": "Memiliki Ternak Peliharaan", "options": [{"label": "Ya", "value": "Ya"}, {"label": "Tidak", "value": "Tidak"}]},
    {"name": "jenis_ternak", "type": "select", "label": "Jenis Ternak Utama", "options": [{"label": "Sapi", "value": "Sapi"}, {"label": "Kambing", "value": "Kambing"}], "show_if_fn": "return row.ada_ternak === \"Ya\";"},
    {"name": "foto_lokasi", "type": "image", "label": "Foto Lahan / Rumah"},
    {"name": "titik_gps", "type": "gps", "label": "Titik Koordinat GPS"}
  ]' \
  --publish

# Publish schema version for a specific table:
cerdas table publish --app <app_id> --table <table_id> --changelog "Initial version"

# Or publish ALL draft tables in the app at once:
cerdas table publish --app <app_id> --all

# Or update table metadata, description, or toggle header FAB:
cerdas table update \
  --app <app_id> \
  --table <table_id> \
  --name "Kuesioner Rumah Tangga Tani (Revisi)" \
  --enable-create-action
```

#### Table Actions & Mobile FAB Configuration (`layout.settings.actions`)
> [!IMPORTANT]
> **Mobile FAB & Row Interaction Invariant:**
> The mobile client PWA renders interactive controls based on `settings.actions` in the Table configuration:
> 1. **Floating Action Button (`+` FAB)**: Renders at the bottom-right **ONLY** if `settings.actions.header` contains an action with `type: "create"`. Without this, surveyors cannot create ad-hoc records on mobile.
> 2. **Card Actions**: Renders inside card menus / bottom sheets based on `settings.actions.row` (`open`, `delete`, `edit`).
> 3. **Swipe Actions**: Renders on swipe gesture based on `settings.actions.swipe` (`delete` on left, `complete` on right).

```bash
# 1. High-Level Guarded Helper (Toggles '+' create button without breaking existing settings):
cerdas table update --app <app_id> --table <table_id> --enable-create-action
# Or to turn off:
cerdas table update --app <app_id> --table <table_id> --disable-create-action

# 2. Granular settings JSON configuration:
cerdas table update \
  --app <app_id> \
  --table <table_id> \
  --settings-json '{
    "icon": "doc_text_search",
    "actions": {
      "header": [
        {"id": "create", "icon": "plus", "type": "create", "label": "Tambah Baru"},
        {"id": "sync", "icon": "arrow_2_circlepath", "type": "sync", "label": "Sync Data"}
      ],
      "row": [
        {"id": "open", "icon": "doc_text", "type": "open", "label": "Buka", "primary": true},
        {"id": "delete", "icon": "trash", "type": "delete", "color": "red", "label": "Hapus"}
      ],
      "swipe": {
        "left": ["delete"],
        "right": ["complete"]
      }
    }
  }'
```

---

### Step 3.9: Bind Views & Navigation Tabs (App Shell Layout)

> [!IMPORTANT]
> **Client PWA Runtime Invariants (Prelist vs Ad-Hoc Data Flow):**
> 1. At least 1 Table with a **published** version (`published_at != null`).
> 2. At least 1 View Config (`view_configs`) mapping a view ID to that table (e.g. `deck` or `map`).
> 3. At least 1 Navigation Tab (`navigation`) pointing to the active `view_id`.
> 4. **Deck View Data Source Requirement:**
>    - A `deck` view displays **Assignments** (`assignments` table in local SQLite synced from server).
>    - **Empty Deck Root Cause:** If an App has tables and views configured, but **0 assignments** exist in the database, the mobile Deck view will be completely blank upon sync!
>    - **Two Operational Survey Patterns:**
>      - **Pattern A (Target Sampling Prelist)**: (e.g., Sakernas Foto Rumah, Susenas, Sensus Ekonomi).
>        Admin **MUST** execute Phase 4.1 (`cerdas prelist upload`) AND Phase 4.2 (`cerdas assignment bulk-reassign`) to allocate sample households to enumerators.
>      - **Pattern B (Ad-Hoc Reporting)**: (e.g., Laporan Kunjungan, Laporan Pemutakhiran).
>        Admin **MUST** enable `header: [{"type": "create"}]` (`--enable-create-action`) so the surveyor can tap `+` on the mobile device to add new submissions dynamically!

#### Option 1: Automatic Navigation Scaffolding (Recommended)
Automatically discover all published questionnaire tables, generate bottom navigation tabs, and bind optimal deck views (with auto-detected primary header fields):
```bash
# Scaffold navigation tabs and flat deck views:
cerdas app setup-navigation <app_id> [--force]

# Or scaffold navigation WITH hierarchical drill-down grouping:
cerdas app setup-navigation <app_id> --group-by "kecamatan,desa,sls" [--force]
```

#### Option 2: Custom Navigation & Card Layout Specification
Configure specific custom navigation tabs and card layout via CLI:
```bash
cerdas app update <app_id> \
  --navigation-json '[
    {"id": "nav_1", "icon": "doc_text", "type": "view", "label": "Laporan Pendataan", "view_id": "view_laporan"}
  ]' \
  --view-configs-json '{
    "view_laporan": {
      "type": "deck",
      "title": "Laporan Pendataan",
      "table_id": "<table_id>",
      "sortBy": "nama_ppl",
      "groupBy": ["nama_ppl", "sls"],
      "actions": ["open", "delete"],
      "deck": {
        "primaryHeaderField": "sls",
        "secondaryHeaderField": "nama_krt"
      }
    }
  }'
```

#### Hierarchical Drill-Down Grouping (`groupBy`) & Form Sectioning
In the Editor (`ViewsPanel` -> `ViewConfigPanel` -> `GroupByConfig.vue`), views support multi-level hierarchical grouping (Level 1, Level 2, Level 3, etc.).
- **Mobile PWA Behavior**: Instead of an unorganized flat list, the mobile client (`AppShellGroupList`) organizes assignments into interactive folder groups with item counters (e.g. `Kecamatan > Desa > SLS`). The surveyor taps each level to drill down directly to target households.
- **CLI Commands**:
```bash
# 1. Apply multi-level grouping across all views:
cerdas app update <app_id> --group-by "kecamatan,desa,sls"

# 2. Apply grouping to a specific view:
cerdas app update <app_id> --view view_direktori_usaha --group-by "sls"

# 3. Clear grouping (revert to flat deck list):
cerdas app update <app_id> --group-by none

# 4. Scaffold navigation and grouping in 1 step:
cerdas app setup-navigation <app_id> --group-by "sls" --force
```

---

### Step 4: Manage & Update Sampling Frame / Prelist (GSBPM Phase 4.1)

Prelist represents the target sample frame (e.g. households, businesses, farmers) stored in `assignments.prelist_data`. Cerdas provides full CRUD capabilities for prelist management before and during fieldwork:

#### A. Batch Ingest with Smart Reconciliation
Prepare the target sampling list (e.g. `prelist_sampel.json`):
```json
[
  {
    "id_sampel": "SMPL-001",
    "nama_krt": "Pak Budi Hartono",
    "desa": "Sukasari",
    "rt_rw": "002/005",
    "komoditas_awal": "Padi Sawah"
  },
  {
    "id_sampel": "SMPL-002",
    "nama_krt": "Ibu Siti Aminah",
    "desa": "Sukasari",
    "rt_rw": "003/005",
    "komoditas_awal": "Jagung Hibrida"
  }
]
```

Upload using the declarative upsert or merge strategy:
```bash
# Initial frame upload or full upsert:
cerdas prelist upload \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --table <table_uuid> \
  --file prelist_sampel.json \
  --strategy upsert \
  --match-key id_sampel

# In-Field Re-Listing Update: Merge new columns without overwriting enumerator answers
cerdas prelist upload \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --table <table_uuid> \
  --file updated_columns.json \
  --strategy merge_columns \
  --match-key id_sampel
```

#### B. Dynamic Prelist CRUD During Active Fieldwork
```bash
# 1. Query & Search Prelist Rows:
cerdas prelist list --app <app_id> --table <table_id> --search "Budi Hartono"

# 2. Inspect Single Sample Prelist:
cerdas prelist get <assignment_uuid>

# 3. Add New Sample Unit Found in the Field On-The-Fly:
cerdas prelist create \
  --table <table_uuid> \
  --external-id "SMPL-003" \
  --data-json '{"nama_krt": "Ahmad Subarjo", "desa": "Sukasari", "rt_rw": "004/005"}' \
  --enumerator <enumerator_uuid>

# 4. In-Place Update (Fix typo, update contact / address):
cerdas prelist update <assignment_uuid> \
  --data-json '{"nama_krt": "Pak Budi Hartono", "no_telp": "08123456789"}'

# 5. Soft-Delete Invalid / Dropped Prelist Sample:
cerdas prelist delete <assignment_uuid> --force
```

---

### Step 5: Allocate Tasks to Enumerators (GSBPM Phase 4.2)

```bash
# List unassigned tasks
cerdas assignment list \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --status assigned \
  --fields id,prelist_data,enumerator_id

# Reassign specific assignment to enumerator
cerdas assignment update <assignment_uuid> \
  --enumerator <enumerator_user_uuid> \
  --supervisor <supervisor_user_uuid> \
  --note "Alokasi penugasan wilayah RT 002 Sukasari"

# Bulk reassign all unassigned tasks across an entire app to an enumerator:
cerdas assignment bulk-reassign \
  --app <app_id> \
  --unassigned-only \
  --enumerator <enumerator_user_uuid> \
  --note "Distribusi seluruh prelist tak bertuan ke enumerator"

# Or bulk reassign a specific table or batch of IDs:
cerdas assignment bulk-reassign \
  --table <table_id> \
  --enumerator <enumerator_user_uuid>

cerdas assignment bulk-reassign \
  --ids "<uuid1>,<uuid2>,<uuid3>" \
  --enumerator <enumerator_user_uuid> \
  --note "Distribusi batch blok 1"
```

---

### Step 6: Supervise, Verify & Approve Submissions (GSBPM Phase 5)

Once enumerators sync their survey responses from mobile devices:

```bash
# Query pending submissions awaiting review
cerdas submission list \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --status submitted \
  --fields id,assignment_id,data,updated_at

# Approve a validated submission
cerdas submission approve <response_uuid>

# Reject an anomalous submission with corrective guidance for the enumerator
cerdas submission reject <response_uuid> \
  --note "Luas lahan 500 Ha tidak wajar untuk kategori rumah tangga tani biasa. Mohon konfirmasi satuan m2 atau Ha."
```

---

### Step 7: Export Clean Results (GSBPM Phase 6 & 7)

```bash
# Extract all approved responses with minimal fields
cerdas submission list \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --status approved \
  --fields id,data,created_at > clean_survey_data.json
```

---

### Step 8: Governance & Audit Trail Verification (GSBPM Phase 8)

```bash
# Inspect mutation audit log
cerdas audit logs --action ASSIGNMENT --limit 20
```

---

## 🛡️ Error Recovery & Troubleshooting Matrix

| Exit Code / Error | Meaning | Recommended Agent Action |
|:---|:---|:---|
| `code: 401` / `unauthenticated` | Missing or invalid API Key. | Verify `CERDAS_API_KEY` or run `cerdas config set-key <key>`. |
| `code: 403` / `access_denied` | Key lacks permission for target App. | Verify app ownership or ensure user is attached to organization. |
| `code: 404` / `not_found` | Resource (App, Table, Assignment) not found. | Run `cerdas app list` or `cerdas table list --app <app_id>` to discover correct UUIDs. |
| `code: 503` / `connection_refused` | Cerdas backend server is offline. | Check Docker container `cerdas-backend` or restart via Coolify / `docker compose up -d`. |
| `retryable: true` | Network timeout or transient 500 error. | Retry the command after a 2-second exponential backoff. |
