# Cerdas: The Open-Source Self-Hosted AppSheet Alternative

**Cerdas** (Indonesian for *Smart/Intelligent*) is a professional, offline-first, no-code data collection platform. It enables organizations to build, deploy, and manage mobile-friendly applications for field data collection with a seamless syncing engine—designed as a lightweight, self-hosted alternative to platforms like Google AppSheet or KoboToolbox.

## 💡 Why Cerdas?

Most no-code platforms come with heavy restrictions. **Cerdas was born out of the frustration with AppSheet's limit of only 10 users for the free/prototype tier.** 

With Cerdas, you are in control:
- **No User Limits**: Support dozens, hundreds, or thousands of field staff without per-user monthly fees.
- **Truly Self-Hosted**: Your data stays on your servers.
- **Offline Intelligence**: Built specifically for environments with poor or no internet connectivity.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Vue 3 & Laravel 12](https://img.shields.io/badge/Stack-Vue%203%20%2B%20Laravel%2012-4FC08D?logo=laravel)](https://laravel.com)
[![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-blue.svg)](https://github.com/yourusername/cerdas)

## 🚀 Key Features

-   **📱 Offline-First Mobile PWA**: Native-like experience using Framework7 and Capacitor. Works flawlessly without an internet connection, syncing data once back online.
-   **🛠️ Drag-and-Drop Form Editor**: Build complex schemas with nested forms, conditional visibility, and dynamic formulas.
-   **🔄 Robust Sync Engine**: Handling large datasets and media attachments (photos, signatures) with conflict resolution.
-   **📁 Multi-Level Grouping**: Organize your tasks similar to AppSheet with deep nested folder structures.
-   **🗺️ Geospatial Support**: Capture GPS locations and visualize data on integrated Map views.
-   **📊 Data Export**: Integrated Excel support for data analysis and reporting.
-   **🔐 Role-Based Access Control**: Advanced permission management via Spatie Laravel Permission.
-   **🔏 Self-Hosted & Privacy Focused**: Total control over your data.

## 🏗️ Architecture & Tech Stack

Cerdas is built as a modern monorepo using **Turbo** and **pnpm**:

-   **Backend**: [Laravel 12](https://laravel.com) API with [Sanctum](https://laravel.com/docs/sanctum) for secure authentication.
-   **Frontend**: [Vue 3](https://vuejs.org) + [Framework7](https://framework7.io) for high-performance mobile UI.
-   **Libraries**:
    -   `maatwebsite/excel` for powerful data exporting.
    -   `spatie/laravel-permission` for flexible RBAC.
-   **Database**: SQLite on the client (via Capacitor SQLite) and MySQL/PostgreSQL/SQLite on the backend.

## 🛠️ Getting Started

### Prerequisites

-   **PHP 8.2+**
-   **Node.js 20+**
-   **pnpm** (`npm install -g pnpm`)
-   **Composer**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/cerdas.git
    cd cerdas
    ```

2.  **Install project-wide dependencies:**
    ```bash
    pnpm install
    ```

3.  **Setup Backend:**
    ```bash
    cd apps/backend
    composer install
    # Or use the built-in setup script:
    composer run setup
    ```

4.  **Run Development Environment:**
    Return to the root directory and run the helper script:
    ```bash
    ./start-all.bat
    ```
    *This will simultaneously launch the Backend, Editor, and Client Apps.*

## 📂 Project Structure

-   `apps/backend`: Laravel 12 API server.
-   `apps/client`: Mobile PWA for data collectors.
-   `apps/editor`: Web interface for building app schemas & layouts.
-   `packages/form-engine`: Core library for rendering JSON-defined forms.
-   `packages/expression-engine`: Logic for handling dynamic formulas and filters.

## 📜 License

This project is licensed under the **MIT License**—the same as Laravel. You are free to use, modify, and distribute it.

---

Built with ❤️ by the Cerdas Community.
