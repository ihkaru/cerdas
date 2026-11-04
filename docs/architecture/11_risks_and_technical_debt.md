# 11. Risiko dan Hutang Teknis (Risks and Technical Debt)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `4088c01` (branch: `main`)
> - **Verified Timestamp**: `2026-11-04T19:30:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`
> - **Drift Status**: `verified`

Dokumen ini mencatat matriks risiko arsitektur dan buku besar hutang teknis (*technical debt ledger*) untuk memastikan transparansi dan pengelolaan berkelanjutan pada platform Cerdas.

---

## 11.1 Matriks Risiko Arsitektur (Architectural Risk Matrix)

Berikut adalah daftar risiko yang diidentifikasi dari Keputusan Arsitektur (ADR-01 hingga ADR-04 pada Bagian 9):

| ID Risiko | Sumber Keputusan | Deskripsi Potensi Risiko | Dampak & Mitigasi yang Diterapkan |
|:---|:---|:---|:---|
| RISK-01 | ADR-01 (Octane Worker Mode) | Potensi kebocoran state memori (*state leakage*) antar request jika service provider atau controller menyimpan data request pengguna ke dalam singleton static. | **Dampak: Tinggi**. **Mitigasi**: Menerapkan audit rutin laravel-octane (`octane-audit.yml`), melarang properti kelas mutable static, dan me-reset auth resolver di akhir setiap request lifecycle. |
| RISK-02 | ADR-02 (Offline-First Local SQLite) | Konflik pembaruan data (*write conflict*) jika penugasan yang sama dikerjakan secara offline oleh dua perangkat berbeda sebelum disinkronkan ke server. | **Dampak: Sedang**. **Mitigasi**: Penguncian penugasan berbasis peran unik enumerator, penerapan status transisi kanonikal (`assigned` → `in_progress` → `submitted`), dan pencatatan riwayat `status_history`. |
| RISK-03 | ADR-03 (Monorepo pnpm Workspaces) | Peningkatan durasi instalasi dependensi dan potensi konflik versi package toolchain antarmuka TypeScript. | **Dampak: Rendah**. **Mitigasi**: Pemanfaatan cache pnpm terpusat pada CI/CD GitHub Actions dan isolasi workspace per aplikasi. |
| RISK-04 | ADR-04 (API Key & Audit Requirement) | Potensi kompromi kredensial jika kunci API berdaya tinggi (`SUPERADMIN_API_KEY`) bocor ke log publik atau repositori git. | **Dampak: Tinggi**. **Mitigasi**: Injeksi kunci secara dinamis melalui secret manager (Infisical / Docker Secrets), pembatasan IP whitelist opsional, dan rotasi token otomatis. |

---

## 11.2 Buku Besar Hutang Teknis (Technical Debt Ledger)

| ID Hutang | Area Komponen | Uraian Hutang Teknis | Rencana Remediasi & Target |
|:---|:---|:---|:---|
| DEBT-01 | Assignment Controller | Endpoint pembuatan penugasan tunggal secara manual (`POST /api/assignments`) dan endpoint update penugasan komprehensif (`PUT /api/assignments/{id}`) sebelumnya belum lengkap, hanya mengandalkan impor massal prelist JSON. | Melengkapi CRUD method `store` dan `update` di `AssignmentController` lengkap dengan validasi integritas relasional dan jejak audit mutasi. |
| DEBT-02 | Unified API Key Middleware | Pemeriksaan API Key sebelumnya terfragmentasi antara `agent.auth` (`X-Super-Admin-Key`) dan Sanctum Personal Access Token (`Bearer crd_...`), sehingga klien tanpa header Authorization bearer tidak dapat menggunakan header standar `X-Api-Key`. | Menyatukan resolusi API Key ke dalam middleware terpadu yang memetakan `X-Api-Key`, `Authorization: Bearer`, atau `X-Super-Admin-Key` ke dalam konteks autentikasi resmi. |
| DEBT-03 | Prelist Column Aliasing | Perbedaan penamaan historis antara kolom `fields` (DB) vs `schema` (types), serta format ID numerik vs UUID string pada beberapa definisi legacy tipe data TypeScript. | Mengadopsi pedoman kanonikal `docs/TERMINOLOGY_DISAMBIGUATION.md` sebagai SSOT dan membersihkan sisa tipe numerik di `@cerdas/types`. |
