# app/

FastAPI application package for the API gateway.

| Folder | Role |
|--------|------|
| `routes/` | HTTP routers (handlers in Phase 4) |
| `controllers/` | Controller protocols |
| `schemas/` | Pydantic request/response models |
| `middleware/` | Cross-cutting HTTP middleware |
| `validators/` | Extra validation beyond Pydantic |
| `error_handling/` | Exception → `ApiErrorResponse` |

**Phase 3:** No endpoint implementations.
