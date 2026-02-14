# Deploying Cerdas to Coolify (Docker Compose)

Since you are using a seamless Monorepo setup, the best way to deploy to Coolify is via **Docker Compose**. This ensures all services (Backend, Client, Editor) are built and orchestrated together.

## Prerequisites
- A GitHub Repository with this code pushed.
- A running Coolify instance.
- Domains pointed to your server (e.g., `api.dvlpid.my.id`, `app.dvlpid.my.id`, `editor.dvlpid.my.id`).

## Step 1: Add New Resource

1. Go to your Coolify Project/Environment.
2. Click **+ New Resource**.
3. Select **Docker Compose**.
4. Select your **Repository** and **Branch**.
5. Coolify will ask for the **Docker Compose File**, typically it detects `docker-compose.yml`. 
   - **Crucial**: You must tell Coolify to use `docker-compose.prod.yml` instead, or copy the content of `docker-compose.prod.yml` into the text area if asked.
   - If using the UI builder, select **"Docker Compose"** type.

## Step 2: Configure Environment Variables
You need to set these variables in the **Environment Variables** tab of your Coolify resource.

### Backend & General

```bash
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:... (Run 'php artisan key:generate --show' locally to get one)
APP_URL=https://api.dvlpid.my.id

# Database (Use Coolify Database Internal URL if possible, or External)
DB_CONNECTION=mysql
DB_HOST=host.docker.internal (or your database IP/Service Name)
DB_PORT=3306
DB_DATABASE=cerdas
DB_USERNAME=root
DB_PASSWORD=your_password

# Auth Domains (Important for Sanctum)
SANCTUM_STATEFUL_DOMAINS=app.dvlpid.my.id,editor.dvlpid.my.id
SESSION_DOMAIN=.dvlpid.my.id
CORS_ALLOWED_ORIGINS=https://app.dvlpid.my.id,https://editor.dvlpid.my.id,capacitor://localhost,https://localhost
```

### Frontend (Build Args)

Coolify works by injecting env vars at runtime, but Vite needs them at **Build Time**. We configured `docker-compose.prod.yml` to pass this.

```bash
VITE_API_BASE_URL=https://api.dvlpid.my.id
```

## Step 3: Domain Configuration

In the Coolify UI for the Docker Compose resource, you will see individual services (`backend`, `client`, `editor`). You can configure domains for each:

1.  **backend**:
    -   Domain: `https://api.dvlpid.my.id`
    -   Port: `80`
2.  **client**:
    -   Domain: `https://app.dvlpid.my.id`
    -   Port: `80`
3.  **editor**:
    -   Domain: `https://editor.dvlpid.my.id`
    -   Port: `80`

## Step 4: Database Migration

For the first run, you need to migrate the database yourself.
1.  Open the **Terminal** of the `backend` container (in Coolify).
2.  Run: `php artisan migrate --force`.
3.  Run: `php artisan db:seed --force` (if needed).

## Step 5: Webhooks

1.  In Coolify Resource settings, enable **"Sse Git Webhooks"**.
2.  Copy the Webhook URL.
3.  Go to your GitHub Repo -> Settings -> Webhooks -> Add Webhook.
4.  Paste the URL.
5.  Now, every push to `main` (or selected branch) will trigger a redeploy of all services!

---
**Troubleshooting**:
- **Images not loading?** Run `php artisan storage:link` in the backend terminal.
- **CORS Errors?** Check `SANCTUM_STATEFUL_DOMAINS` and `SESSION_DOMAIN`.
- **Vite connection error?** Check `VITE_API_BASE_URL` - must match the backend domain.
- **File Upload Errors?** Ensure `docker-compose.prod.yml` defines the `app_storage` volume and mounts it to `backend`, `worker`, and `scheduler`. This is required for background processing of files.
