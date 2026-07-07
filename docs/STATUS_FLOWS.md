# Alur Status Penugasan (Assignment Status Flows)

Dokumen ini menyajikan tabel pemetaan status penugasan (*assignment status*) untuk **Simple Mode** dan **Complex Mode** di seluruh bagian sistem Cerdas (Database, REST API, Layar Ponsel Client, dan Dashboard Monitoring Admin).

---

## 1. Alur Transisi Status per Mode

| Mode Aplikasi | Alur Transisi Utama (State Machine) | Deskripsi Ringkas |
| :--- | :--- | :--- |
| **Simple Mode** | `assigned` ➔ `in_progress` ➔ `submitted` | Pengisian selesai dan langsung dikirim secara final ke server. Status akhir adalah `submitted`. |
| **Complex Mode** | `assigned` ➔ `in_progress` ➔ `submitted` ➔ `approved` (atau `rejected` ➔ `in_progress`) | Data dikirim ke server (`submitted`), kemudian ditinjau oleh supervisor untuk disetujui (`approved`) atau ditolak (`rejected`). |

---

## 2. Tabel Pemetaan Status Seluruh Sistem

Tabel ini merinci representasi teknis dan visual dari 5 status canonical di semua tingkat arsitektur Cerdas (setelah unifikasi istilah):

| Status DB | Mode | UI Client (Tab Filter) | UI Client (Label Subtitle) | UI Client (Garis Warna) | Form di Client | Dashboard Monitoring (Tab Filter) | Dashboard Monitoring (Badge Status) |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **`assigned`** | Simple & Complex | **Pending** | `Pending` | Abu-abu | Terbuka (Edit) | *(Semua)* | **Assigned** (Abu-abu) |
| **`in_progress`** | Simple & Complex | **Proses** | `Proses` | Biru | Terbuka (Edit) | **In Progress** | **In Progress** (Biru) |
| **`submitted`** | Simple & Complex | **Selesai** | `Terkirim` (Simple) / `Menunggu Review` (Complex) | Oranye | **Terkunci (Read-only)** | **Pending Review** (Hanya Complex) / **Submitted** (Simple) | **Pending Review** / **Submitted** (Oranye) |
| **`approved`** | Hanya Complex | **Selesai** | `Disetujui` | Teal (Hijau) | **Terkunci (Read-only)** | **Approved** | **Approved** (Teal) |
| **`rejected`** | Hanya Complex | **Proses** | `Dikembalikan` | Merah | Terbuka (Edit Ulang) | **Returned** | **Returned** (Merah) |

---

## 3. Logika Aksi & Pemicu Status (Backend & Client)

| Aksi Pengguna | Pelaku | Status Awal | Status Akhir | Dampak di SQLite Lokal & Server |
| :--- | :---: | :---: | :---: | :--- |
| **Buka Form Pertama Kali** | Enumerator | `assigned` | `in_progress` | Diset otomatis di lokal. Server mendeteksi perubahan saat sync. |
| **Simpan Draf Formulir** | Enumerator | `in_progress` | `in_progress` | Tersimpan sebagai draf offline. Status tidak berubah. |
| **Menekan Tombol "Finish"** | Enumerator | `in_progress` | `submitted` | Form di HP terkunci (**Read-Only**). Data siap diunggah ke server. |
| **Proses Sinkronisasi (Sync Push)** | Sistem Client | `submitted` | *(Mengikuti Server)* | Data dikirim ke API server. Server mengubah status DB menjadi `submitted`. |
| **Proses Sinkronisasi (Sync Pull)** | Sistem Client | *(Sembarang)* | *(Mengikuti Server)* | Client mengambil status terbaru dari server. SQLite lokal client di-update mengikuti keputusan server. |
| **Menekan Tombol "Approve"** | Supervisor | `submitted` | `approved` | Data disetujui di server. Saat client melakukan sync pull berikutnya, status di HP enumerator akan berubah menjadi `Disetujui` (Tetap terkunci). |
| **Menekan Tombol "Reject"** | Supervisor | `submitted` | `rejected` | Data ditolak di server. Saat client melakukan sync pull berikutnya, status di HP enumerator berubah menjadi `Dikembalikan` (Form terbuka kembali untuk diperbaiki). |

---

## 4. Lokasi File Pengaturan Status

* **Status Helper UI Client**: [statusHelpers.ts](file:///home/ihza/Projects/cerdas/apps/client/src/app/dashboard/utils/statusHelpers.ts)
* **Kueri Hitungan Status Client**: [AssignmentQueryService.ts](file:///home/ihza/Projects/cerdas/apps/client/src/app/dashboard/services/AssignmentQueryService.ts)
* **Pemuat Mode Form Detail Client**: [useAssignmentLoader.ts](file:///home/ihza/Projects/cerdas/apps/client/src/pages/assignment-detail/composables/useAssignmentLoader.ts)
* **Alur Transisi Sync Server**: [ResponseController.php](file:///home/ihza/Projects/cerdas/apps/backend/app/Http/Controllers/Api/ResponseController.php)
* **Filter Monitoring Dashboard**: [SubmissionsPanel.vue](file:///home/ihza/Projects/cerdas/apps/editor/src/app/app-editor/components/monitoring/SubmissionsPanel.vue)
