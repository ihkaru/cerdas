# Google Sheets Sync — Implementation Plan
# (DB ? Sheet Replica, Opsi B: App-Level Token Owner)

> **Status**: ? Decisions Finalized — Siap untuk eksekusi
> **Dibuat**: 2026-07-19
> **Updated**: 2026-07-19 (setelah Q&A dengan PM)
> **Fase**: Phase 8 (Advanced Features)
> **Scope MVP**: DB ? Sheet (push only, one-directional).

---

## ?? Tujuan

Memungkinkan admin App menghubungkan satu **Table** ke satu atau lebih **Tab Google Sheet** sebagai replica data. Data historis di-ekspor saat pertama kali link, kemudian setiap Response baru/update/delete otomatis dikirim ke Sheet secara batch.

---

## ? Keputusan Arsitektur Final (post Q&A)

### 1. Ownership Model — "App Creator Cannot Leave"

Mengikuti model Google Drive: **App.created_by adalah owner permanen** dan tidak bisa meninggalkan App. Contributor yang diundang sebagai `app_admin` bisa melakukan semua yang owner bisa, termasuk connect/disconnect Google Sheet.

- **Token owner** = user pertama yang melakukan OAuth untuk Sheet Sync di App tersebut (bisa owner, bisa app_admin contributor).
- **Siapa yang bisa sync?** Semua user dengan role `app_admin` atau `project_admin` di App tersebut.
- **Prerequisite**: UI management contributor (invite/remove app_admin) **belum ada** — perlu dibuat bersamaan.

### 2. Deleted Responses ? Langsung Hapus dari Sheet

Saat Response di-soft-delete di Cerdas ? baris yang sesuai di Sheet langsung dihapus (bukan diberi label). Ini menjaga konsistensi data.

### 3. Nested Responses (Sub-Form) ? Tab Terpisah per Section

Setiap repeatable section mendapatkan Tab sendiri di Spreadsheet yang sama, dihubungkan via `parent_response_id`.

```
Spreadsheet: "Survey Penduduk 2026"
+-- Tab: "KK"                      (root responses)
¦     response_id | submitted_at | Nama KK | Alamat | ...
+-- Tab: "KK - Anggota Keluarga"  (child responses dari field repeatable)
      child_response_id | parent_response_id | Nama | Umur | ...
```

**Nama Tab**: `{Table.name}` untuk root, `{Table.name} - {field.label}` untuk sub-form.

### 4. Column Mapping — Semua Field Masuk Otomatis

Urutan kolom tetap:

| Kolom | Isi |
|---|---|
| A | `response_id` (UUID anchor untuk update/delete) |
| B | `submitted_at` |
| C | `assignment_label` (opsional) |
| D... | Semua field sesuai urutan schema |

Field baru yang ditambahkan ke schema ? kolom baru di-append kanan. Kolom lama tidak dihapus (data historis terjaga).

### 5. Queue Strategy — Micro-Batching (Scale-Safe)

**Masalah**: Google Sheets API limit 60 req/menit/user/project. 1 API call per Response × ribuan app = langsung rate-limited.

**Solusi: Micro-Batch via Staging Table**

```
[Response Created/Updated/Deleted]
  ? Dispatch GoogleSheetEnqueueRowJob     ? hanya DB insert, super ringan
  ? INSERT ke pending_sheet_rows

[Scheduler: tiap 30 detik]
  ? GoogleSheetBatchFlushJob
  ? Group pending rows by spreadsheet_id
  ? 1x batchUpdate API call per spreadsheet
  ? Clean up processed rows
```

**Scaling Table:**

| Skala | Responses/menit | Tanpa batching | Dengan batching (30s) |
|---|---|---|---|
| 100 app | 100 | 100 req/min | ~100 req/30s (1/spreadsheet) |
| 10.000 app | 10.000 | 10k req/min ? | ~10k req/30s (manageable) |
| 50.000 app | 50.000 | Impossible ? | Butuh multiple API projects |

> Untuk scale >10k apps: partisi Google API Project pool. Untuk skala awal Cerdas (ratusan app), satu project + micro-batching sudah cukup.

---

## ?? Semua Komponen yang Dibangun

### Layer 0: Prerequisite — App Contributor UI

> ?? **Belum ada** — perlu dibuat paralel atau sebelum GA.

- `POST /apps/{app}/contributors` — invite sebagai app_admin
- `DELETE /apps/{app}/contributors/{user}` — remove
- Editor UI: tab "Contributors" di App Settings

---

### Layer 1: Database

#### [NEW] `google_oauth_tokens`
```
id            UUID PK
app_id        UUID FK ? apps (UNIQUE — 1 token per App)
user_id       UUID FK ? users (token owner)
access_token  TEXT encrypted
refresh_token TEXT encrypted
scopes        TEXT
expires_at    TIMESTAMP
timestamps
```

