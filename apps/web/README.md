# apps/web

Jarvis OS **web UI** — Next.js App Router.

## Phase 0

- Scaffold and TypeScript config only
- Placeholder page — no API client, auth, or task flows

## Phase 1+

- Talk to `services/api-gateway` via `NEXT_PUBLIC_API_URL`
- Never import `agents/` or OpenClaw

```bash
npm run dev --workspace=@jarvis/web
```
