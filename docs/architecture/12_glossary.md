# 12. Glosarium (Glossary)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `8925a9e` (branch: `main`)
> - **Verified Timestamp**: `2026-11-04T13:37:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`
> - **Drift Status**: `verified`

Dokumen ini mendefinisikan istilah domain statistik, arsitektur perangkat lunak, dan singkatan teknis yang digunakan di dalam platform Cerdas.

---

## 12.1 Istilah Domain Statistik & Alur Pendataan (GSBPM)

| Istilah | Definisi Kontekstual |
|:---|:---|
| **GSBPM** | *Generic Statistical Business Process Model* — Standar acuan internasional yang mendefinisikan tahapan baku proses bisnis penyelenggaraan kegiatan statistik (Specify Needs, Design, Build, Collect, Process, Analyse, Disseminate, Evaluate). |
| **App (Kegiatan Pendataan)** | Entitas pembungkus teratas (*workspace container*) yang mewakili satu kegiatan survei, sensus, atau pendataan lapangan tertentu (misal: "Survei Pertanian 2026", "Pendataan Potensi Desa"). |
| **Table (Instrumen / Kuesioner)** | Struktur definisi kuesioner atau formulir pendataan yang berisi kumpulan variabel/pertanyaan yang akan dicacah di lapangan. |
| **TableVersion** | Versi rilis skema tabel yang bersifat terikat versi (*immutable* setelah diterbitkan) untuk menjamin integritas data lapangan yang telah dikumpulkan. |
| **Prelist (Data Awal / Sampel Target)** | Daftar target responden awal (nama kepala keluarga, nomor bangunan, wilayah SLS/RT/RW, atau identitas usaha) yang diunggah ke dalam sistem sebagai dasar alokasi penugasan. |
| **Assignment (Penugasan Lapangan)** | Alokasi beban tugas yang menghubungkan satu baris data prelist dengan petugas lapangan (enumerator) dan pengawas (supervisor). |
| **Response (Isian Survei / Submission)** | Kumpulan data hasil wawancara atau pengamatan lapangan yang diserahkan oleh enumerator untuk satu entitas penugasan. |
| **Enumerator (Petugas Pencacah)** | Petugas lapangan yang bertugas mengunjungi responden dan mencatat data survei menggunakan aplikasi mobile klien. |
| **Supervisor (Pengawas Lapangan)** | Petugas yang bertugas memantau kinerja enumerator, melakukan verifikasi kualitas isian, serta menyetujui (*approve*) atau menolak (*reject*) data isian. |

---

## 12.2 Istilah Arsitektur Teknis & Perangkat Lunak

| Istilah | Definisi Kontekstual |
|:---|:---|
| **Offline-First** | Filosofi perancangan perangkat lunak di mana aplikasi klien memprioritaskan penyimpanan lokal (SQLite) sebagai basis data utama sehingga aplikasi dapat beroperasi 100% normal tanpa koneksi internet. |
| **Delta Sync** | Mekanisme sinkronisasi data yang hanya mentransmisikan baris-baris data yang mengalami penambahan atau perubahan (*delta*) sejak sinkronisasi terakhir, bukan mentransfer ulang seluruh database. |
| **FrankenPHP** | Server aplikasi modern untuk bahasa pemrograman PHP yang dibangun di atas server web Caddy dalam bahasa Go, mendukung protokol HTTP/2, HTTP/3, serta Octane worker mode. |
| **Worker Mode** | Pola eksekusi di mana framework aplikasi dimuat satu kali ke dalam memori RAM saat server dijalankan, dan terus melayani ribuan request berulang tanpa melalui proses *bootstrap* per request. |
| **Expression Engine** | Mesin evaluator JavaScript lokal yang mengevaluasi ekspresi kondisional (*Show If*, *Warning*, *Editable If*, *Formula*) secara deterministik pada browser maupun aplikasi mobile. |
| **Agent-First CLI** | Desain antarmuka baris perintah (*Command-Line Interface*) yang dirancang khusus untuk dioperasikan oleh agen AI otonom, mengutamakan output mesin JSON, introspeksi skema mandiri, non-interaktif, dan penanganan error yang dapat ditindaklanjuti. |
| **Audit Trail** | Catatan kronologis yang tidak dapat diubah (*immutable log*) yang mencatat setiap peristiwa mutasi data beserta identitas aktor, waktu, dan rincian perubahan untuk keperluan akuntabilitas statistik. |
