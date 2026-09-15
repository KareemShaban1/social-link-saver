import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { bootstrapPendingShareFromWindow, registerShareLaunchQueueNavigation } from "./lib/pendingShare";
import "./index.css";

bootstrapPendingShareFromWindow();
registerShareLaunchQueueNavigation();

createRoot(document.getElementById("root")!).render(<App />);
