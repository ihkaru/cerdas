# 11. Risiko dan Hutang Teknis (Risks and Technical Debt)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `1e60f1c` (branch: `main`)
> - **Verified Timestamp**: `2026-11-07T06:14:17+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Dokumen ini mencatat matriks risiko arsitektur dan buku besar hutang teknis (*technical debt ledger*) untuk memastikan transparansi dan pengelolaan berkelanjutan pada platform Cerdas.

---

## 11.1 Matriks Risiko Arsitektur (Architectural Risk Matrix)

Berikut adalah daftar risiko yang diidentifikasi dari Keputusan Arsitektur (ADR-01 hingga ADR-06 pada Bagian 9):

| ID Risiko | Sumber Keputusan | Deskripsi Potensi Risiko | Dampak & Mitigasi yang Diterapkan |
|:---|:---|:---|:---|
| RISK-01 | ADR-01 (Octane Worker Mode) | Potensi kebocoran state memori (*state leakage*) antar request jika service provider atau controller menyimpan data request pengguna ke dalam singleton static. | **Dampak: Tinggi**. **Mitigasi**: Menerapkan audit rutin laravel-octane (`octane-audit.yml`), melarang properti kelas mutable static, dan me-reset auth resolver di akhir setiap request lifecycle. |
| RISK-02 | ADR-02 (Offline-First Local SQLite) | Konflik pembaruan data (*write conflict*) jika penugasan yang sama dikerjakan secara offline oleh dua perangkat berbeda sebelum disinkronkan ke server. | **Dampak: Sedang**. **Mitigasi**: Penguncian penugasan berbasis peran unik enumerator, penerapan status transisi kanonikal (`assigned` → `in_progress` → `submitted`), dan pencatatan riwayat `status_history`. |
| RISK-03 | ADR-03 (Monorepo pnpm Workspaces) | Peningkatan durasi instalasi dependensi dan potensi konflik versi package toolchain antarmuka TypeScript. | **Dampak: Rendah**. **Mitigasi**: Pemanfaatan cache pnpm terpusat pada CI/CD GitHub Actions dan isolasi workspace per aplikasi. |
| RISK-04 | ADR-04 (API Key & Audit Requirement) | Potensi kompromi kredensial jika kunci API berdaya tinggi (`SUPERADMIN_API_KEY`) bocor ke log publik atau repositori git. | **Dampak: Tinggi**. **Mitigasi**: Injeksi kunci secara dinamis melalui secret manager (Infisical / Docker Secrets), pembatasan IP whitelist opsional, dan rotasi token otomatis. |
| RISK-05 | ADR-05 (Dynamic Grouping vs Flat Deck) | Potensi rendering kartu dalam jumlah besar secara bersamaan jika dataset prelist lokal sangat masif tanpa pagination virtual. | **Dampak: Sedang**. **Mitigasi**: Implementasi DOM virtualization atau chunked pagination pada DeckView jika jumlah penugasan lokal melebihi ambang batas (>500 baris). |
| RISK-06 | ADR-06 (Survey Doctor & Audit Engine) | Potensi false positive jika aturan audit tidak sinkron dengan evolusi skema tabel survei kustom masa depan. | **Dampak: Rendah**. **Mitigasi**: Mekanisme pengecualian terkelola dan pelaporan error deskriptif yang memandu perbaikan skema. |

---

## 11.2 Buku Besar Hutang Teknis (Technical Debt Ledger)

| ID Hutang | Area Komponen | Uraian Hutang Teknis | Rencana Remediasi & Target |
|:---|:---|:---|:---|
| DEBT-01 | Client AppShell | Komponen `AppShell.vue` saat ini berukuran >1000 baris dan menggabungkan banyak tanggung jawab (sinkronisasi, render deck, manajemen tab, dialog, modal), melanggar Single Responsibility Principle (SRP). | Melakukan dekonstruksi modular ke dalam composables dan subkomponen mandiri (`useAppShellLogic`, `AppTabBar.vue`, `AssignmentListView.vue`) sesuai Fase 3 Roadmap Modernisasi. |
| DEBT-02 | Schema vs ViewConfigs | Skema kolom `TableVersion` terpisah dari konfigurasi `viewConfigs.groupBy` pada App, sehingga penghapusan atau pengubahan nama kolom di skema tabel dapat menyebabkan grouping key tidak cocok tanpa peringatan dini di editor. | Menerapkan validasi silang (*cross-validation*) saat publikasi skema versi tabel dan sinkronisasi otomatis skema tampilan navigasi. |
| DEBT-03 | Local Query String Interpolation | `AssignmentQueryService.ts` dan `useGroupingLogic.ts` pada mobile client masih menggunakan interpolasi string mentah untuk beberapa klausa filter dan kolom grouping SQLite lokal. | Refactoring kueri SQLite menggunakan *parameterized queries* atau sanitasi identifier ketat (`sanitizeColumnKey`) untuk mencegah malformed SQL syntax dan menjamin keamanan kueri. |
