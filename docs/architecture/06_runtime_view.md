# 6. Tampilan Runtime (Runtime View)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `4088c01` (branch: `main`)
> - **Verified Timestamp**: `2026-11-04T19:30:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`
> - **Drift Status**: `verified`

Dokumen ini mendeskripsikan alur eksekusi dinamis dan interaksi komponen pada skenario kritis operasional pengumpulan data lapangan.

---

## 6.1 Skenario 1: Pengunggahan Data Prelist & Alokasi Penugasan (GSBPM 4.1)

Alur ketika administrator atau AI Agent memasukkan sampel data awal (prelist) ke dalam kegiatan pendataan:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / AI Agent
    participant Backend as Backend API (AssignmentController)
    participant DB as MySQL Database
    participant Audit as Audit Logger

    Admin->>Backend: POST /api/assignments/import-json (rows[], table_id, strategy)
    Note over Backend: Autentikasi via API Key / Sanctum Token
    Backend->>Backend: Validasi hak akses App & struktur baris prelist
    Backend->>DB: Begin Database Transaction
    Backend->>DB: Kueri penugasan 'assigned' eksisting (jika strategy = upsert)
    loop Setiap Baris Data Prelist
        Backend->>Backend: Bersihkan metadata sistem & generate UUID
        Backend->>DB: Insert / Update Assignment (prelist_data JSON)
        Backend->>DB: Catat riwayat status ('assigned') ke status_history
    end
    Backend->>Audit: Catat mutasi PRELIST_IMPORT (jumlah baris, actor, IP)
    Backend->>DB: Commit Transaction
    Backend-->>Admin: 200 OK (updated, created, total count)
```

---

## 6.2 Skenario 2: Operasi Enumerasi Luring & Sinkronisasi Delta (GSBPM 4.2 & 4.3)

Alur ketika enumerator mengisi kuesioner tanpa jaringan, kemudian menyinkronkan data:

```mermaid
sequenceDiagram
    autonumber
    actor Enum as Enumerator
    participant Mobile as Mobile App (apps/client)
    participant SQLite as Local SQLite DB
    participant Backend as Backend API (ResponseController)
    participant ServerDB as Server MySQL DB

    Enum->>Mobile: Buka penugasan & isi kuesioner di lapangan (Offline)
    Mobile->>Mobile: Eksekusi formula & validasi via expression-engine
    Mobile->>SQLite: Simpan respons survei (status: 'submitted', synced: false)
    Note over Mobile,SQLite: Perangkat mendeteksi sinyal internet aktif
    Mobile->>Backend: POST /api/responses/sync (payload responses[], last_sync_time)
    Backend->>ServerDB: Upsert Response & update status Assignment ('submitted')
    Backend-->>Mobile: 200 OK (synced_ids[], server_time)
    Mobile->>SQLite: Tandai record tersinkronisasi (synced: true)
```

---

## 6.3 Skenario 3: Peninjauan & Persetujuan Data oleh Pengawas (GSBPM 5.1 & 5.2)

Pada kegiatan dengan *Complex Mode*, data yang diserahkan enumerator melalui verifikasi supervisor:

```mermaid
sequenceDiagram
    autonumber
    actor Sup as Pengawas (Supervisor)
    participant Editor as Web Editor (apps/editor)
    participant Backend as ResponseController
    participant ServerDB as Server MySQL DB

    Sup->>Editor: Buka panel verifikasi isian responden
    Editor->>Backend: GET /api/apps/{app}/responses (filter: status=submitted)
    Backend-->>Editor: Daftar respons menunggu verifikasi
    alt Data Lengkap & Valid
        Sup->>Editor: Klik Setujui (Approve)
        Editor->>Backend: POST /api/responses/{id}/approve
        Backend->>ServerDB: Set status = 'approved' & catat log persetujuan
    else Ditemukan Anomali Data
        Sup->>Editor: Klik Tolak dengan Catatan Revisi (Reject)
        Editor->>Backend: POST /api/responses/{id}/reject (rejection_note)
        Backend->>ServerDB: Set status = 'rejected' & kembalikan ke enumerator
    end
    Backend-->>Editor: 200 OK
```
