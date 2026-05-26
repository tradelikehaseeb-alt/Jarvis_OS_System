# skills/

Focused capabilities invoked by agents via `SkillRegistry` + `SkillExecutor`.

| Package | Skill | Bound agent |
|---------|-------|-------------|
| `shared/` | `@jarvis/skills-shared` | Framework |
| `search-skill/` | `@jarvis/search-skill` | Hermes |
| `file-skill/` | `@jarvis/file-skill` | OpenClaw gateway |
| `browser-skill/` | `@jarvis/browser-skill` | OpenClaw gateway |

## Phase 13 flow

```
Hermes → SkillExecutor → SearchSkill
OpenClaw → SkillExecutor → BrowserSkill, FileSkill
```

Register via `createDefaultSkillPipeline()` in `@jarvis/agents-shared`.

```bash
npm run test --workspace=@jarvis/search-skill
npm run test --workspace=@jarvis/file-skill
npm run test --workspace=@jarvis/browser-skill
npm run test --workspace=@jarvis/agents-shared
```
