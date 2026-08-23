import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

/** Check often so mobile/desktop pick up deploys without waiting half an hour. */
const UPDATE_CHECK_MS = 60 * 1000;

export function PwaUpdatePrompt() {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const toastShownRef = useRef(false);

  tRef.current = t;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let intervalId: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;
    let reloadTimer: number | undefined;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Auto-apply: toast alone is easy to miss on mobile / installed PWA.
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast(tRef.current("pwa.updateTitle"), {
            description: tRef.current("pwa.updateDescription"),
            duration: 4000,
            action: {
              label: tRef.current("pwa.reload"),
              onClick: () => {
                void updateSW(true);
              },
            },
          });
        }

        if (reloadTimer === undefined) {
          reloadTimer = window.setTimeout(() => {
            void updateSW(true);
          }, 1500);
        }
      },
      onRegisteredSW(_swUrl, reg) {
        registration = reg ?? undefined;
        if (!registration) return;

        void registration.update();

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
      if (reloadTimer !== undefined) {
        window.clearTimeout(reloadTimer);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
