import { useState } from "react";

import { Header } from "../components/Header";
import { Sidebar, type AppPageId } from "../components/Sidebar";
import { MinimalSidebar, type CommandCenterPageId } from "../command-center";
import { useRuntimeStartup } from "../runtime";
import { ChatPage } from "../pages/ChatPage";
import { MemoryPage } from "../pages/MemoryPage";
import { PluginsPage } from "../pages/PluginsPage";
import { RuntimeDashboardPage } from "../pages/RuntimeDashboardPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TasksPage } from "../pages/TasksPage";
import { VoicePage } from "../pages/VoicePage";

function renderPage(page: AppPageId) {
  switch (page) {
    case "chat":
      return <ChatPage />;
    case "tasks":
      return <TasksPage />;
    case "memory":
      return <MemoryPage />;
    case "settings":
      return <SettingsPage />;
    case "voice":
      return <VoicePage />;
    case "plugins":
      return <PluginsPage />;
    case "runtime":
      return <RuntimeDashboardPage />;
    default:
      return <ChatPage />;
  }
}

/**
 * Application shell — minimal sidebar + command center layout (Phase 89).
 */
export function AppShell() {
  const [page, setPage] = useState<AppPageId>("chat");
  const startup = useRuntimeStartup({ autoSync: true, pollHealthWhenReady: true });
  const apiUrl = startup.apiBaseUrl;

  const minimalPage: CommandCenterPageId =
    page === "memory" ? "memory" : page === "voice" ? "voice" : page === "settings" ? "settings" : "command";

  const handleMinimalNavigate = (next: CommandCenterPageId) => {
    const mapped: AppPageId =
      next === "memory"
        ? "memory"
        : next === "voice"
          ? "voice"
          : next === "settings"
            ? "settings"
            : "chat";
    setPage(mapped);
  };

  return (
    <div
      className="app-shell app-shell--command-center"
      data-runtime-ready={startup.ready ? "true" : "false"}
      data-runtime-phase={startup.status?.phase ?? "idle"}
    >
      <MinimalSidebar activePage={minimalPage} onNavigate={handleMinimalNavigate} />
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="app-main">
        <Header activePage={page} apiUrl={apiUrl} />
        <main className="app-content">{renderPage(page)}</main>
      </div>
    </div>
  );
}
