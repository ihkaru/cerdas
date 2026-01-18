# Cerdas: The Open-Source Self-Hosted AppSheet Alternative

**Cerdas** (Indonesian for *Smart/Intelligent*) is a professional, offline-first, no-code data collection platform. It enables organizations to build, deploy, and manage mobile-friendly applications for field data collection with a seamless syncing engine—designed as a lightweight, self-hosted alternative to platforms like Google AppSheet or KoboToolbox.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Vue 3 & Laravel](https://img.shields.io/badge/Stack-Vue%203%20%2B%20Laravel-4FC08D?logo=vue.js)](https://vuejs.org)

## 🚀 Key Features

-   **📱 Offline-First Mobile PWA**: Native-like experience using Framework7 and Capacitor. Works flawlessly without an internet connection, syncing data once back online.
-   **🛠️ Drag-and-Drop Form Editor**: Build complex schemas with nested forms, conditional visibility, and dynamic formulas.
-   **🔄 Robust Sync Engine**: Handling large datasets and media attachments (photos, signatures) with conflict resolution.
-   **📁 Multi-Level Grouping**: Organize your tasks similar to AppSheet with deep nested folder structures.
-   **🗺️ Geospatial Support**: Capture GPS locations and visualize data on integrated Map views.
-   **🔏 Self-Hosted & Privacy Focused**: Total control over your data. Deploy on your own infrastructure using Docker or standard PHP environments.

## 🏗️ Architecture & Tech Stack

Cerdas is built as a modern monorepo using **Turbo** and **pnpm**:

-   **Backend**: [Laravel 11](https://laravel.com) API with Sanctum for secure authentication.
-   **App Renderer**: [Vue 3](https://vuejs.org) + [Framework7](https://framework7.io) for high-performance mobile UI.
-   **Form Builder**: Custom-built `@cerdas/form-engine` for dynamic schema rendering.
-   **Storage**: Shared SQLite on the client (via Capacitor SQLite) and MySQL/PostgreSQL on the backend.
-   **Desktop/Web**: Fully responsive web interface for administrative management.

## 🛠️ Getting Started

### Prerequisites

-   Node.js 20+
-   PHP 8.2+
-   Composer
-   pnpm (`npm install -g pnpm`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/cerdas.git
    cd cerdas
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Setup Backend:**
    ```bash
    cd apps/backend
    cp .env.example .env
    composer install
    php artisan key:generate
    php artisan migrate --seed
    ```

4.  **Run Development Environment:**
    From the root directory:
    ```bash
    ./start-all.bat
    ```
    *This will start the Backend, Editor, and Client Apps simultaneously.*

## 📂 Project Structure

-   `apps/backend`: Laravel API server.
-   `apps/client`: Mobile PWA for data collectors.
-   `apps/editor`: Web interface for building app schemas & layouts.
-   `packages/form-engine`: Core library for rendering JSON-defined forms.
-   `packages/expression-engine`: Logic for handling dynamic formulas and filters.

## 📜 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute it for personal or commercial projects.

---

Built with ❤️ by the Cerdas Community.
