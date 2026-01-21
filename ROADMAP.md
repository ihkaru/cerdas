# Cerdas Roadmap & Feature Tracker

Dokumen ini melacak fitur jangka panjang (rencana awal) dan fitur yang telah diselesaikan.
**Status Terakhir Diupdate:** 2026-01-19

## ✅ Fitur Selesai (Completed Features)

### 1. Core Architecture & Foundation

- [x] **Tech Stack Setup**: Laravel 12 (Backend), Vue 3 + Framework7 (Client & Editor), SQLite (Offline).
- [x] **Monorepo Structure**: `apps/backend`, `apps/client`, `apps/editor`, `packages/types`.
- [x] **Database Schema**: Multi-tenant (Organization -> App -> Form -> Assignment).
- [x] **Terminology Refactor**: Standardized to Apps (Proyek) and Forms (Schema).
- [x] **Android Build System**: Configured for API 29+, Live Reload, and production signing readiness.

### 2. Form Renderer (Client App)

- [x] **Premium UI**: Modern, clean design with customized F7 components.
- [x] **Field Components**:
  - Text & Number (Debounced, Optimized).
  - GPS Field (Leaflet Map, High Accuracy, Permissions).
  - Image Field (Camera/Gallery, Compression, "Box Style").
  - HTML Block (Instructions, Alerts).
- [x] **Validation Logic**: Client-side JS closures (working offline).
- [x] **Nested Forms**: Support for `CanEvaluateModules` (Repeatable sections).
- [x] **Performance**: Virtual scrolling for large lists, shallowRef optimizations.

### 3. Offline Capabilities & Sync

- [x] **Local Storage**: `capacitor-community/sqlite` (Jeep-SQLite for Web) integration.
- [x] **Sync Engine**: Bi-directional sync (Push Responses, Pull Assignments).
- [x] **Conflict Resolution**: Last-Write-Wins strategy.
- [x] **Draft System**: Local drafts saved automatically before sync.

### 4. Navigation & Dashboard (AppShell)

- [x] **Dynamic Navigation**: Tab-based navigation configured via JSON.
- [x] **Assignment Management**: List view with Search, Filtering, and Grouping.
- [x] **Data Visualization**: Basic dashboard stats.
- [x] **Hardware Navigation**: Android Back Button handling (Close Modal -> Back -> Exit).

### 5. Editor (Initial Phase)

- [x] **WYSIWYG Preview**: Iframe-based live preview of the Client App within the Editor.
- [x] **Basic Form Configuration**: Settings, Name, Icon.
- [x] **CSV Import**: Wizard for bulk importing assignments/pre-list data.
- [x] **Action Management**: Configuring Header, Row, and Swipe actions (Delete, Complete, etc.).

---

## 🚀 Fitur Jangka Panjang (Planned / In Progress)

### Phase 5: Advanced No-Code Editor (Current Focus)

- [ ] **Schema Builder UI**: Interface berbasis tombol (Simple) untuk menambah/mengatur field form.
- [ ] **Column Settings**: UI lengkap seperti AppSheet untuk edit properti field (Show_If, Editable_If, Formula).
- [ ] **Logic Builder**: UI visual untuk membuat logic/validasi tanpa coding manual JSON.
- [ ] **View Configuration**: UI untuk mengatur tampilan (Deck, Table, Map, Calendar, Detail).

### Phase 6: Sync & Data Robustness

- [ ] **Background Sync**: Sync otomatis di background (jika memungkinkan di Android baru).
- [ ] **Large Dataset Strategy**: Handling ribuan baris data referensi (Reference Tables) offline.
- [ ] **Smart Delta Sync**: Hanya download data yang berubah untuk hemat kuota.

### Advanced Fields & Media

- [ ] **Signature Field**: Tanda tangan digital.
- [ ] **Barcode/QR Scanner**: Scan untuk input data/pencarian.

- [ ] **Reference Type**: Lookup ke tabel/form lain (Relationship).

### Automation & Reporting

- [ ] **Bot/Automation**: Trigger email/webhook saat data masuk.
- [ ] **PDF Generator**: Generate laporan PDF custom dari hasil input.
- [ ] **Excel Export**: Export data assignment/response ke Excel yang rapi.
- [ ] **Google Sheet 2-Way Sync**: Sinkronisasi 2 arah via API v3 (files.watch + Self-Healing Scheduler).

### Security & Management

- [ ] **Role Management UI**: Interface untuk atur role user (Enumerator vs Supervisor).
- [ ] **Row-Level Security**: Filter data assignment berdasarkan User ID (Security Filters).

### Polish & UX

- [ ] **Dark Mode**: Dukungan penuh tema gelap di semua aplikasi.
- [ ] **Multi-language**: Dukungan Bahasa Indonesia/English (i18n).
- [ ] **Onboarding**: Tutorial untuk user baru.
