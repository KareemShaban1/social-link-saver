/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface LaunchParams {
  targetURL?: string;
}

interface LaunchQueue {
  setConsumer(callback: (launchParams: LaunchParams) => void): void;
}

interface Window {
  launchQueue?: LaunchQueue;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
