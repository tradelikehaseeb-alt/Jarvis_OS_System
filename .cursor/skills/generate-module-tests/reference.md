# Generate Module Tests — Reference

## Example: API validation (unit)

```typescript
describe("mapCreateTaskBody", () => {
  it("returns dto for valid body", () => { /* ... */ });
  it("throws on missing taskType", () => { /* ... */ });
  it("throws on empty title", () => { /* ... */ });
});
```

## Example: API handler (integration)

```typescript
describe("POST /tasks", () => {
  it("returns 201 and calls orchestrator with mapped dto", async () => {
    const orchestrator = { start: vi.fn().mockResolvedValue({ id: "1" }) };
    // invoke handler with mocked orchestrator; assert status + call args
  });
  it("returns 401 when unauthenticated", async () => { /* ... */ });
});
```

## Example: Orchestrator workflow (integration)

- Mock **agents** only; run real orchestration logic (retries, branching).
- Edge: agent throws mid-workflow → partial state / rollback behavior asserted.

## Example: UI component (unit + integration)

| Type | Setup |
|------|--------|
| Unit | `renderHook` or shallow render; mock `apiClient.post` |
| Integration | `render` with router + QueryClient; MSW or `vi.mock` on API module |

Never: `import { openclawClient } from "..."` in `frontend/**/*.test.*`.

## Edge-case catalog by layer

### UI

- Loading, error, and empty states
- Double submit / disabled while pending
- Invalid form fields and server validation errors

### API

- Malformed JSON body
- Wrong `Content-Type`
- Rate limit / 503 from downstream (mocked orchestrator)

### Orchestrator

- Duplicate `taskId`
- Timeout on agent step
- Retry exhaustion

### Agents

- Tool returns empty or unexpected shape
- Max turns / token limit (if applicable)

### Skills

- Permission denied from external API
- Partial file read / corrupt payload

## Shared test utilities

When the repo has no helpers yet, prefer a single module:

- `testing/mocks/openclawGateway.ts` — server-side only
- `testing/fixtures/task.ts` — valid/invalid DTOs
- `testing/setup.ts` — global vitest/jest setup

Do not create a second parallel `test-utils` tree.

## Commands (detect from repo)

| Tool | Typical command |
|------|-----------------|
| Vitest | `npm test` / `npx vitest run path` |
| Jest | `npm test -- --testPathPattern=path` |
| pytest | `pytest tests/path -q` |

Run the narrowest command that covers changed tests before marking the task done.
