import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { bootstrapPendingShareFromWindow } from "./lib/pendingShare";
import "./index.css";

bootstrapPendingShareFromWindow();

createRoot(document.getElementById("root")!).render(<App />);
