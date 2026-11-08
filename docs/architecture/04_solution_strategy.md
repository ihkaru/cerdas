# 4. Strategi Solusi (Solution Strategy)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `9e2d91f``37d2424` (branch: `main`)
> - **Verified Timestamp**: `2026-11-08T17:05:28+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Dokumen ini menjelaskan keputusan strategis fundamental yang membentuk rancang bangun platform **Cerdas** untuk memenuhi sasaran mutu utama.

---

## 4.1 Paradigma Offline-First dengan Penyimpanan SQLite Lokal

Karakteristik pendataan lapangan di Indonesia menuntut kemampuan beroperasi tanpa mengasumsikan keberadaan jaringan seluler:
1. **Lokal-Sebagai-Kebenaran-Awal (*Local as Primary Store*)**: Pada aplikasi mobile klien (`apps/client`), seluruh interaksi formulir, eksekusi formula, dan perekaman koordinat GPS disimpan langsung ke dalam basis data SQLite lokal perangkat.
2. **Sinkronisasi Delta Berbasis Cursor (*Delta Cursor Sync*)**: Ketika perangkat mendeteksi koneksi jaringan aktif, klien meminta mutasi data dari server menggunakan parameter `updated_since` dan token kursor. Hal ini memangkas konsumsi bandwidth hingga 95% dibandingkan pengunduhan ulang seluruh dataset.
3. **Penyelarasan Stempel Waktu Server (*Server Timestamp Authority*)**: Untuk mencegah anomali waktu perangkat klien, rekonsiliasi pemutakhiran data dikunci berdasarkan stempel waktu server (`server_time`).

---

## 4.2 Backend Worker-Mode Berkecepatan Tinggi (FrankenPHP Octane)

Alih-alih arsitektur PHP-FPM tradisional yang memuat ulang (*reboot*) framework Laravel pada setiap HTTP request:
1. **Pemanfaatan FrankenPHP Worker Mode**: Laravel Octane menjaga siklus hidup aplikasi tetap berada di memori (*in-memory execution*). Request dieksekusi secara instan dengan latensi respon sub-10ms.
2. **Disiplin State Safety & Zero Leakage**: Komponen backend dirancang bebas dari shared mutable global state; instance transient dibersihkan secara deterministik di akhir setiap request melalui Octane lifecycle listeners.

---

## 4.3 Monorepo Terstruktur dengan Workspace Bersama

Untuk mencegah duplikasi definisi skema data antara backend dan frontend:
1. **Pemisahan Tanggung Jawab Paket**:
   - `packages/types`: Definisi antarmuka TypeScript untuk entitas App, Table, TableVersion, Field, Assignment, dan Response.
   - `packages/form-engine`: Logika hierarki form, layouting visual, dan state rendering kuesioner.
   - `packages/expression-engine`: Sandbox evaluator ekspresi JavaScript aman untuk formula dan validasi logika lapangan.
2. **Pustaka Bersama Tanpa Build Step Overhead**: Paket bersama diimpor langsung oleh `apps/client` dan `apps/editor` via pnpm link symlink lokal.

---

## 4.4 Otomasi Siklus GSBPM dengan Prinsip Agent-First & Survey Doctor

1. **Dukungan End-to-End Siklus Statistik**:
   Sistem memetakan setiap entitas ke tahapan GSBPM (*Design*, *Build*, *Collect*, *Process*, *Analyse*, *Disseminate*).
2. **Antarmuka CLI Otonom Berbasis API Key**:
   Menyediakan kakas CLI biner yang ramah agen otonom (output mesin JSON standar, bebas prompt interaktif, mode skema introspeksi, mitigasi halusinasi, dan CRUD Prelist komprehensif) sehingga agen AI dapat menjalankan orkestrasi survei secara otomatis.
3. **Mesin Audit Kesiapan Survei Deterministik (*GSBPM Survey Doctor*)**:
   Menyediakan endpoint audit mandiri (`/api/agent/v1/doctor` dan `/api/agent/v1/apps/{app}/doctor`) yang menginspeksi integritas survei dalam agregasi $O(1)$ (keberadaan tabel, versi terpublikasi, konsistensi skema, rasio alokasi prelist), disertai kakas remediasi otomatis berbasis CLI (`cerdas-cli apps doctor --fix`).
4. **Jejak Audit Mutasi Data (*Audit Trail*)**:
   Setiap mutasi (pembuatan kegiatan, pengunggahan prelist, perubahan alokasi, persetujuan data) dicatat dalam audit log terstruktur mencakup identitas aktor, IP, stempel waktu, dan detail perubahan untuk akuntabilitas statistik resmi.

---

## 4.5 Strategi Grouping Tampilan Klien Mobile (DeckView vs Dynamic Grouping)

Untuk menyajikan ribuan penugasan secara terstruktur pada layar ponsel enumerator:
1. **Hierarki Dinamis Berbasis Variabel Prelist**: Tampilan mobile mendukung pengelompokan (*grouping*) bersarang multi-level (misal: Provinsi → Kabupaten → Kecamatan → Desa/Kelurahan → SLS) berdasarkan konfigurasi `groupBy: string[]` pada view terkait.
2. **Fallback Defensif ke Flat DeckView**: Jika konfigurasi `groupBy` kosong (`[]`) atau tidak didefinisikan, antarmuka secara elegan beralih ke tampilan kartu datar (*flat DeckView*) yang menampilkan seluruh penugasan secara langsung tanpa menyembunyikan item pada folder kosong.
3. **Auto-Selection View Pertama**: Saat aplikasi dibuka atau berganti tab bottom navigation, sistem secara deterministik memilih view navigasi pertama yang valid dan melakukan refresh dataset penugasan dari SQLite lokal untuk mencegah layar kosong (*blank state*).
