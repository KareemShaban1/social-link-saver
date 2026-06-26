import { Link } from "react-router-dom";
import { Check, Play, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./PlatformIcons";

const mockLinks = [
  { nameKey: "platforms.facebook" as const, url: "facebook.com/username", platform: "facebook" as const, color: "text-[#1877F2]" },
  { nameKey: "platforms.instagram" as const, url: "instagram.com/username", platform: "instagram" as const, color: "text-pink-500" },
  { nameKey: "platforms.linkedin" as const, url: "linkedin.com/in/username", platform: "linkedin" as const, color: "text-[#0A66C2]" },
  { nameKey: "platforms.twitter" as const, url: "x.com/username", platform: "twitter" as const, color: "text-gray-900" },
  { nameKey: "platforms.tiktok" as const, url: "tiktok.com/@username", platform: "tiktok" as const, color: "text-gray-900" },
];

const floatingPlatforms = [
  { platform: "twitter" as const, className: "left-[8%] top-[18%]", delay: "0s", duration: "4s" },
  { platform: "instagram" as const, className: "left-[2%] top-[48%]", delay: "0.5s", duration: "5s" },
  { platform: "facebook" as const, className: "left-[12%] bottom-[12%]", delay: "1s", duration: "4.5s" },
  { platform: "tiktok" as const, className: "right-[8%] top-[22%]", delay: "0.3s", duration: "5.5s" },
  { platform: "youtube" as const, className: "right-[4%] top-[52%]", delay: "0.8s", duration: "4s" },
  { platform: "linkedin" as const, className: "right-[14%] bottom-[10%]", delay: "1.2s", duration: "5s" },
];

export const LandingHero = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const checklist = [
    t("landing.hero.check1"),
    t("landing.hero.check2"),
    t("landing.hero.check3"),
  ];

  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(79,70,229,0.06),transparent)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
        <div className="space-y-8">
          <h1
            className="animate-fade-in-up text-4xl font-extrabold leading-tight tracking-tight text-gray-900 opacity-0 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            {t("landing.hero.headlineSave")}{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
              {t("landing.hero.headlineAccess")}
            </span>
          </h1>
          <p
            className="max-w-lg animate-fade-in-up text-lg leading-relaxed text-gray-500 opacity-0"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            {t("landing.hero.subtitle")}
          </p>

          <ul className="space-y-3">
            {checklist.map((item, index) => (
              <li
                key={item}
                className="flex animate-fade-in-left items-center gap-3 text-gray-700 opacity-0"
                style={{
                  animationDelay: `${400 + index * 120}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium sm:text-base">{item}</span>
              </li>
            ))}
          </ul>

          <div
            className="flex animate-fade-in-up flex-col gap-3 opacity-0 sm:flex-row sm:items-center"
            style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
          >
            <Link to={user ? "/app" : "/signup"}>
              <Button
                size="lg"
                className="h-12 w-full rounded-full bg-indigo-600 px-8 text-base transition-transform hover:scale-105 hover:bg-indigo-700 active:scale-95 sm:w-auto"
              >
                {user ? t("nav.goToDashboard") : t("landing.hero.getStarted")}
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-gray-200 px-8 text-base text-gray-700 hover:bg-gray-50 active:scale-95 sm:w-auto"
            >
              <Play className="h-4 w-4 fill-indigo-600 text-indigo-600" />
              {t("landing.hero.viewDemo")}
            </Button>
          </div>
        </div>

        <div
          className="relative mx-auto w-full max-w-md animate-fade-in-right opacity-0 lg:max-w-none"
          style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
        >
          {floatingPlatforms.map(({ platform, className, delay, duration }) => (
            <div
              key={platform}
              className={cn("absolute z-10 animate-float motion-reduce:animate-none", className)}
              style={{ animationDelay: delay, animationDuration: duration }}
            >
              <PlatformIcon platform={platform} size="lg" />
            </div>
          ))}

          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-dashed border-indigo-200/60 motion-reduce:animate-none" />

          <div className="relative z-20 mx-auto max-w-sm animate-float-slow rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-indigo-100/50 motion-reduce:animate-none">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">{t("landing.hero.myLinks")}</h3>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3 w-3" />
                {t("landing.hero.addNew")}
              </button>
            </div>
            <div className="space-y-2.5">
              {mockLinks.map((link, index) => (
                <div
                  key={link.nameKey}
                  className="flex animate-fade-in-up items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 opacity-0"
                  style={{
                    animationDelay: `${700 + index * 100}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <PlatformIcon platform={link.platform} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${link.color}`}>{t(link.nameKey)}</p>
                    <p className="truncate text-xs text-gray-400">{link.url}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