#### [NEW] `pending_sheet_rows`
```
id             BIGINT AUTO_INCREMENT PK
spreadsheet_id VARCHAR(255)
sheet_name     VARCHAR(255)
tab_type       ENUM('root','nested')
app_id         UUID
table_id       UUID
response_id    UUID
operation      ENUM('upsert','delete')
row_data       JSON NULL
created_at     TIMESTAMP
INDEX(spreadsheet_id, created_at)
INDEX(app_id)
```

#### [MODIFY] `Table.source_config` JSON schema (kolom sudah ada)
```json
{
  "google_sheet": {
    "spreadsheet_id": "1BxiMVs0...",
    "spreadsheet_url": "https://docs.google.com/...",
    "tabs": [
      { "sheet_name": "KK", "sheet_gid": 0, "type": "root", "field_key": null },
      { "sheet_name": "KK - Anggota", "sheet_gid": 123456, "type": "nested", "field_key": "anggota" }
    ],
    "sync_enabled": true,
    "last_synced_at": "2026-07-19T10:00:00Z",
    "total_rows_synced": 142
  }
}
```

#### `Table.source_type` ? set ke `'google_sheets'` saat connect. Sudah ada enum-nya.

---

### Layer 2: Models & Services

#### [NEW] `App\Models\GoogleOAuthToken`
- Fillable: `app_id`, `user_id`, `access_token`, `refresh_token`, `scopes`, `expires_at`
- Cast: `expires_at` ? datetime
- Enkripsi: accessor/mutator `Crypt::encryptString()` pada `access_token` & `refresh_token`
- Helpers: `isExpired()`, `needsRefresh()` (expired dalam 10 menit)
- Relations: `owner()` ? User, `app()` ? App

#### [NEW] `App\Models\PendingSheetRow`
- Fillable: semua kolom
- Cast: `row_data` ? array

#### [NEW] `App\Services\GoogleOAuthService`
```php
getAuthUrl(string $appId): string                          // URL OAuth offline + spreadsheets scope
exchangeCodeAndStore(string $code, string $appId, string $userId): GoogleOAuthToken
hasValidToken(string $appId): bool
```

#### [NEW] `App\Services\GoogleSheetColumnMapper`
```php
buildHeaders(array $fields, bool $isRoot = true): array    // ['response_id','submitted_at','Nama',...]
buildRowValues(array $data, array $fields): array           // values array sesuai urutan headers
getRepeatableFields(array $fields): array                   // [field_key => field_label]
```

#### [NEW] `App\Services\GoogleSheetsService`
```php
clientForApp(App $app): Google\Client                      // auto-refresh token
verifyAccess(App $app, string $spreadsheetId): bool
ensureTabExists(App $app, string $spreadsheetId, string $tabName): int  // returns gid
writeHeaders(App $app, string $spreadsheetId, string $tabName, array $headers): void
batchFlushRows(App $app, string $spreadsheetId, string $tabName, array $rowUpdates): void
fetchExistingRowIndex(App $app, string $spreadsheetId, string $tabName): array // [response_id => rowIndex]
refreshToken(GoogleOAuthToken $token): void
```

---

### Layer 3: Jobs

#### [NEW] `App\Jobs\GoogleSheetEnqueueRowJob` *(hanya DB insert, no API call)*
Trigger: Response created/updated/deleted via Observer.
1. Load Response + Table, cek `source_type === 'google_sheets'` dan `sync_enabled`
2. Build row_data via `GoogleSheetColumnMapper::buildRowValues`
3. Tentukan tab (root vs nested berdasarkan `parent_response_id`)
4. INSERT ke `pending_sheet_rows`

#### [NEW] `App\Jobs\GoogleSheetBatchFlushJob` *(Scheduler: tiap 30 detik)*
1. Group `pending_sheet_rows` by `(spreadsheet_id, sheet_name)`
2. Untuk setiap group: load token ? refresh jika perlu ? `batchFlushRows` ? hapus processed rows
3. Max 50 spreadsheets per flush (circuit breaker)

#### [NEW] `App\Jobs\GoogleSheetInitialExportJob` *(one-time saat connect)*
1. Fetch semua root Responses paginated (500/batch)
2. Deteksi repeatable fields ? buat tabs
3. `ensureTabExists` ? `writeHeaders` ? `batchWrite` per tab
4. Child responses per field_key ? tab masing-masing
5. Update `Table.source_config.last_synced_at`

#### [NEW] `App\Jobs\GoogleSheetTokenRefreshJob` *(Scheduler: hourly)*
1. Cari token dengan `expires_at < now() + 30 menit`
2. `refreshToken($token)` ? log error jika gagal (token di-revoke) ? set `sync_enabled = false`

