import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker only in production to avoid automatic refresh loops during navigation
if (import.meta.env.PROD) {
  registerSW({ immediate: false });
}

createRoot(document.getElementById("root")!).render(<App />);
