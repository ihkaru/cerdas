---
description: Start all development servers (Backend, Client, Editor)
---

# Start Development Servers

## Quick Start (Recommended)
// turbo-all

Run from project root:
```bash
.\start-all.bat
```

This starts:
- **Backend API**: http://localhost:8080 (Caddy + PHP-CGI)
- **Client App**: http://localhost:9981 (Vue PWA)
- **Editor App**: http://localhost:9982 (Form Editor)
- **Reverb WS**: ws://localhost:6001 (Real-time WebSocket)

## Stop All Servers

```bash
.\stop-all.bat
```

## Configuration

Ports and paths are configured in `scripts/config.bat`:
- `PHP_PATH`: C:\php83-nts
- `BACKEND_PORT`: 8080
- `CLIENT_PORT`: 9981
- `EDITOR_PORT`: 9982

## Individual Server Commands

If you need to start servers individually:

### Backend Only
```bash
cd apps/backend
php artisan serve --port=8080
```

### Client App Only
```bash
cd apps/client
pnpm dev --host --port 9981
```

### Editor App Only
```bash
cd apps/editor
pnpm dev --port 9982
```

## Notes
- Backend uses Caddy as reverse proxy (handles routing, CORS)
- Client and Editor are Vite dev servers
- All servers run in separate terminal windows
