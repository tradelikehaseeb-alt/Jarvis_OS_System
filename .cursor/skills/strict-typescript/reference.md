# Strict TypeScript — Reference

## Recommended tsconfig flags

When authoring or reviewing, expect these (or document why omitted):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true
  }
}
```

## Types — examples

**Prefer narrowing over assertion:**

```typescript
function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function useId(raw: string): void {
  const id = parseId(raw);
  if (id == null) return;
  // id is number
}
```

**Discriminated union:**

```typescript
type TaskResult =
  | { status: 'ok'; data: TaskPayload }
  | { status: 'error'; code: string; message: string };
```

## Interfaces — examples

**Extend instead of duplicate:**

```typescript
interface BaseEntity {
  readonly id: string;
  readonly createdAt: string;
}

interface Task extends BaseEntity {
  title: string;
  status: TaskStatus;
}
```

**API boundary:**

```typescript
/** Request body for POST /tasks */
export interface CreateTaskRequest {
  title: string;
  priority?: TaskPriority;
}
```

## Null safety — examples

```typescript
// Optional chaining + default
const name = user.profile?.displayName ?? 'Anonymous';

// Explicit nullable field
interface ApiError {
  message: string;
  field: string | null;
}
```

## Comments — examples

```typescript
/**
 * Routes a user message through the orchestrator.
 * UI must call API only — never OpenClaw directly.
 */
export async function submitMessage(
  sessionId: string,
  text: string,
): Promise<SubmitMessageResponse> {
  // ...
}
```

## Clean imports — examples

```typescript
import { z } from 'zod';

import type { Task } from '@/types/task';
import { taskSchema } from '@/types/task';

import { formatTaskTitle } from './format';
```

## Reusable models — examples

**Single source of truth with Zod:**

```typescript
import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['pending', 'running', 'done']),
});

export type Task = z.infer<typeof taskSchema>;
```

**Layer mapping (DTO ≠ domain when shapes differ):**

```typescript
export interface TaskDto {
  id: string;
  title: string;
}

export function toTask(dto: TaskDto): Task {
  return { ...dto, status: 'pending' };
}
```

## Search patterns

Adapt paths to the repo:

- `\bany\b` in `.ts` / `.tsx`
- `@ts-ignore|@ts-expect-error`
- ` as [A-Z]` (broad; confirm manually)
- `!\.` or `!\)` (non-null assertions)
- Duplicate `interface.*Task` / `type.*Task` across folders
