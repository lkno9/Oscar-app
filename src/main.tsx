import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore dark mode preference before first render
if (localStorage.getItem("oscar_dark_mode") === "true") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
