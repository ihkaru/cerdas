---
name: cerdas-orchestrator
version: 1.0.0
description: End-to-end autonomous survey, census, and statistical data collection orchestration engine for Cerdas aligned with GSBPM (Generic Statistical Business Process Model). Manages activity blueprints (Phase 1 & 2), questionnaire table schemas (Phase 3), sampling frame/prelist ingestion (Phase 4.1), enumerator task allocation (Phase 4.2), submission supervision & quality review (Phase 5), data extraction (Phase 6 & 7), and audit trail governance (Phase 8) using the agent-first cerdas CLI and API Key authentication.
---

# 📊 Cerdas GSBPM Survey & Field Data Orchestrator

The `cerdas-orchestrator` skill empowers autonomous AI agents and technical teams to design, launch, allocate, supervise, and audit statistical data collection activities end-to-end using the **`cerdas`** agent-first CLI.

The orchestration workflow strictly reflects the international standard **GSBPM (Generic Statistical Business Process Model)**.

---

## 🏛️ GSBPM Statistical Lifecycle Alignment

| GSBPM Phase | Statistical Activity in Cerdas | CLI Command Subsystem | Key Output / Invariant |
|:---|:---|:---|:---|
| **Phase 1 & 2: Specify Needs & Design** | Create new survey activity, set operational mode (`simple` or `complex`), define organizational context. | `cerdas app create`, `cerdas app get`, `cerdas app update` | Generates immutable App UUID and sets role-based verification policies. |
| **Phase 3: Build Instrument** | Create questionnaire table layout, configure field types (GPS, photo, select, text), write JS expressions (*Formula*, *Show If*), and publish schema versions. | `cerdas table create`, `cerdas table publish`, `cerdas table get` | `TableVersion` is locked upon publishing; changes require new version increments. |
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

### Step 3: Build Questionnaire Schema & Publish Version (GSBPM Phase 3)

```bash
# Create the household questionnaire table with schema definitions
cerdas table create \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --name "Kuesioner Rumah Tangga Tani" \
  --description "Blok I s/d Blok IV Kuesioner Pertanian" \
  --fields-json '[
    {"key": "nama_krt", "name": "nama_krt", "type": "text", "label": "Nama Kepala Rumah Tangga", "required": true},
    {"key": "jumlah_art", "name": "jumlah_art", "type": "number", "label": "Jumlah Anggota Keluarga", "required": true},
    {"key": "luas_lahan_ha", "name": "luas_lahan_ha", "type": "number", "label": "Luas Lahan Garapan (Ha)", "required": true},
    {"key": "ada_ternak", "name": "ada_ternak", "type": "boolean", "label": "Memiliki Ternak Peliharaan"},
    {"key": "jenis_ternak", "name": "jenis_ternak", "type": "select", "label": "Jenis Ternak Utama", "show_if_fn": "row.ada_ternak === true"},
    {"key": "foto_lokasi", "name": "foto_lokasi", "type": "photo", "label": "Foto Lahan / Rumah"},
    {"key": "titik_gps", "name": "titik_gps", "type": "gps", "label": "Titik Koordinat GPS"}
  ]' \
  --publish

# Or update table metadata and settings:
cerdas table update \
  --app <app_id> \
  --table <table_id> \
  --name "Kuesioner Rumah Tangga Tani (Revisi)" \
  --description "Versi revisi pasca uji coba instrumen lapangan"
```

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

# Or bulk reassign a batch of IDs:
cerdas assignment bulk-reassign \
  --ids "<uuid1>,<uuid2>,<uuid3>" \
  --enumerator <enumerator_user_uuid> \
  --note "Distribusi batch blok 1"
```

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

### Step 7: Export Clean Results (GSBPM Phase 6 & 7)

```bash
# Extract all approved responses with minimal fields
cerdas submission list \
  --app e8a1c4b2-0000-4000-8000-abcdef123456 \
  --status approved \
  --fields id,data,created_at > clean_survey_data.json
```

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
