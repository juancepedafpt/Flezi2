# Todo backend

Minimal Spring Boot CRUD API for the sample task story.

## Run locally

Start PostgreSQL with Podman or Docker:

```bash
podman compose up -d postgres
gradle bootRun
```

Every request uses `X-User-Id: <UUID>` as a demo owner context. This is not authentication; it only makes ownership behavior testable without an auth system. A missing or invalid header returns `400`. Cross-owner updates and deletes return `403`.

Endpoints:

- `GET /tasks?status=open|done`
- `POST /tasks` with `{ "title": "Buy milk", "description": "", "status": "open" }`
- `PUT /tasks/{id}` with the full editable payload, including `status`
- `DELETE /tasks/{id}`

Run tests with `gradle test`. The test profile uses an in-memory H2 database.
