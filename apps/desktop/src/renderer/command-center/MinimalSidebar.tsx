export type CommandCenterPageId =
  | "command"
  | "memory"
  | "settings"
  | "voice";

export interface MinimalSidebarNavItem {
  readonly id: CommandCenterPageId;
  readonly label: string;
  readonly icon?: string;
}

export const MINIMAL_NAV_ITEMS: readonly MinimalSidebarNavItem[] = [
  { id: "command", label: "Command", icon: "◉" },
  { id: "memory", label: "Memory", icon: "◇" },
  { id: "voice", label: "Voice", icon: "◎" },
  { id: "settings", label: "Settings", icon: "⚙" },
] as const;

export interface MinimalSidebarProps {
  readonly activePage: CommandCenterPageId;
  readonly onNavigate: (page: CommandCenterPageId) => void;
}

/**
 * Minimal futuristic navigation rail (Phase 89).
 */
export function MinimalSidebar({ activePage, onNavigate }: MinimalSidebarProps) {
  return (
    <aside className="minimal-sidebar" aria-label="Jarvis navigation" data-testid="minimal-sidebar">
      <div className="minimal-sidebar__brand">
        <span className="minimal-sidebar__orb" aria-hidden />
        <span className="minimal-sidebar__title">Jarvis</span>
      </div>
      <nav className="minimal-sidebar__nav">
        {MINIMAL_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`minimal-sidebar__link${activePage === item.id ? " minimal-sidebar__link--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
            data-testid={`minimal-nav-${item.id}`}
          >
            {item.icon ? <span aria-hidden>{item.icon}</span> : null}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
