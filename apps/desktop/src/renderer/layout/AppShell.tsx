import { useEffect, useState } from "react";

import { getApiUrl } from "../api/jarvis-client";
import { Header } from "../components/Header";
import { Sidebar, type AppPageId } from "../components/Sidebar";
import { ChatPage } from "../pages/ChatPage";
import { MemoryPage } from "../pages/MemoryPage";
import { PluginsPage } from "../pages/PluginsPage";
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
    default:
      return <ChatPage />;
  }
}

/**
 * Application shell — sidebar, header, page content (Phase 18).
 */
export function AppShell() {
  const [page, setPage] = useState<AppPageId>("chat");
  const [apiUrl, setApiUrl] = useState<string | undefined>();

  useEffect(() => {
    void getApiUrl()
      .then(setApiUrl)
      .catch(() => setApiUrl(undefined));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="app-main">
        <Header activePage={page} apiUrl={apiUrl} />
        <main className="app-content">{renderPage(page)}</main>
      </div>
    </div>
  );
}
