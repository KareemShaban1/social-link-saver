import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { AnimateIn } from "./AnimateIn";

export const LandingCTA = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn variant="scale">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-12 sm:px-12 sm:py-14">
            <div className="absolute -right-10 -top-10 h-40 w-40 animate-pulse-soft rounded-full bg-white/10 motion-reduce:animate-none" />
            <div
              className="absolute -bottom-8 -left-8 h-32 w-32 animate-pulse-soft rounded-full bg-white/10 motion-reduce:animate-none"
              style={{ animationDelay: "1s" }}
            />
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent motion-reduce:animate-none" />

            <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
              <div className="hidden shrink-0 lg:block">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Bookmark className="h-10 w-10" fill="currentColor" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{t("landing.cta.title")}</h2>
                <p className="mt-2 text-base text-indigo-100">{t("landing.cta.subtitle")}</p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2">
                <Link to={user ? "/app" : "/signup"}>
                  <Button
                    size="lg"
                    className="h-12 rounded-full bg-white px-8 text-base font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    {user ? t("nav.goToDashboard") : t("nav.signUpFree")}
                  </Button>
                </Link>
                <p className="text-xs text-indigo-200">{t("common.noCreditCard")}</p>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
};