---

### Layer 4: Controllers & Routes

#### [NEW] `App\Http\Controllers\Api\GoogleSheetSyncController`

Routes baru (dalam `auth:sanctum`):
```php
// App-level OAuth
Route::get('/google/sheets/auth-url/{app}',     'getAuthUrl');
Route::post('/google/sheets/callback',           'handleCallback');
Route::get('/google/sheets/token-status/{app}', 'tokenStatus');
Route::delete('/google/sheets/disconnect/{app}', 'disconnectApp');

// Table-level sheet
Route::post('/tables/{table}/sheets/connect',      'connectSheet');
Route::delete('/tables/{table}/sheets/disconnect', 'disconnectSheet');
Route::post('/tables/{table}/sheets/export-all',   'triggerInitialExport');
Route::get('/tables/{table}/sheets/status',        'syncStatus');
```

**`connectSheet` flow:**
1. Cek token ada ? parse spreadsheet_id dari URL
2. `verifyAccess()` ? error 422 jika tidak bisa akses
3. Deteksi repeatable fields ? tentukan tabs
4. `ensureTabExists` + `writeHeaders` per tab
5. Update Table: `source_type='google_sheets'`, `source_config`
6. Dispatch `GoogleSheetInitialExportJob` jika ada data existing
7. Return `{ status, tabs, has_existing_data }`

#### [MODIFY] `ResponseController::store`
```php
// Setelah responses tersimpan:
foreach ($savedResponses as $response) {
    $table = optional($response->assignment?->tableVersion)->table;
    if ($table?->source_type === 'google_sheets') {
        GoogleSheetEnqueueRowJob::dispatch($response->id, 'upsert')
            ->onQueue('sheets-enqueue');
    }
}
```

#### [MODIFY] Response Model — `deleting` Observer
```php
static::deleting(function ($response) {
    $table = optional($response->assignment?->tableVersion)->table;
    if ($table?->source_type === 'google_sheets') {
        GoogleSheetEnqueueRowJob::dispatch($response->id, 'delete')
            ->onQueue('sheets-enqueue');
    }
});
```

#### [MODIFY] `routes/console.php` — Register Scheduler
```php
$schedule->job(new GoogleSheetBatchFlushJob)->everyThirtySeconds();
$schedule->job(new GoogleSheetTokenRefreshJob)->hourly();
```

---

### Layer 5: Editor Frontend (Vue 3 + TypeScript)

#### [NEW] `packages/types/src/google-sheet.ts`
```typescript
export interface GoogleSheetTabConfig {
  sheet_name: string;
  sheet_gid: number;
  type: 'root' | 'nested';
  field_key: string | null;
}
export interface GoogleSheetConfig {
  spreadsheet_id: string;
  spreadsheet_url: string;
  tabs: GoogleSheetTabConfig[];
  sync_enabled: boolean;
  last_synced_at: string | null;
  total_rows_synced: number;
}
export interface GoogleSheetTokenStatus {
  has_token: boolean;
  owner: { name: string; email: string } | null;
  is_expired: boolean;
}
export interface SheetSyncStatus {
  table_id: string;
  is_connected: boolean;
  config: GoogleSheetConfig | null;
  token_status: GoogleSheetTokenStatus;
  pending_rows: number;
}
export type SheetSyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'connecting' }
  | { status: 'connected'; config: GoogleSheetConfig }
  | { status: 'error'; message: string };
```

#### [NEW] `apps/editor/src/app/app-editor/composables/useGoogleSheetSync.ts`
```typescript
export function useGoogleSheetSync(tableId: Ref<string>, appId: Ref<string>) {
  const state = ref<SheetSyncState>({ status: 'idle' });
  const syncStatus = ref<SheetSyncStatus | null>(null);

  async function startOAuthFlow(): Promise<void>             // window.open() popup OAuth
  async function connectSheet(url: string): Promise<void>
  async function disconnectSheet(): Promise<void>
  async function triggerManualExport(): Promise<void>
  async function refreshStatus(): Promise<void>

  return { state, syncStatus, startOAuthFlow, connectSheet, disconnectSheet, triggerManualExport, refreshStatus };
}
```

#### [NEW] `apps/editor/src/app/app-editor/components/TableSheetSyncPanel.vue`

5 UI States:
- **No token**: tombol "Connect Google Account" ? OAuth popup
- **Has token, disconnected**: input URL + "Connect & Sync"
- **Connected idle**: info spreadsheet + tabs + last sync + "Sync Now" + "Disconnect"
- **Syncing**: progress bar initial export
- **Error**: warning + "Reconnect"

