# 3. Konteks dan Cakupan (Context and Scope)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `4088c01` (branch: `main`)
> - **Verified Timestamp**: `2026-11-04T19:30:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`
> - **Drift Status**: `verified`

Dokumen ini mendefinisikan batasan sistem platform **Cerdas**, interaksi antarmuka eksternal, dan batasan domain fungsional.

---

## 3.1 Diagram Konteks Sistem (Mermaid C4 Context)

```mermaid
C4Context
    title Diagram Konteks Sistem - Cerdas Platform
    
    Person(enumerator, "Petugas Lapangan (Enumerator)", "Mengumpulkan data responden di lapangan secara luring.")
    Person(supervisor, "Pengawas Lapangan (Supervisor)", "Memantau penugasan, memeriksa kualitas isian, menyetujui/menolak data.")
    Person(admin, "Admin Survei / Pemilik Kegiatan", "Merancang kuesioner visual, mengunggah data prelist, mengunduh hasil.")
    Person(agent, "Autonomous AI Agent", "Orkestrator otomatis yang mengelola survei via CLI & API Key.")

    System(cerdas, "Cerdas Platform", "Platform pengumpulan data mobile offline-first mandiri berkinerja tinggi.")

    System_Ext(gsheets, "Google Sheets API", "Sinkronisasi data tabel dua arah dan integrasi lembar kerja.")
    System_Ext(sentry, "Sentry Observability", "Pelacakan error dan telemetri kinerja terdistribusi.")
    System_Ext(google_auth, "Google Identity Services", "Autentikasi akun Google OAuth 2.0 untuk pengguna web.")
    System_Ext(external_db, "Sistem Statistik / RDBMS Hulu", "Penyedia data prelist awal atau penerima ekspor data bersih.")

    Rel(enumerator, cerdas, "Mengunduh prelist & mengirim respons survei", "IF-02: HTTPS / JSON Sync")
    Rel(supervisor, cerdas, "Memeriksa dan menyetujui/menolak isian", "IF-03: HTTPS / Web Editor")
    Rel(admin, cerdas, "Merancang form & upload data prelist", "IF-03: HTTPS / Web Editor")
    Rel(agent, cerdas, "Eksekusi siklus GSBPM via Agent CLI", "IF-01: HTTPS / API Key REST")
    Rel(cerdas, gsheets, "Sinkronisasi baris dan webhook ekspor", "IF-05: OAuth / REST Webhook")
    Rel(cerdas, sentry, "Mengirim rekaman error dan jejak transaksi", "IF-06: Sentry Ingestion")
    Rel(cerdas, google_auth, "Verifikasi token login SSO Google", "OAuth 2.0")
    Rel(external_db, cerdas, "Penyediaan data sampel prelist awal", "IF-01: REST API / Prelist Ingest")
```

---

## 3.2 Antarmuka Eksternal Sistem (External Interfaces)

Berikut adalah daftar antarmuka formal yang menghubungkan komponen platform Cerdas dengan ekosistem luar:

| ID Interface | Nama Antarmuka | Protokol / Format | Deskripsi & Komponen Pengguna |
|:---|:---|:---|:---|
| IF-01 | Agent-First Programmatic REST API & CLI | HTTPS / JSON REST API | Antarmuka otomatisasi untuk AI Agent dan sistem eksternal (`/api/agent/v1`, `/api/apps`, `/api/assignments`, `/api/tables`) menggunakan autentikasi API Key (`X-Api-Key` atau `X-Super-Admin-Key`) dengan pencatatan audit log mutasi data. |
| IF-02 | Mobile Enumeration Delta Sync API | HTTPS / JSON Delta Sync | Antarmuka sinkronisasi dua arah antara aplikasi mobile offline (`apps/client`) dan backend server, mendukung kursor pagination, transfer kompresi, dan penanganan konflik pemutakhiran data. |
| IF-03 | Web Visual Editor & Dashboard API | HTTPS / JSON REST API | Antarmuka manajemen kuesioner visual, perancangan skema tabel, peninjauan data isian responden, dan tata kelola anggota kegiatan untuk pengguna peramban web (`apps/editor`). |
| IF-04 | Real-Time Messaging & Signaling Service | WebSocket (Pusher Protocol) | Antarmuka pengiriman sinyal real-time dan notifikasi perubahan status penugasan via Laravel Reverb engine. |
| IF-05 | Google Sheets Bi-Directional Sync Gateway | HTTPS / REST & Webhooks | Antarmuka integrasi eksternal untuk sinkronisasi otomatis antara tabel Cerdas dan Google Spreadsheet pengguna. |
| IF-06 | Sentry Distributed Error & Telemetry Ingestion | HTTPS / Sentry Protocol | Antarmuka telemetri dan audit kesehatan aplikasi terdistribusi di backend Octane, web editor, dan client mobile. |
