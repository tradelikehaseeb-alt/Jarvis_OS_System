---
name: strict-typescript
description: >-
  Enforces strict TypeScript: types, interfaces, null safety, documentation
  comments, clean imports, and reusable models. Use when writing or reviewing
  TypeScript, fixing type errors, refactoring TS modules, or when the user
  asks for strict TypeScript checks or /strict-typescript.
disable-model-invocation: true
---

# Strict TypeScript

Ensure strict TypeScript usage.

Check:

- types
- interfaces
- null safety
- comments
- clean imports
- reusable models

## When to run

Apply this skill when:

- Adding or editing `.ts` / `.tsx` files
- Reviewing PRs or generated TypeScript
- Fixing `tsc` errors or loosening types (`any`, `as` casts)
- Introducing DTOs, API contracts, or shared domain shapes

Confirm `tsconfig` has `"strict": true` (and related flags). If the project disables strict options, flag that as **Critical** before reviewing file-level code.

## Review workflow

1. **Scope** — List changed files; note public APIs (exports) vs internal helpers.
2. **Config** — Verify strict compiler options in the nearest `tsconfig.json`.
3. **Run checks** — Walk the checklist below in order; grep for `any`, `@ts-ignore`, `as unknown`.
4. **Models** — Find duplicate shapes; consolidate into shared types.
5. **Report** — Use the output template; run `tsc --noEmit` when a package script exists.

## Checklist

### Types

- [ ] No `any` (use `unknown` + narrowing, or a proper generic)
- [ ] No implicit `any` from untyped parameters or untyped JSON
- [ ] Prefer `type` for unions, intersections, mapped/conditional types; use `interface` for object contracts that may be extended
- [ ] Exported functions have explicit return types when not obvious from signature
- [ ] Use `satisfies` for literal inference without widening when appropriate
- [ ] Discriminated unions for variant state (not optional fields for every branch)
- [ ] `readonly` on immutable data; `as const` for fixed literal sets

### Interfaces

- [ ] Public API boundaries (HTTP handlers, SDK clients, agent I/O) use named `interface` or `type`, not inline object types repeated across files
- [ ] Extend/narrow interfaces instead of duplicating field lists
- [ ] Avoid empty or marker interfaces unless documented
- [ ] Do not use `interface` for primitives or unions — use `type`

### Null safety

- [ ] `strictNullChecks` enabled; no `!` non-null assertions without a one-line justification comment
- [ ] Prefer narrowing (`if (x == null) return`), optional chaining, and nullish coalescing over assertions
- [ ] `undefined` vs `null` — follow project convention; be consistent in models and API responses
- [ ] Optional properties (`?`) only when absence is valid; use `| null` when explicitly nullable
- [ ] Arrays and records: handle empty (`length === 0`) and missing keys explicitly

### Comments

- [ ] JSDoc on exported functions, classes, interfaces, and non-obvious types (`@param`, `@returns`, `@throws` when relevant)
- [ ] Comments explain **why** (business rules, invariants), not **what** the code already states
- [ ] No commented-out dead code; no stale TODOs without issue reference
- [ ] `@deprecated` with migration hint when replacing public APIs

### Clean imports

- [ ] No unused imports; no wildcard `import *` unless re-exporting a barrel by design
- [ ] Order: external packages → internal absolute → relative (match project ESLint if present)
- [ ] Type-only imports: `import type { Foo } from '...'`
- [ ] No circular imports between modules; break cycles with shared `types/` or interfaces-only files
- [ ] No deep relative chains (`../../../`) when path aliases exist — use aliases

### Reusable models

- [ ] One canonical definition per domain concept (User, Task, AgentMessage, etc.)
- [ ] Shared models live in `types/`, `models/`, or `shared/` — not duplicated in UI and API layers
- [ ] DTO vs domain: separate transport shapes from internal models when mapping differs
- [ ] Zod/io-ts schemas (if used) infer types via `z.infer<typeof Schema>` — do not duplicate by hand
- [ ] Before adding a new interface, search the repo for an existing type to extend or reuse

## Anti-patterns (flag severity)

| Pattern | Severity |
|---------|----------|
| `any`, `// @ts-ignore`, `// @ts-expect-error` without justification | Critical |
| `as SomeType` to silence errors without narrowing | Critical |
| Duplicate interface for same API shape | Suggestion → extract shared model |
| Missing return type on exported function | Suggestion |
| `!` assertion | Suggestion (Critical if hides nullable API data) |
| Barrel file that re-exports everything and causes cycles | Suggestion |

## Output template

```markdown
# Strict TypeScript Review

## Summary
[pass / pass with suggestions / blocked]

## Config
| Option | Status | Notes |
|--------|--------|-------|
| strict | ✅/❌ | |
| strictNullChecks | ✅/❌ | |

## Checklist
| Area | Status | Notes |
|------|--------|-------|
| types | ✅/❌ | |
| interfaces | ✅/❌ | |
| null safety | ✅/❌ | |
| comments | ✅/❌ | |
| clean imports | ✅/❌ | |
| reusable models | ✅/❌ | |

## Findings

### Critical
- [file:line] — issue — fix

### Suggestions
- [file:line] — improvement

### Reusable models
- [duplicate locations] — consolidate to `[proposed path]`

## tsc
[Output of `tsc --noEmit` or N/A]
```

## When implementing fixes

1. Replace `any` with proper types or `unknown` + guards.
2. Extract shared types to the lowest layer allowed by architecture (see `architecture-review` skill).
3. Add JSDoc only on exports and non-obvious logic.
4. Keep diffs minimal; do not rename unrelated symbols.

## Additional resources

- Extended examples and tsconfig reference: [reference.md](reference.md)
