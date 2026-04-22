import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// ── Monitoring Sentry (prod uniquement) ───────────────────────────────────────
if (!import.meta.env.DEV && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 0.1,       // 10% des transactions tracées
    replaysOnErrorSampleRate: 1, // replay complet sur chaque erreur
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
  });
}

// Restore dark mode preference before first render
if (localStorage.getItem("oscar_dark_mode") === "true") {
  document.documentElement.classList.add("dark");
}

// Restore text size preference before first render
const savedSize = localStorage.getItem("oscar_text_size");
if (savedSize && savedSize !== "normal") {
  document.documentElement.classList.add(`text-size-${savedSize}`);
  document.documentElement.setAttribute("data-text-size", savedSize);
}

createRoot(document.getElementById("root")!).render(<App />);
