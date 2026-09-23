import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslation } from "@/contexts/LanguageContext";

function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
	return "https://social-link-saver.digitaura.net";
}

interface SaveFromAppsSheetProps {
  className?: string;
}

export function SaveFromAppsSheet({ className }: SaveFromAppsSheetProps) {
  const { t } = useTranslation();
  const shortcutBase = `${getAppOrigin()}/app?add=1&url=`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className ?? "rounded-full"}>
          <Share2 className="me-2 h-4 w-4" />
          {t("shareFromApps.button")}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-start">
          <SheetTitle>{t("shareFromApps.title")}</SheetTitle>
          <SheetDescription>{t("shareFromApps.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-4">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">{t("shareFromApps.androidTitle")}</h3>
            <ol className="list-decimal space-y-1.5 ps-5 text-sm text-gray-600">
              <li>{t("shareFromApps.androidStep1")}</li>
              <li>{t("shareFromApps.androidStep2")}</li>
              <li>{t("shareFromApps.androidStep3")}</li>
            </ol>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
              <h4 className="text-sm font-semibold text-indigo-900">{t("shareFromApps.androidPinTitle")}</h4>
              <p className="mt-1 text-xs text-indigo-800/90">{t("shareFromApps.androidPinIntro")}</p>
              <ol className="mt-2 list-decimal space-y-1 ps-4 text-xs text-indigo-900/90">
                <li>{t("shareFromApps.androidPinStep1")}</li>
                <li>{t("shareFromApps.androidPinStep2")}</li>
                <li>{t("shareFromApps.androidPinStep3")}</li>
              </ol>
              <p className="mt-2 text-xs text-indigo-800/80">{t("shareFromApps.androidPinNote")}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">{t("shareFromApps.iosTitle")}</h3>
            <ol className="list-decimal space-y-1.5 ps-5 text-sm text-gray-600">
              <li>{t("shareFromApps.iosStep1")}</li>
              <li>{t("shareFromApps.iosStep2")}</li>
              <li>{t("shareFromApps.iosStep3")}</li>
              <li>{t("shareFromApps.iosStep4")}</li>
            </ol>
            <p className="text-xs text-gray-500">{t("shareFromApps.iosHomeScreen")}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium text-gray-700">{t("shareFromApps.shortcutUrlLabel")}</p>
              <code className="block break-all text-xs text-indigo-700">{shortcutBase}</code>
              <p className="mt-2 text-xs text-gray-500">{t("shareFromApps.shortcutUrlHint")}</p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
