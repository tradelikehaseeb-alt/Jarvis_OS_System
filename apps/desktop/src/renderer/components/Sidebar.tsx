export type AppPageId =
  | "chat"
  | "tasks"
  | "memory"
  | "settings"
  | "voice"
  | "plugins";

export interface NavItem {
  readonly id: AppPageId;
  readonly label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "chat", label: "Chat" },
  { id: "tasks", label: "Tasks" },
  { id: "memory", label: "Memory" },
  { id: "voice", label: "Voice" },
  { id: "plugins", label: "Plugins" },
  { id: "settings", label: "Settings" },
] as const;

export interface SidebarProps {
  readonly activePage: AppPageId;
  readonly onNavigate: (page: AppPageId) => void;
}

/**
 * Primary navigation sidebar (Phase 18).
 */
export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">Jarvis OS</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link${activePage === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
