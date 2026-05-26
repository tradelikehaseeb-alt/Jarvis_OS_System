---
name: review-before-create
description: >-
  Reviews the codebase before creating files or folders. Detects duplicate
  folders, duplicate logic, and repeated functions; consolidates into shared
  modules. Use when adding features, scaffolding, new modules, or when the
  user asks to review before create or /review-before-create.
disable-model-invocation: true
---

# Review Before Create

Review codebase before creating files.

Detect:

- duplicate folders
- duplicate logic
- repeated functions

Move repeated code into shared modules.

## When to run

**Mandatory gate** — Do not create files or folders until this review completes when:

- Adding a new module, service, component, hook, or util file
- Scaffolding a feature (new `api/`, `agents/`, `components/` subtree, etc.)
- The user asks to "add", "create", or "implement" something new

Skip only for trivial edits (typos, single-line fixes) inside an existing file.

Pair with [architecture-review](../architecture-review/SKILL.md) when changes cross UI/API/Orchestrator/Agents/Skills.

## Workflow

Copy and track:

```
Pre-create review:
- [ ] Step 1: Inventory existing layout
- [ ] Step 2: Scan for duplicate folders
- [ ] Step 3: Scan for duplicate logic and repeated functions
- [ ] Step 4: Decide — reuse, extend, or extract (not duplicate)
- [ ] Step 5: Create only what is missing; extract first if needed
```

### Step 1: Inventory

- List top-level and feature folders (`ui`, `api`, `orchestrator`, `agents`, `skills`, `shared`, `lib`, `utils`, etc.).
- Note existing `shared/`, `common/`, `lib/` (or project equivalent) — new code should land there when shared.

### Step 2: Duplicate folders

Flag when two trees serve the same purpose or overlap names:

| Signal | Example |
|--------|---------|
| Synonym dirs | `utils/` and `helpers/`, `common/` and `shared/` |
| Parallel feature splits | `user-service/` and `users/` both doing user CRUD |
| Layer leak copies | `ui/lib/openclaw/` vs `api/openclaw/` doing the same mapping |
| Empty or stub mirrors | `services/foo/` and `foo/` |

**Action:** Extend the canonical folder; do not add a third parallel tree. Merge or alias in docs only if merge is out of scope.

### Step 3: Duplicate logic and repeated functions

Search before writing:

- **Names:** `grep` for exported function/class names you plan to add.
- **Behavior:** Search for distinctive strings (error messages, URL paths, env keys, magic constants).
- **Shapes:** Similar validation, DTO mapping, fetch wrappers, retry loops.

Treat as **repeated** when behavior matches (not just similar file names).

### Step 4: Reuse decision

| Situation | Do this |
|-----------|---------|
| Exact or near-exact function exists | Import and call it; do not copy |
| Same logic, different signature | Generalize in place or add overload in existing module |
| Same logic, 2+ call sites, no shared home | **Extract first** to `shared/` (or layer-allowed shared), then import |
| Folder would duplicate an existing area | Add to existing folder |

**Extract before create** when duplication is ≥ ~6 lines or will clearly be reused.

### Step 5: Create

- Prefer adding to an existing file if SRP still holds and file size is reasonable.
- New file only when no suitable home exists; place under the correct layer folder.
- After extract, update all call sites; remove dead duplicates in the same change when safe.

## Shared module rules

- **Location:** Lowest layer all callers may use (`shared/`, `lib/` — must not import UI-only or client-only code into server shared).
- **Naming:** Capability-based (`task-mapper`, `retry-policy`), not `misc` or `helpers2`.
- **Exports:** Narrow public surface; keep internals unexported.
- **No upward imports:** Shared must not depend on API, Orchestrator, Agents, or UI.

## Output template

```markdown
# Pre-Create Review

## Verdict
[Proceed / Extract first / Block — duplicate exists]

## Existing matches
| Kind | Location | Notes |
|------|----------|-------|
| Folder / module / function | path | reuse or merge |

## Planned action
- Reuse: [paths]
- Extract to: [shared path] (if needed)
- Create: [only net-new paths]

## Duplicates found
- [kind] — [paths] — [recommendation]
```

Severity:

- **Block** — Creating a new file would duplicate an existing module; use existing path.
- **Extract first** — Repeated logic must move to shared before feature work.
- **Suggestion** — Optional consolidation.

## Fixing (when implementing)

1. Extract shared code; run tests/typecheck if available.
2. Wire imports from existing call sites.
3. Create only the delta (new exports, thin wrappers, routes).
4. Delete or deprecate superseded duplicates in the same PR when low risk.

For search patterns and examples, see [reference.md](reference.md).
