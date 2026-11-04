# 9. Keputusan Arsitektur (Architecture Decisions - ADR)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `8925a9e` (branch: `main`)
> - **Verified Timestamp**: `2026-11-04T13:37:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`
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
