# Docker Local Environment Setup

## Overview
We utilize a robust `docker-compose.dev.yml` stack that mirrors production stability. It uses a **Role-Based Container Architecture** where the same backend image is repurposed for different services (API, Reverb, Worker, Scheduler) using the `CONTAINER_ROLE` environment variable.

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
    - **Backend Health**: `curl http://localhost:9980/up`
    - **Client (Mobile)**: http://localhost:9981
    - **Editor (Web)**: http://localhost:9982
    - **Database**: Port 33066 (user: `cerdas`, pass: `secret`, db: `cerdas`)

## Architecture Changes
- **Role-Based Entrypoint**: Uses `start-container.sh` to dynamically boot specialized services.
- **Service Dependency**: Implemented `depends_on: service_healthy` to ensure the API and Reverb only start after the Database is ready.
- **High Concurrency**: Development now uses **FrankenPHP + Laravel Octane** by default, ensuring dev-prod parity in execution speed and memory management.
- **Real-time**: Dedicated `reverb` service running on Port **8081**.

## Troubleshooting
- If `client` or `editor` build fails with "unknown file mode" or "symlink" errors, ensure your `.dockerignore` is correctly excluding `node_modules`.
- If backend lacks permissions, `chown` in Dockerfile handles it, but it might take time on first build.

## Android Development

To run the Android app using the local Docker backend:

1.  **Start Scripts**:
    Run the following batch script:
    ```cmd
    scripts/start-android-docker.bat
    ```
    This script will:
    -   Stop existing servers.
    -   Start `docker-compose.dev.yml` (Backend + DB).
    -   Configure the client to use `http://10.0.2.2:9980/api`.
    -   Start the client dev server with Live Reload.
    -   Launch the Android Emulator and Android Studio.

2.  **Verify**:
    -   The app should launch in the emulator.
    -   API requests should hit the Docker backend (check Docker logs).
