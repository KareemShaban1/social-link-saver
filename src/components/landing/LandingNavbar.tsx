import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinkKeys = [
  { key: "nav.home" as const, href: "#home" },
  { key: "nav.features" as const, href: "#features" },
  { key: "nav.howItWorks" as const, href: "#how-it-works" },
  { key: "nav.pricing" as const, href: "#pricing" },
  { key: "nav.blog" as const, href: "#blog" },
  { key: "nav.contact" as const, href: "#contact" },
];

export const LandingNavbar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("nav.home");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinkKeys.map((link, index) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => setActiveLink(link.key)}
              className={cn(
                "animate-fade-in-down text-sm font-medium opacity-0 transition-colors hover:text-indigo-600",
                activeLink === link.key
                  ? "border-b-2 border-indigo-600 pb-0.5 text-indigo-600"
                  : "text-gray-600",
              )}
              style={{
                animationDelay: `${100 + index * 60}ms`,
                animationFillMode: "forwards",
              }}
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div
          className="hidden animate-fade-in-right items-center gap-3 opacity-0 lg:flex"
          style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
        >
          <LanguageSwitcher compact />
          {user ? (
            <Link to="/app">
              <Button className="rounded-full bg-indigo-600 px-6 transition-transform hover:scale-105 hover:bg-indigo-700">
                {t("nav.openDashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-indigo-600">
                  {t("nav.logIn")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="rounded-full bg-indigo-600 px-6 transition-transform hover:scale-105 hover:bg-indigo-700">
                  {t("nav.signUpFree")}
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            className="animate-fade-in rounded-lg p-2 text-gray-600 opacity-0 hover:bg-gray-100"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("common.closeMenu") : t("common.openMenu")}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-gray-100 bg-white transition-all duration-300 lg:hidden",
          mobileOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-4 py-4">
          <nav className="flex flex-col gap-1">
            {navLinkKeys.map((link, index) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => {
                  setActiveLink(link.key);
                  setMobileOpen(false);
                }}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  activeLink === link.key
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50",
                )}
                style={{ transitionDelay: mobileOpen ? `${index * 50}ms` : "0ms" }}
              >
                {t(link.key)}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
            {user ? (
              <Link to="/app" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700">
                  {t("nav.openDashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full">
                    {t("nav.logIn")}
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700">
                    {t("nav.signUpFree")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
