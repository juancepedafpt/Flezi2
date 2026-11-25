# Flezi task manager

A small full-stack sample for per-user task CRUD.

## Stack

- Backend: Java 21, Spring Boot, Gradle, Spring Data JPA, PostgreSQL
- Frontend: React, TypeScript, Vite, native `fetch`

## Run locally

Start PostgreSQL from the backend folder:

```bash
cd backend
podman compose up -d postgres
gradle bootRun
```

In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The frontend defaults to `http://localhost:8080` for the API. Set `VITE_API_URL` in `frontend/.env` if the backend runs elsewhere.

The sample has no authentication. The frontend sends a fixed development `X-User-Id` UUID; the backend requires this header to scope tasks and returns `403` for cross-owner access. This header is only a demo identity mechanism and must not be treated as authentication.

## Run tests and build

```bash
cd backend
gradle test
```

```bash
cd frontend
npm test
npm run build
```

## Story estimate

| Factor | Assessment |
| --- | --- |
| Complexity | Medium: CRUD, validation, filtering, and owner scoping |
| Effort | Medium: backend, database setup, frontend, and focused tests |
| Risk / uncertainty | Low to medium: no identity provider or deployment integration is included |
| Fibonacci estimate | 8 points |

The estimate assumes a new minimal sample application and excludes production authentication, deployment, and additional task features.
