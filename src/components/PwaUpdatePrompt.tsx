import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const UPDATE_CHECK_MS = 30 * 60 * 1000;

export function PwaUpdatePrompt() {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const toastShownRef = useRef(false);

  tRef.current = t;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let intervalId: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (toastShownRef.current) return;
        toastShownRef.current = true;

        toast(tRef.current("pwa.updateTitle"), {
          description: tRef.current("pwa.updateDescription"),
          duration: Infinity,
          action: {
            label: tRef.current("pwa.reload"),
            onClick: () => {
              void updateSW(true);
            },
          },
        });
      },
      onRegisteredSW(_swUrl, reg) {
        registration = reg ?? undefined;
        if (!registration) return;

        intervalId = window.setInterval(() => {
          void registration?.update();
        }, UPDATE_CHECK_MS);
      },
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void registration?.update();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
