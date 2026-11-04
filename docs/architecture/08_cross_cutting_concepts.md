# 8. Konsep Lintas Sektoral (Cross-Cutting Concepts)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `8925a9e` (branch: `main`)
> - **Verified Timestamp**: `2026-11-04T13:37:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`
> - **Drift Status**: `verified`

Dokumen ini mendefinisikan aturan dan pola seragam yang diterapkan di seluruh lapisan arsitektur Cerdas.

---

## 8.1 Keamanan, Autentikasi API Key & Jejak Audit (Audit Logging)

1. **Dual-Tier Authentication**:
   - **User Session**: Pengguna manusia (web editor) menggunakan token Sanctum yang dihasilkan dari alur Login atau Google OAuth 2.0.
   - **Machine & Agent Access**: Akses otomatis (CLI atau sistem terintegrasi) menggunakan **API Key** bertipe (`crd_live_...` atau `crd_test_...`) atau Super Admin Master Key (`X-Super-Admin-Key` / `X-Api-Key`). Kunci disimpan dalam basis data menggunakan enkripsi satu arah SHA-256 dan diverifikasi secara konstan (*constant-time hash comparison*).
2. **Kebutuhan Wajib Jejak Audit (*Audit Trail Requirement*)**:
   Dalam tata kelola data statistik resmi, seluruh operasi mutasi data wajib memiliki catatan audit yang mencakup:
   - Identitas Aktor (`actor_id`, `actor_email`, `actor_role`).
   - Tipe Autentikasi (`api_key`, `sanctum_token`, `superadmin_key`).
   - Alamat IP Sumber dan User-Agent.
   - Tindakan Operasional (`APP_CREATE`, `APP_UPDATE`, `PRELIST_IMPORT`, `ASSIGNMENT_REASSIGN`, `ASSIGNMENT_DELETE`, `RESPONSE_APPROVE`, `RESPONSE_REJECT`).
   - ID Entitas Sasaran dan ringkasan perubahan (*payload snapshot*).

---

## 8.2 Isolasi State pada Worker Mode (Octane Hygiene)

Karena FrankenPHP mengeksekusi aplikasi secara terus-menerus di memori:
1. Dilarang mengikat *Request instance* atau data sesi pengguna ke dalam singleton service provider.
2. Setiap koneksi basis data atau transaksi yang gagal wajib melakukan `rollBack()` secara eksplisit dalam blok `try ... finally`.
3. Menggunakan Octane tick events untuk me-reset state transient di antara siklus request.

---

## 8.3 Evaluasi Ekspresi JavaScript Aman (Sandboxed Expressions)

Formula kalkulasi, aturan *Show If*, dan validasi *Warning* ditulis dalam sintaksis JavaScript murni:
1. Eksekusi dijalankan melalui *Function constructor* terisolasi tanpa akses ke global `window`, `document`, `fetch`, atau `localStorage`.
2. Input dibatasi hanya pada variabel formulir aktif (`row`, `data`, `user`, `helpers`).
3. Menggunakan mekanisme perlindungan timeout eksekusi untuk mencegah perulangan tak berujung (*infinite loops*) dari ekspresi yang dirancang pengguna.

---

## 8.4 Observabilitas & Pelacakan Anomali Terdistribusi (Sentry)

1. **Error Capturing**: Sentry SDK terpasang di Laravel Octane, Editor Vue 3, dan Mobile Client.
2. **Context Enrichment**: Setiap exception diperkaya dengan metadata konteks (App ID, Table ID, mode sinkronisasi) tanpa mengekspos data pribadi responden (PII sanitization).
