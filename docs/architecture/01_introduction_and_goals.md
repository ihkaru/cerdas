# 1. Pengantar dan Tujuan (Introduction and Goals)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `1e60f1c` (branch: `main`)
> - **Verified Timestamp**: `2026-11-07T06:14:17+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Dokumen ini menjelaskan arsitektur perangkat lunak dari platform **`Cerdas`** (`ihkaru/cerdas`). Cerdas adalah platform alternatif sumber terbuka mandiri (*self-hosted AppSheet alternative*) yang dirancang khusus untuk memfasilitasi survei, sensus, dan kegiatan pendataan lapangan berskala besar tanpa batasan kuota pengguna.

---

## 1.1 Masalah Nyata yang Diselesaikan

Sebagian besar platform *no-code* pengumpulan data lapangan memiliki batasan yang menghambat kegiatan statistik dan operasional:
1. **Batasan Kuota Pengguna (*Vendor Lock-in*)**: AppSheet membatasi akun gratis hanya untuk 10 pengguna, sedangkan kegiatan pendataan lapangan (seperti sensus penduduk/pertanian) membutuhkan puluhan hingga ribuan enumerator.
2. **Keterbatasan Operasi Luring (*Offline-First Limitation*)**: Wilayah pendataan di Indonesia sering kali berada di daerah 3T (Terdepan, Terluar, Tertinggal) tanpa sinyal internet stabil. Solusi berbasis web murni gagal berfungsi saat koneksi terputus.
3. **Kompleksitas Penyusunan Instrumen (*Complex Form Logic*)**: Kuesioner statistik modern membutuhkan validasi bersyarat (*Warning*), sembunyikan/tampilkan dinamis (*Show If*), kontrol hak edit (*Editable If*), dan kalkulasi otomatis (*Formula*) yang fleksibel.
4. **Alokasi Beban Tugas & Prelist (*Prelist Sampling Allocation*)**: Mengelola ribuan target responden/sampel awal (prelist) dan mendistribusikannya ke enumerator secara dinamis sering kali membutuhkan intervensi manual yang rentan kesalahan.
5. **Kepatuhan Alur Kerja Statistik Resmi (GSBPM)**: Pengumpulan data harus mematuhi tahapan standar internasional GSBPM (*Generic Statistical Business Process Model*), mulai dari rancang bangun kuesioner, alokasi frame, pengumpulan, audit verifikasi, hingga diseminasi data.
6. **Deteksi Dini Kesiapan Survei & Validasi Integritas (Survey Doctor)**: Mencegah kegagalan enumerasi di lapangan akibat skema belum diterbitkan (*unpublished table version*), ketiadaan tabel aktif, atau alokasi enumerator yang belum tuntas melalui mesin audit kesiapan deterministik $O(1)$.

---

## 1.2 Sasaran Mutu Utama (Quality Goals)

Sasaran mutu arsitektur Cerdas dirumuskan menggunakan model kualitas Q42:

| Prioritas | Tag Mutu | Sasaran Mutu | Arti Nyata bagi Pengguna & Agen AI |
|:---:|:---|:---|:---|
| 1 | #availability | Operasi Luring Penuh (*Offline-First*) | Aplikasi mobile enumerator (PWA/Capacitor) dapat merekam data, menghitung ekspresi, dan menyimpan bukti GPS 100% tanpa jaringan internet menggunakan SQLite lokal, kemudian melakukan sinkronisasi delta otomatis saat jaringan pulih. |
| 2 | #performance | Throughput Tinggi & Worker-Mode FrankenPHP | Backend Laravel Octane melayani ribuan request konkurensi sinkronisasi delta secara simultan tanpa overhead re-bootstrapping framework per request. |
| 3 | #usability | Pembangun Visual No-Code & Dynamic JS Expressions | Admin kegiatan dapat merancang form/tabel relasional kompleks secara visual dan menulis rumus validasi JavaScript tanpa perlu memodifikasi kode backend. |
| 4 | #security | Keamanan Bertingkat, API Key & Jejak Audit Lengkap | Pengendalian akses granular berbasis RBAC, autentikasi mesin berbasis API Key untuk agen otonom, serta pencatatan audit log komprehensif pada setiap mutasi data kegiatan. |
| 5 | #maintainability | Monorepo Modular & Pemisahan Tanggung Jawab | Kode monorepo terorganisasi rapi via *pnpm workspaces* memisahkan backend API (`apps/backend`), mobile client (`apps/client`), editor web (`apps/editor`), serta pustaka logika bersama (`packages/form-engine`, `packages/expression-engine`, `packages/types`). |

---

## 1.3 Pemangku Kepentingan (Stakeholders)

| Peran | Harapan Terhadap Sistem |
|:---|:---|
| **Petugas Pendataan Lapangan (Enumerator)** | Aplikasi mobile ringan, responsif, hemat baterai, dan andal digunakan di daerah terpencil tanpa kehilangan data survei yang belum tersinkronisasi. |
| **Pengawas Pendataan (Supervisor)** | Panel monitoring untuk memantau kemajuan enumerasi secara real-time, meninjau jawaban responden, serta menyetujui (*approve*) atau menolak (*reject*) data cacah. |
| **Penyusun Survei & Administrator Kegiatan** | Kemudahan mengunggah data prelist awal, merancang kuesioner relasional, menerbitkan versi tabel (*publish schema*), dan mengekspor hasil ke format analisis (CSV/Excel). |
| **Autonomous AI Agents & Integrator Eksternal** | Antarmuka CLI dan REST API terstruktur dengan autentikasi API Key, output mesin JSON deterministik, dan kemampuan eksekusi end-to-end sesuai tahapan GSBPM. |
| **DevOps & System Administrator** | Kemudahan deployment kontainerisasi 1-klik via Docker Compose & Coolify, pemantauan error terdistribusi via Sentry, dan pemeliharaan tanpa downtime. |
