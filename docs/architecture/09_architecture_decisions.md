# 9. Keputusan Arsitektur (Architecture Decisions - ADR)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `9e2d91f``37d2424` (branch: `main`)
> - **Verified Timestamp**: `2026-11-08T17:05:28+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Dokumen ini mencatat rekaman keputusan arsitektur (*Architecture Decision Records* - ADR) yang memiliki signifikansi jangka panjang pada platform Cerdas.

---

## 9.1 ADR-01: Penggunaan Laravel Octane dengan FrankenPHP Worker Mode

- **Konteks**: Kegiatan pengumpulan data lapangan menghasilkan lonjakan lalu lintas sinkronisasi serentak di sore/malam hari ketika enumerator kembali dari lapangan dan memperoleh sinyal internet.
- **Keputusan**: Mengadopsi server aplikasi FrankenPHP dengan Laravel Octane worker mode sebagai mesin runtime backend utama.
- **Konsekuensi Positif**: Latensi respons turun drastis (sub-10ms), throughput meningkat hingga 4x lipat dibanding PHP-FPM konvensional dengan konsumsi RAM yang stabil.
- **Risiko Baru**: Menimbulkan risiko kebocoran state memori (*state leakage*) jika developer tidak disiplin membersihkan data transient antar request. *(Dicatat sebagai RISK-01 pada Bagian 11)*.

---

## 9.2 ADR-02: Arsitektur Klien Mobile Offline-First Menggunakan SQLite Lokal & Capacitor

- **Konteks**: Enumerator harus mampu mencatat data sensus di wilayah pedalaman tanpa jaringan internet dengan jaminan data tidak hilang saat aplikasi ditutup atau perangkat kehabisan daya.
- **Keputusan**: Membangun aplikasi klien menggunakan Vue 3 + Framework7 yang dibungkus dengan Capacitor dan menyimpan data langsung ke basis data SQLite lokal perangkat.
- **Konsekuensi Positif**: Operasi pencacahan 100% responsif tanpa dependensi sinyal, mendukung pengoperasian baterai hemat.
- **Risiko Baru**: Kompleksitas rekonsiliasi data dan resolusi konflik saat dua enumerator memperbarui assignment yang sama sebelum melakukan sinkronisasi. *(Dicatat sebagai RISK-02 pada Bagian 11)*.

---

## 9.3 ADR-03: Tata Letak Monorepo Berbasis pnpm Workspaces

- **Konteks**: Kebutuhan berbagi tipe data skema form (`AppSchema`, `Field`, `Assignment`) dan engine kalkulasi JavaScript (`expression-engine`) antara backend, editor web, dan mobile client.
- **Keputusan**: Mengorganisasikan seluruh proyek ke dalam satu monorepo pnpm workspaces dengan direktori `apps/` dan `packages/`.
- **Konsekuensi Positif**: Single Source of Truth (SSOT) untuk antarmuka TypeScript, perubahan skema langsung terpropagasi ke seluruh aplikasi tanpa perlu publikasi paket npm privat.
- **Risiko Baru**: Ketergantungan build toolchain terpadu dan potensi ukuran repositori yang membesar seiring riwayat pengujian. *(Dicatat sebagai RISK-03 pada Bagian 11)*.

---

## 9.4 ADR-04: Autentikasi API Key Mandatori & Jejak Audit untuk AI Agent

- **Konteks**: Kebutuhan integrasi otomatisasi tanpa peramban (headless CLI) oleh AI Agent untuk mengelola survei, mengunggah prelist, dan mengekstraksi data hasil pendataan.
- **Keputusan**: Menerapkan autentikasi API Key bertipe (`crd_live_...` / `X-Api-Key` / `X-Super-Admin-Key`) dengan pencatatan audit log terstruktur untuk setiap operasi mutasi data.
- **Konsekuensi Positif**: Agen otonom dapat mengeksekusi tahapan GSBPM secara deterministik tanpa perlu melewati alur login web berbasis session atau cookie.
- **Risiko Baru**: Potensi kebocoran API Key berdaya tinggi jika disimpan di repositori publik atau tidak dirotasi secara berkala. *(Dicatat sebagai RISK-04 pada Bagian 11)*.

---

## 9.5 ADR-05: Dynamic View Grouping vs Flat Deck Rendering

- **Konteks**: Pada aplikasi mobile client, jika view dikonfigurasi dengan kolom grouping yang tidak ada pada prelist atau bernilai array kosong (`groupBy: []`), kartu penugasan tidak muncul (layar kosong) meskipun data telah terunduh ke SQLite lokal.
- **Keputusan**: Menerapkan fallback defensif: jika `groupBy` kosong atau kolom tidak valid, view otomatis me-render flat DeckView langsung tanpa menyembunyikan item pada folder kosong, dan auto-select view pertama saat berganti tab.
- **Konsekuensi Positif**: Menghilangkan insiden blank screen pada survei operasional (seperti Sakernas 2026), menjamin data selalu dapat diakses enumerator.
- **Risiko Baru**: Potensi rendering kartu dalam jumlah besar secara bersamaan jika dataset prelist lokal sangat masif tanpa pagination virtual. *(Dicatat sebagai RISK-05 pada Bagian 11)*.

---

## 9.6 ADR-06: GSBPM Survey Doctor & Automated Readiness Audit Engine

- **Konteks**: Kesalahan konfigurasi survei (skema kuesioner belum diterbitkan, tabel aktif belum dibuat, alokasi penugasan belum terhubung) sering kali baru diketahui saat petugas sudah berada di lapangan.
- **Keputusan**: Mengimplementasikan endpoint audit kesiapan survei mandiri (`/api/agent/v1/apps/{app}/doctor` dan `/api/agent/v1/doctor`) yang berjalan dalam kompleksitas kueri agregasi $O(1)$, disertai sub-perintah CLI deterministik `cerdas-cli apps doctor --fix`.
- **Konsekuensi Positif**: Verifikasi kepatuhan survei dapat diuji secara otomatis dalam CI/CD pipeline dan pra-pemberangkatan petugas lapangan.
- **Risiko Baru**: Potensi false positive jika aturan audit tidak sinkron dengan evolusi skema tabel survei kustom masa depan. *(Dicatat sebagai RISK-06 pada Bagian 11)*.

---

## 9.7 ADR-07: Defensive Type Coercion pada View Engine & Validasi Lapangan Prelist (Survey Doctor 2.0)

- **Konteks**: Pada survei seperti Sakernas November 2026, field prelist seperti `nus` bernilai numerik (`15`). Evaluasi JavaScript `.trim()` dan `.toLowerCase()` pada field non-string di dalam reactive computed property melempar `TypeError`, yang menyebabkan seluruh list kartu penugasan gagal di-render (tampak 0 item meskipun badge filter menampilkan 180 penugasan).
- **Keputusan**:
  1. Mendekonstruksi logika data `DeckView.vue` ke dalam composable `useDeckData.ts` dengan pemaksaan tipe string defensif (`String(val).trim()`) pada semua atribut header, subtitle, dan ID kandidat.
  2. Meningkatkan `SurveyDoctorService` pada backend untuk mengaudit `secondaryHeaderField`, mendeteksi konfigurasi tipe media yang tidak didukung untuk judul kartu, serta melakukan pengambilan sampel (*sampling*) baris `prelist_data` secara nyata dari database untuk memverifikasi keberadaan kolom sebelum petugas ditugaskan.
- **Konsekuensi Positif**: Menghilangkan error fatal saat rendering data numerik, menjaga keandalan rendering kartu survei, dan mendeteksi kesalahan konfigurasi header prelist secara dini melalui CLI `cerdas app doctor`.
- **Risiko Baru**: Field numerik yang dikonversi ke string tidak memiliki pemformatan ribuan/angka khusus kecuali didefinisikan secara eksplisit oleh skema form.

