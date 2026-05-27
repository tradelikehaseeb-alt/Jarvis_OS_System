import { useState } from "react";

import { Header } from "../components/Header";
import { Sidebar, type AppPageId } from "../components/Sidebar";
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
 * Application shell — sidebar, header, page content (Phase 18).
 */
export function AppShell() {
  const [page, setPage] = useState<AppPageId>("chat");
  const startup = useRuntimeStartup({ autoSync: true, pollHealthWhenReady: true });
  const apiUrl = startup.apiBaseUrl;

  return (
    <div
      className="app-shell"
      data-runtime-ready={startup.ready ? "true" : "false"}
      data-runtime-phase={startup.status?.phase ?? "idle"}
    >
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="app-main">
        <Header activePage={page} apiUrl={apiUrl} />
        <main className="app-content">{renderPage(page)}</main>
      </div>
    </div>
  );
}
