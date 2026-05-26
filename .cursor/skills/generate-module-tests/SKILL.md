---
name: generate-module-tests
description: >-
  Generate tests for every module: unit tests, integration tests, and edge cases.
  Discovers modules, matches project test runners, and respects Jarvis OS layers
  (UI → API → Orchestrator → Agents → Skills). Use when adding tests, creating a
  new module, filling coverage gaps, or when the user asks to generate module
  tests or /generate-module-tests.
disable-model-invocation: true
---

# Generate Module Tests

Generate tests for every module.

Include:

- unit tests
- integration tests
- edge cases

## When to run

Apply this skill when:

- Creating or changing a module and tests are missing or stale
- The user asks for tests, coverage, or `/generate-module-tests`
- A PR or module ships without a colocated or mirrored test file

Read only what you need. Scan the repo for existing test layout before adding files.

## Prerequisites

1. **Detect the test stack** — `package.json`, `vitest.config.*`, `jest.config.*`, `pyproject.toml`, `pytest.ini`, etc. Match existing runner, config, and import aliases.
2. **Do not duplicate** — Reuse helpers in `test/`, `__tests__/`, `testing/`, or `*.test-utils.*`. Extend shared mocks instead of copying setup.
3. **One module → one test surface** — Each production module gets tests; split into `*.unit.test.*` and `*.integration.test.*` only when the repo already does, or when integration setup is heavy.

## Module discovery

Find modules without adequate tests:

```text
Task Progress:
- [ ] List source modules (exclude configs, generated output, barrel-only re-exports)
- [ ] Map each to existing test file(s)
- [ ] Prioritize changed modules, then public API / exports
- [ ] Generate or update tests per module
- [ ] Run test command; fix failures
```

**Module** = file or folder that exports behavior (functions, classes, handlers, hooks, agents, skills). Skip pure `index.ts` re-exports unless they contain logic.

## Test types

### Unit tests

- Test one unit in isolation: pure functions, class methods, hooks (with `@testing-library/react`), validators, mappers.
- Mock **outward** dependencies only (DB, HTTP, OpenClaw, filesystem, clock). Do not mock the unit under test.
- Prefer arrange–act–assert; one logical behavior per `it`/`test`.
- Cover happy path, invalid input, empty/null/undefined, and error branches.

### Integration tests

- Test **real collaboration** across boundaries allowed by the layer (e.g. API handler + service with in-memory or test DB; Orchestrator + mocked Agents).
- Use project fixtures, test containers, or `msw`/HTTP mocks only when the repo already does.
- **UI:** component + provider/router, or page + API client mock — not live OpenClaw.
- **API / Orchestrator / Agents:** route or workflow with mocked lower layers, not skipped entirely.
- Keep fewer, broader tests than unit tests; assert observable outcomes (status, payload shape, side effects).

### Edge cases

For each module, explicitly consider:

| Category | Examples |
|----------|----------|
| Input boundaries | empty, max length, wrong type, malformed JSON |
| Async / time | timeout, rejection, concurrent calls, race ordering |
| State | missing id, duplicate id, partial failure mid-workflow |
| Auth / permissions | unauthenticated, wrong role, expired token |
| External deps | 4xx/5xx, network error, empty response body |
| Idempotency | retry-safe operations, duplicate submissions |

Document non-obvious edge cases in a short comment only when the test name is not self-explanatory.

## Layer rules (Jarvis OS)

Respect architecture from [architecture-review](../architecture-review/SKILL.md):

| Layer | Unit focus | Integration focus |
|-------|------------|-------------------|
| **UI** | Hooks, reducers, formatters; mock API client | Component + router; API mocked |
| **API** | Validation, DTO mapping, auth helpers | Handler + orchestrator gateway (mocked) |
| **Orchestrator** | Workflow steps, retry policy | Start-to-finish with mocked agents |
| **Agents** | Decision logic, tool selection | Agent + mocked skills |
| **Skills** | Tool I/O, parsing, errors | Skill + sandboxed external mock |

**Forbidden in tests (same as prod):** UI tests must not import or call OpenClaw; integration tests use API/orchestrator boundaries.

## File placement and naming

Follow repo convention first. Defaults when none exist:

| Stack | Unit | Integration |
|-------|------|-------------|
| TypeScript / Node | `module.test.ts` or `module.unit.test.ts` next to source or under `__tests__/` | `module.integration.test.ts` |
| Python | `test_module.py` under `tests/` mirroring package path | `test_module_integration.py` |

Use strict TypeScript types in test code; no `any` unless the module under test exports untyped third-party data.

## Workflow per module

1. Read the module exports and dependencies.
2. List behaviors (public API) and edge cases from the table above.
3. Write **unit** tests for each behavior and edge case that does not require real I/O.
4. Add **integration** tests for cross-module flows that matter for this layer.
5. Run the project test command; fix failures before moving on.
6. If the module is trivial (e.g. constant re-export only), one focused unit test is enough — do not pad with redundant assertions.

## Output checklist

After generating tests for a batch of modules:

```markdown
# Module Tests

## Summary
[modules covered, test runner used]

## Added / updated
| Module | Unit | Integration | Edge cases |
|--------|------|-------------|------------|
| path   | n    | n           | brief list |

## Commands run
[e.g. npm test -- path]

## Gaps
[modules deferred and why]
```

## Anti-patterns

- Testing implementation details (private fields, internal call order) instead of behavior
- Snapshot-only tests with no assertion on semantics
- Integration tests that mock every collaborator (that is a unit test)
- Duplicate mock factories — extract to shared test utils
- UI or client bundles importing OpenClaw in test setup

## Additional resources

- Layer examples and mock boundaries: [reference.md](reference.md)
