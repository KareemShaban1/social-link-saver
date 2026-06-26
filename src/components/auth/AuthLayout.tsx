import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Check } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  promoTitle: string;
  promoHighlight: string;
}

export const AuthLayout = ({
  children,
  title,
  subtitle,
  promoTitle,
  promoHighlight,
}: AuthLayoutProps) => {
  const { t } = useTranslation();

  const highlights = [
    t("landing.hero.check1"),
    t("landing.hero.check2"),
    t("landing.hero.check3"),
  ];

  return (
    <div className="landing-page min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex animate-fade-in-left items-center gap-2 opacity-0"
            style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-transform hover:scale-105">
              <Bookmark className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="text-lg font-bold text-gray-900">{t("common.brand")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link
              to="/"
              className="animate-fade-in-right text-sm font-medium text-gray-600 opacity-0 transition-colors hover:text-indigo-600"
              style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
            >
              {t("common.backToHome")}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gray-50 px-10 py-16 lg:flex lg:flex-col lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(79,70,229,0.08),transparent)]" />

          <div
            className="relative animate-fade-in-up opacity-0"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-600">
              {t("common.brand")}
            </p>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 xl:text-4xl">
              {promoTitle}{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                {promoHighlight}
              </span>
            </h1>
            <p className="mb-8 max-w-md text-base leading-relaxed text-gray-500">{t("auth.promoDesc")}</p>
            <ul className="space-y-3">
              {highlights.map((item, index) => (
                <li
                  key={item}
                  className="flex animate-fade-in-left items-center gap-3 opacity-0"
                  style={{
                    animationDelay: `${400 + index * 120}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
          <div
            className="relative w-full max-w-md animate-fade-in-up opacity-0"
            style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
          >
            <div className="mb-8 text-center lg:text-start">
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{title}</h2>
              <p className="mt-2 text-sm text-gray-500 sm:text-base">{subtitle}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
