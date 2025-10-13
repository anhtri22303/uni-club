This project now uses short-lived check-in tokens for QR codes.

- To enable Redis storage for tokens, set the environment variable `REDIS_URL` (e.g., `redis://:@localhost:6379/0`).
- If `REDIS_URL` is not set, the app falls back to an in-memory store (not suitable for production).
- Token TTL is 30 seconds. QR generation requests `/api/checkin/token` and returns `{ token }`.
- Validate endpoint: POST `/api/checkin/validate` with `{ token }`.

Local dev: after changing package.json, run:

```powershell
pnpm install
pnpm dev
```

On production: ensure `REDIS_URL` is configured in your deployment environment.


Login Google
GET membership my club thêm full name và MSSV
