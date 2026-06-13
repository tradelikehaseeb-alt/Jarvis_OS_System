import "./polyfills";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./index.css";
import "./styles/app.css";
import "./styles/runtime-dashboard.css";
import "./styles/command-center.css";
import "./styles/voice-native.css";
import "./styles/polish.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
