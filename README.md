# Spotify Analytics Platform (V2 Local-First)

Enterprise-style local stack with:
- `web-app` (`Next.js`) on `:4000`
- `edge-api` (`Fastify`, TypeScript, cookie session BFF) on `:3000`
- `core-api` (`Spring Boot 3`, Java 21, Flyway, PostgreSQL, Redis) on `:8080`
- `postgres`, `redis`, `otel-collector` via Docker Compose

## Start locally
```powershell
./scripts/start-local.ps1
```

or

```powershell
docker compose up --build -d
```

For local first-run, use `POST /auth/session/dev-login` from UI `/login`.
OIDC (`/auth/session/login`) is enabled when `OIDC_*` env vars are set.

## Smoke test
```powershell
./scripts/smoke-test.ps1
```

## Seed demo data
```powershell
./scripts/demo-seed.ps1
```

## UI routes
- `http://localhost:4000/login`
- `http://localhost:4000/dashboard`
- `http://localhost:4000/analytics`
- `http://localhost:4000/playlists`
- `http://localhost:4000/settings/integrations`
- `http://localhost:4000/admin/jobs`

## API routes
- Edge session/auth:
  - `GET /auth/session/login`
  - `GET /auth/session/callback`
  - `POST /auth/session/dev-login`
  - `POST /auth/session/logout`
  - `GET /auth/session/me`
- Edge Spotify/sync:
  - `GET /integrations/spotify/connect`
  - `GET /auth/spotify/callback`
  - `POST /integrations/spotify/disconnect`
  - `POST /sync/spotify/start`
  - `GET /sync/spotify/status`
  - `GET /me/summary`
  - `GET /me/top`
  - `GET /me/playlists`
- Core jobs/tokens:
  - `POST /jobs/spotify/sync`
  - `GET /jobs/{jobId}`
  - `GET /users/{userId}/sync-state`
  - `POST /tokens/spotify`
  - `DELETE /tokens/spotify/{userId}`

## API docs
- Core Swagger UI: `http://localhost:8080/swagger-ui`
- Core OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Edge Swagger UI: `http://localhost:3000/docs`
- Edge OpenAPI JSON: `http://localhost:3000/docs/json`
