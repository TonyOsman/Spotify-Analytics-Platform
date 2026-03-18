# Spotify Analytics Platform

API-first backend platform with a Java core service and a Node.js edge/BFF.

## Services
- `core-api` (`Spring Boot 3`, `Java 21`) on `:8080`
- `edge-api` (`Fastify`, `TypeScript`) on `:3000`
- `postgres`, `redis`, `otel-collector` via Docker Compose

## Run locally
```bash
docker compose up --build
```

## Main routes
- Edge API:
  - `GET /auth/spotify/login`
  - `GET /auth/spotify/callback`
  - `POST /auth/logout`
  - `GET /me/summary`
  - `GET /me/top?range=short|medium|long&type=tracks|artists`
  - `GET /me/playlists`
- Core API:
  - `POST /ingest/spotify/profile`
  - `POST /ingest/spotify/top-items`
  - `POST /ingest/spotify/playlists`
  - `GET /analytics/genre-distribution`
  - `GET /analytics/audio-feature-trends`
  - `GET /analytics/diversity-score`
  - `GET /health/live`
  - `GET /health/ready`

## API docs
- Core API Swagger UI: `http://localhost:8080/swagger-ui`
- Core API OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Edge API Swagger UI: `http://localhost:3000/docs`
- Edge API OpenAPI JSON: `http://localhost:3000/docs/json`
