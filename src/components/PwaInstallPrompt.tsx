import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const INSTALL_DISMISS_KEY = "socialsaver.pwaInstallDismissed";

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const toastShownRef = useRef(false);

  tRef.current = t;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem(INSTALL_DISMISS_KEY)) return;

    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredRef.current = e;
      if (toastShownRef.current) return;
      toastShownRef.current = true;

      toast(tRef.current("pwa.installTitle"), {
        description: tRef.current("pwa.installDescription"),
        duration: 12000,
        action: {
          label: tRef.current("pwa.install"),
          onClick: () => {
            const prompt = deferredRef.current;
            if (!prompt) return;
            void prompt.prompt();
            void prompt.userChoice.then((choice) => {
              if (choice.outcome === "dismissed") {
                sessionStorage.setItem(INSTALL_DISMISS_KEY, "1");
              }
              deferredRef.current = null;
            });
          },
        },
      });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return null;
}
