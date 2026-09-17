import { Link, useLocation } from "react-router-dom";
import { Bookmark, FolderTree, LayoutDashboard, User } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { labelKey: "nav.dashboard" as const, href: "/app", icon: LayoutDashboard },
  { labelKey: "nav.categories" as const, href: "/app/categories", icon: FolderTree },
  { labelKey: "nav.account" as const, href: "/account", icon: User },
];

export const AppNavbar = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105">
            <Bookmark className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="text-lg font-bold text-gray-900">{t("common.brand")}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ labelKey, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} to={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 rounded-full text-muted-foreground hover:text-primary",
                    active && "bg-accent text-primary hover:bg-accent hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(labelKey)}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link to="/" className="hidden md:block">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-primary">
              {t("common.home")}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
