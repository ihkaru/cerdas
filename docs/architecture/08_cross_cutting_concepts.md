# 8. Konsep Lintas Sektoral (Cross-Cutting Concepts)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `e9b3b40``9e2d91f``37d2424` (branch: `main`)
> - **Verified Timestamp**: `2026-11-08T17:05:28+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
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

---

## 8.5 Validasi Input Berjenjang & Guard Pra-Eksekusi (Pre-Flight Input Guards)

Untuk mencegah kesalahan konfigurasi dari CLI atau API Agent:
1. **Validasi Sintaksis & Semantik**: Seluruh argumen penting (UUID aplikasi, format JSON baris prelist, nama kolom `groupBy`, dan skema tabel) divalidasi sebelum payload dikirimkan ke server.
2. **Umpan Balik Tindakan Mandiri**: Kegagalan validasi mengembalikan kode error deterministik non-zero beserta saran perbaikan konkret (*actionable suggestion*).

---

## 8.6 Tata Kelola Resolusi Grouping & Fallback Flat DeckView

1. **Resolusi Bertingkat Aman**: Parser navigasi mobile memeriksa apakah kolom yang didefinisikan pada `groupBy` benar-benar ada di dalam skema tabel terpublikasi.
2. **Bypass Deterministic**: Jika konfigurasi `groupBy` kosong atau kolom tidak ditemukan di tabel, sistem secara deterministik menggunakan flat DeckView untuk menjamin seluruh data penugasan tetap dapat diakses enumerator.

---

## 8.7 Batasan Baris Deterministik SRP & Ratchet Ledger Hutang Teknis

1. **Deterministic SRP Line Limit Gate**: Seluruh file kode sumber (`.php`, `.ts`, `.js`, `.vue`) dibatasi maksimal **400 baris** per file untuk menegakkan Single Responsibility Principle (SRP) secara deterministik melalui `scripts/check-line-limits.mjs` dan `scripts/check-line-limits.sh` (terintegrasi dengan `agy-ops gate`).
2. **Technical Debt Ratchet Ledger**: File warisan (*legacy files*) yang melebihi 400 baris dikunci di `.line-limit-allowlist.json`. Aturan ratchet memastikan file warisan hanya boleh menyusut atau lulus (*graduate*) saat direfaktor (seperti kelulusan `AppShell.vue` dari 1002 baris menjadi 332 baris pada Fase 3), dan file baru dilarang keras melanggar batas 400 baris.
