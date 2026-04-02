import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
