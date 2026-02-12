# Docker Local Environment Setup

## Overview
We have added a `docker-compose.dev.yml` file to support a full-stack local Docker environment, including a managed MariaDB service. This fixes the issue where the backend container would exit due to missing database connection.

## Prerequisites
- Docker & Docker Compose
- `apps/backend/vendor` should ideally be ignored or handled by the container build (we added exclusions to `.dockerignore`).

## Setup Instructions

1.  **Create Docker Environment File**
    Copy the example environment file to `.env.docker`:
    ```powershell
    cp .env.docker.example .env.docker
    ```
    (Modify `.env.docker` if you have specific local secrets or need to change ports).

2.  **Build and Start Services**
    Run the following command to build and start the containers using the development compose file:
    ```powershell
    docker-compose -f docker-compose.dev.yml up -d --build
    ```

3.  **Verify Services**
    - **Backend Health**: `curl http://localhost:8080/api/health`
    - **Client (Mobile)**: http://localhost:8000
    - **Editor (Web)**: http://localhost:8001
    - **Database**: Port 33066 (user: `cerdas`, pass: `secret`, db: `cerdas`)

## changes Made
- Added `docker-compose.dev.yml` with `mariadb` service.
- Added `.env.docker.example`.
- Updated root `.dockerignore` to recursively exclude `node_modules` and `vendor`.
- Added `apps/client/.dockerignore` and `apps/editor/.dockerignore`.

## Troubleshooting
- If `client` or `editor` build fails with "unknown file mode" or "symlink" errors, ensure your `.dockerignore` is correctly excluding `node_modules`.
- If backend lacks permissions, `chown` in Dockerfile handles it, but it might take time on first build.

## Android Development

To run the Android app using the local Docker backend:

1.  **Start Scripts**:
    Run the following batch script:
    ```cmd
    start-android-docker.bat
    ```
    This script will:
    -   Stop existing servers.
    -   Start `docker-compose.dev.yml` (Backend + DB).
    -   Configure the client to use `http://10.0.2.2:8080/api`.
    -   Start the client dev server with Live Reload.
    -   Launch the Android Emulator and Android Studio.

2.  **Verify**:
    -   The app should launch in the emulator.
    -   API requests should hit the Docker backend (check Docker logs).
