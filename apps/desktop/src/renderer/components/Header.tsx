import type { AppPageId } from "./Sidebar";

const PAGE_TITLES: Record<AppPageId, string> = {
  chat: "Chat",
  tasks: "Tasks",
  memory: "Memory",
  settings: "Settings",
  voice: "Voice",
  plugins: "Plugins",
  runtime: "Runtime",
};

export interface HeaderProps {
  readonly activePage: AppPageId;
  readonly apiUrl?: string;
}

/**
 * Top header bar with page title and API hint (Phase 18).
 */
export function Header({ activePage, apiUrl }: HeaderProps) {
  return (
    <header className="app-header">
      <h1>{PAGE_TITLES[activePage]}</h1>
      {apiUrl ? (
        <span className="app-header-meta" title="API gateway base URL">
          API: {apiUrl}
        </span>
      ) : null}
    </header>
  );
}
