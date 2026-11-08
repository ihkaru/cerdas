# 2. Batasan Arsitektur (Architecture Constraints)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `1e60f1c` (branch: `main`)
> - **Verified Timestamp**: `2026-11-07T06:14:17+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Dokumen ini menguraikan batasan teknis, operasional, dan organisasi yang memandu dan membatasi keputusan arsitektur platform **Cerdas**.

---

## 2.1 Batasan Teknis (Technical Constraints)

1. **Lingkungan Runtime Backend**:
   - Runtime PHP versi 8.2+ dengan ekstensi wajib `pcntl`, `gd`, `zip`, `intl`, `pdo_mysql`, `pdo_sqlite`.
   - Menggunakan kerangka kerja **Laravel 12** yang dioptimalkan dengan **Laravel Octane** di atas server aplikasi **FrankenPHP**.
   - Mengharuskan kepatuhan *worker mode* (bebas dari *memory leak*, siklus hidup *dependency injection* yang aman, dan isolasi *request state*).

2. **Lingkungan Runtime Frontend & Mobile**:
   - Runtime Node.js 22+ dikelola menggunakan package manager **pnpm** dalam monorepo workspace untuk build kontainer produksi Docker, serta **Bun** (`bun@1.4.2`) yang ditegakkan secara deterministik pada lingkungan pengembangan PRoot Termux ARM64 untuk efisiensi memori dan eksekusi cepat.
   - PWA dan mobile client dibangun dengan **Vue 3** (Composition API) dan komponen antarmuka mobile **Framework7**.
   - Pengemasan aplikasi mobile Android asli menggunakan **Capacitor 6+** dengan bridge plugin native untuk GPS, Camera, dan SQLite.

3. **Manajemen Basis Data & Sinkronisasi**:
   - Server-side database: **MySQL 8.0+** / MariaDB 10.11+ dengan struktur kolom JSON terindeks dan integritas relasional ber-UUID.
   - Client-side offline database: **SQLite 3** lokal pada storage perangkat mobile yang persisten terhadap restart aplikasi.
   - Arsitektur sinkronisasi: Sinkronisasi delta dua arah berbasis stempel waktu server (*server_time*) dan kursor pagination untuk mencegah saturasi memori pada dataset puluhan ribu baris.

---

## 2.2 Batasan Operasional & Infrastruktur (Operational Constraints)

1. **Lingkungan Kontainer Mandiri & Orkestrasi Coolify**:
   - Seluruh ekosistem backend, real-time messaging, worker antrean, serta frontend client dan web editor berjalan secara terisolasi via orkestrator Coolify pada infrastruktur server ThinkStation (`q4cwk40sso0wocww4c44oso8`) dengan reverse proxy Traefik terpadu dan konektivitas jaringan mesh privat Tailscale (SOCKS5 proxy `127.0.0.1:1055`).
2. **Keterbatasan Jaringan & Konektivitas Minimum**:
   - Aplikasi klien mobile harus mampu berfungsi 100% tanpa jaringan internet (*air-gapped/offline-capable*). Seluruh validasi kuesioner dan eksekusi formula JavaScript harus berjalan lokal di perangkat enumerator.
3. **Observabilitas & Manajemen Error Terdistribusi**:
   - Mengintegrasikan pelacakan error dan performa otomatis menggunakan **Sentry SDK** pada ketiga lapisan (backend, editor, dan mobile client) dengan sanitasi data sensitif responden sebelum pengiriman telemetri (bebas opsi PII usang).

---

## 2.3 Batasan Organisasi & Tata Kelola (Organizational Constraints)

1. **Lisensi Sumber Terbuka Permisif**:
   - Repositori dilisensikan di bawah **MIT License**, menjamin kebebasan modifikasi dan distribusi tanpa liabilitas copyleft bagi institusi pemerintah atau enterprise.
2. **Kepatuhan Alur Statistik GSBPM**:
   - Struktur entitas dan siklus hidup data harus merefleksikan proses bisnis statistik standar: *Specify Needs* (Definisi Kegiatan/App) → *Design & Build* (Kuesioner/Tabel) → *Collect* (Alokasi Prelist & Enumerasi) → *Process* (Validasi & Approval) → *Analyse & Disseminate* (Ekspor Data).
3. **Pemberdayaan Agen AI Otonom (*Agent-First Principle*)**:
   - Setiap fungsionalitas manajemen kegiatan, skema, penugasan, dan data prelist wajib dapat dieksekusi tanpa antarmuka grafis (headless) melalui API Key dan Agent CLI deterministik, dilengkapi gerbang audit kesiapan survei (*Survey Doctor Gate*).
