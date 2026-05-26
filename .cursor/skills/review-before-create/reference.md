# Review Before Create — Reference

## Search commands (adapt paths)

```bash
# Planned symbol name
rg -n "functionName|className" --glob "*.{ts,tsx,js,py}"

# Distinctive string from draft implementation
rg -n "exact error or label text"

# Parallel folder names
rg --files | rg -i "util|helper|common|shared"

# Similar filenames
rg --files -g "*user*service*"
```

## Duplicate folder heuristics

| Pattern | Verdict |
|---------|---------|
| Two roots with 80%+ same subfolder names | Merge or designate one canonical |
| `shared/X` and `lib/X` same topic | Single module under `shared/` |
| Feature copied per agent (`agent-a/tools/`, `agent-b/tools/` identical) | `agents/common/tools/` or shared skill |

## Repeated function signals

- Same body with renamed variables
- Copy-paste with one line changed (host URL, log prefix)
- Identical try/catch + retry in API and Orchestrator
- Duplicate React hooks (`useFetchX`, `useLoadX` same effect)

## Extract placement (Jarvis-style layers)

| Callers | Put shared code in |
|---------|-------------------|
| UI + API (types only) | `shared/types/` — no runtime Node-only deps in client bundle |
| API + Orchestrator | `shared/domain/` or `api/lib/` if API-only |
| Orchestrator + Agents | `orchestrator/lib/` or `agents/common/` |
| Multiple skills | `skills/_shared/` or project `shared/skills/` |

Never place shared runtime logic under `ui/` if server layers need it.

## Example review

**Request:** Add `frontend/lib/formatDate.ts` and `api/utils/formatDate.ts`.

**Finding:** Block — same formatting in `shared/datetime.ts` (or create once in `shared/`).

**Action:** Extend `shared/datetime.ts`; import from UI (via allowed path) and API.

---

**Request:** New folder `services/task-runner/` when `orchestrator/tasks/` exists.

**Finding:** Block — duplicate responsibility.

**Action:** Add `run()` to `orchestrator/tasks/` instead of new top-level tree.

## Relation to other skills

| Skill | When |
|-------|------|
| **review-before-create** | Before any new file/folder |
| **architecture-review** | Layer boundaries, OpenClaw, SOLID after code exists |
| **strict-typescript** | Types and shared models when extracting TS |
