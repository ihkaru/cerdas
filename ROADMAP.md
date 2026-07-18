# Cerdas Roadmap & Feature Tracker

Dokumen ini melacak fitur jangka panjang (rencana awal) dan fitur yang telah diselesaikan.
**Status Terakhir Diupdate:** 2026-07-18

## ✅ Fitur Selesai (Completed Features)

### 1. Core Architecture & Foundation
- [x] **Tech Stack Setup**: Laravel 12 (Backend), Vue 3 + Framework7 (Client & Editor), SQLite (Offline).
- [x] **Monorepo Structure**: `apps/backend`, `apps/client`, `apps/editor`, `packages/types`.
- [x] **Database Schema**: Multi-tenant (Organization -> App -> AppMembership).
- [x] **Terminology Refactor**: Standardized to Apps (Proyek) and Tables (Schema).
- [x] **Android Build System**: Configured for API 29+, Live Reload, and production signing readiness.

### 2. Form Renderer (Client App)
- [x] **Premium UI**: Modern, clean design with customized F7 components.
- [x] **Field Components**:
  - Text & Number (Debounced, Optimized).
  - GPS Field (Leaflet Map, High Accuracy, Permissions, Accuracy Warning).
  - Image Field (Camera/Gallery, Compression, "Box Style").
  - Signature Field (Digital pad capture and raw base64 upload).
  - HTML Block (Instructions, Alerts).
- [x] **Validation Logic**: Client-side JS closures (working offline).
- [x] **Nested Forms**: Support for repeatable sections.
- [x] **Performance**: Virtual scrolling for large lists, shallowRef optimizations.

### 3. Offline Capabilities & Sync
- [x] **Local Storage**: `capacitor-community/sqlite` (Jeep-SQLite for Web) integration.
- [x] **Sync Engine**: Bi-directional sync (Push Responses, Pull Assignments).
- [x] **Conflict Resolution**: Last-Write-Wins strategy.
- [x] **Draft System**: Local drafts saved automatically before sync.
- [x] **Smart Delta Sync**: Mekanisme sinkronisasi inkremental berbasis parameter `updated_since` — client hanya mengunduh data penugasan atau skema aplikasi yang mengalami perubahan setelah stempel waktu (timestamp) sinkronisasi terakhir, menghemat kuota internet pengguna lapangan secara signifikan.
- [x] **SQLite Soft-Delete Sync**: Cleanup orphaned/tombstoned data on sync.

### 4. Navigation & Dashboard (AppShell)
- [x] **Dynamic Navigation**: Tab-based navigation configured via JSON and synced with Editor.
- [x] **Assignment Management**: List view with Search, Filtering, and Grouping.
- [x] **Data Visualization**: Basic dashboard stats.
- [x] **Hardware Navigation**: Android Back Button handling (Close Modal -> Back -> Exit).

### 5. Editor (Web)
- [x] **WYSIWYG Preview**: Iframe-based live preview of the Client App with connection checks.
- [x] **Basic Form Configuration**: Settings, Name, Icon.
- [x] **No-Code Schema Builder UI**: Interface berbasis tombol untuk menambah, menghapus, dan menyusun field form secara visual.
- [x] **Column Settings**: UI lengkap seperti AppSheet untuk edit properti field (Show_If, Editable_If, required_if, label, placeholder, options).
- [x] **View Configuration UI**: UI panel kustom untuk mengatur tata letak view (Deck view key mapping, Map view markers/clustering, dan Navigation menu tabs).
- [x] **Excel/CSV Import**: Wizard untuk bulk importing assignments/pre-list data dengan 5MB chunked upload.
- [x] **Action Management**: Configuring Header, Row, and Swipe actions (Delete, Complete, dll).
- [x] **Data Preview Grid**: Interactive grid table di dalam editor menampilkan data AppRecord mentah hasil impor.
- [x] **Monaco/CodeMirror Editor**: Panel editor kode JSON skema dengan fitur instan apply & autocomplete.

### 6. Production, Security & Deployment
- [x] **Docker Container**: FrankenPHP/Octane production-ready compose config.
- [x] **Pusat Unduhan APK**: Automatic sync command `php artisan apk:sync-version` caching latest GitHub release metadata, and `ApkDownloadCard` in app dashboard.
- [x] **Automated Release**: Version tags (`vX.Y.Z`) dan APK build/upload on GitHub releases.
- [x] **Row-Level Access Control**: Filter penugasan berbasis peran di backend API (`AssignmentController` & `ResponseController`) — enumerator/supervisor hanya dapat mengakses baris data yang ditugaskan ke ID mereka.

---

## 🚀 Fitur Jangka Panjang (Planned / In Progress)

### Phase 5: Advanced No-Code Editor (Current Focus)
- [ ] **AI Context Button (Vibe Coding Bridge)**: Tombol sekali-klik di Editor App untuk menyalin seluruh paket konteks metadata aplikasi (skema field, layout view, stempel waktu, dan user context). Paket ini dapat langsung ditempel (*paste*) ke Claude/Gemini/ChatGPT untuk menginstruksikan AI eksternal menulis logika formula/validasi kustom (`show_if_fn`, `required_if_fn`) secara instan dan akurat.
- [ ] **Dynamic Security Filters**: Fitur penyaringan data tingkat baris (Row-Level Security) dinamis berbasis formula kustom yang diinput oleh admin (misal: `[Suku] == ctx.user.suku` atau `[Wilayah] == 'Sambora'`).

### Phase 6: Sync & Data Robustness
- [ ] **Large Dataset Strategy**: Handling ribuan baris data referensi (Reference Tables) offline.

### Advanced Fields & Media
- [ ] **Barcode/QR Scanner**: Scan untuk input data/pencarian.
- [ ] **Reference Type**: Lookup ke tabel/form lain (Relationship).

### Automation & Reporting
- [ ] **Bot/Automation**: Trigger email/webhook saat data masuk.
- [ ] **PDF Generator**: Generate laporan PDF custom dari hasil input.
- [ ] **2-Way Google Sheet Sync**: Sinkronisasi 2 arah via API v3 (files.watch + Self-Healing Scheduler).

### Polish & UX
- [ ] **Dark Mode**: Dukungan penuh tema gelap di semua aplikasi.
- [ ] **Multi-language**: Dukungan Bahasa Indonesia/English (i18n).
- [ ] **Onboarding**: Tutorial/panduan interaktif pemandu alur kerja bagi pengguna baru.