#### [MODIFY] `ApiClient.ts` — namespace `googleSheet`
```typescript
googleSheet: {
  getAuthUrl: (appId: string) => Promise<{ url: string }>,
  handleCallback: (code: string, state: string) => Promise<{ success: boolean }>,
  getTokenStatus: (appId: string) => Promise<GoogleSheetTokenStatus>,
  disconnectApp: (appId: string) => Promise<void>,
  connectSheet: (tableId: string, spreadsheetUrl: string) => Promise<SheetSyncStatus>,
  disconnectSheet: (tableId: string) => Promise<void>,
  triggerInitialExport: (tableId: string) => Promise<{ queued: boolean }>,
  getSyncStatus: (tableId: string) => Promise<SheetSyncStatus>,
}
```

---

## ?? Dependensi Baru

### Backend
```bash
# Cek dulu apakah google/apiclient sudah include Sheets service
composer require google/apiclient:^2.15
```

### Environment vars baru (semua .env files)
```env
GOOGLE_CLIENT_SECRET="your-oauth-client-secret-from-gcp"
GOOGLE_REDIRECT_URI="${APP_URL}/api/google/sheets/callback"
```

> ?? `GOOGLE_CLIENT_SECRET` perlu dikonfigurasi di GCP Console ? OAuth 2.0 Credentials ? tambahkan Authorized redirect URI: `{APP_URL}/api/google/sheets/callback`

---

## ?? Keamanan & Error Handling

| Skenario | Handling |
|---|---|
| Token expired | Auto-refresh hourly. Gagal ? `sync_enabled=false` + log |
| User revoke di Google | 401 dari API ? `sync_enabled=false` ? warning di editor |
| Spreadsheet dihapus | 404 dari API ? auto-disconnect |
| Rate limit 429 | Exponential backoff, max 3 retry di `batchFlushRows` |
| Initial export terputus | Job idempotent — cek existing `response_id` dulu |
| Token bocor di DB | `Crypt::encryptString()` untuk `access_token` & `refresh_token` |
| Schema field berubah | Kolom baru di-append; kolom lama tidak dihapus |

---

## ?? Urutan Implementasi Checklist

### Phase A — Backend Foundation *(2-3 hari)*
- [x] A1. Migration: `create_google_oauth_tokens_table`
- [x] A2. Migration: `create_pending_sheet_rows_table`
- [x] A3. Model: `GoogleOAuthToken` + enkripsi accessor/mutator
- [x] A4. Model: `PendingSheetRow`
- [x] A5. Env: `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URI` di semua `.env`
- [x] A6. Service: `GoogleOAuthService`
- [x] A7. Service: `GoogleSheetColumnMapper`
- [x] A8. Service: `GoogleSheetsService`

### Phase B — Jobs & Scheduler *(1-2 hari)*
- [x] B1. Job: `GoogleSheetEnqueueRowJob`
- [x] B2. Job: `GoogleSheetBatchFlushJob`
- [x] B3. Job: `GoogleSheetInitialExportJob`
- [x] B4. Job: `GoogleSheetTokenRefreshJob`
- [x] B5. Scheduler: register B2 (everyThirtySeconds) + B4 (hourly)
- [ ] B6. Queue: pastikan channel `sheets-enqueue` terdaftar di `docker-compose.dev.yml`

### Phase C — API Layer *(1 hari)*
- [x] C1. Controller: `GoogleSheetSyncController`
- [x] C2. Routes: daftarkan di `api.php`
- [x] C3. Hook: `ResponseController::store` dispatch EnqueueRowJob
- [x] C4. Observer: `Response::deleting` dispatch delete operation

### Phase D — Editor Frontend *(2 hari)*
- [x] D1. Types: `packages/types/src/google-sheet.ts`
- [x] D2. ApiClient: namespace `googleSheet`
- [x] D3. Composable: `useGoogleSheetSync.ts`
- [x] D4. Component: `TableSheetSyncPanel.vue`
- [x] D5. Integration: pasang panel di Table settings (tab "Integrations")

### Phase E — Testing & Docs *(1 hari)*
- [ ] E1. Test happy path: connect ? initial export ? incremental ? delete
- [ ] E2. Test edge case: token expired, rate limit, spreadsheet dihapus
- [ ] E3. Deprecate `GOOGLE_SHEET_SYNC_STRATEGY.md` ? referensi ke file ini
- [ ] E4. Update `docs/task.md`
- [ ] E5. Update `ROADMAP.md`
- [ ] E6. Update `GEMINI.md` progress log

---

## ?? Future Phase (Setelah MVP Stabil)

- **Sheet ? DB**: Apps Script `onEdit` inject via Apps Script API (real-time reverse sync)
- **Multi API Project Pool**: Untuk >10k apps, rotasi `GOOGLE_CLIENT_SECRET` pool
- **Conflict Resolution**: LWW timestamp-based saat reverse sync aktif
