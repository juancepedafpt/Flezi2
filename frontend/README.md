# Flezi task client

Small React + TypeScript client for the task CRUD API. It uses native `fetch` and no client state/UI framework.

## Run

```bash
npm install
npm run dev
```

Set `VITE_API_URL` when the backend is not running at `http://localhost:8080` (see `.env.example`).

The sample has no authentication. It sends the fixed development UUID `X-User-Id: 00000000-0000-0000-0000-000000000001` so the backend can demonstrate owner scoping. This is not suitable for production authentication.

## Verify

```bash
npm test
npm run build
```

`PUT /tasks/:id` is sent as a full update with `title`, `description`, and `status`.
