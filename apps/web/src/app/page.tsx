import type { HealthStatus } from "@jarvis/types";

/**
 * Phase 0 placeholder — no business logic.
 * Phase 2: connect to services/api-gateway only.
 */
export default function HomePage() {
  const _status: HealthStatus = "ok";
  void _status;
  return (
    <main>
      <h1>Jarvis OS</h1>
      <p>Phase 0 scaffold — web UI</p>
    </main>
  );
}
