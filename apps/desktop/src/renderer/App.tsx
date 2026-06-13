import { AppShell } from "./layout/AppShell";
import { useClientLocaleSync } from "./settings";

/** Root React component (Phase 18). */
export function App() {
  useClientLocaleSync();
  return <AppShell />;
}
