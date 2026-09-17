import { Link, useLocation } from "react-router-dom";
import { FolderTree, Home, Star, User } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export const AppBottomNav = () => {
  const { pathname, search } = useLocation();
  const { t } = useTranslation();
  const view = new URLSearchParams(search).get("view");

  const items = [
    {
      to: "/app",
      label: t("nav.home"),
      icon: Home,
      active: pathname === "/app" && view !== "favorites",
    },
    {
      to: "/app?view=favorites",
      label: t("app.favorites"),
      icon: Star,
      active: pathname === "/app" && view === "favorites",
    },
    {
      to: "/app/categories",
      label: t("app.categories"),
      icon: FolderTree,
      active: pathname === "/app/categories",
    },
    {
      to: "/account",
      label: t("nav.profile"),
      icon: User,
      active: pathname === "/account",
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label={t("nav.bottomNav")}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon, active }) => (
          <li key={to}>
            <Link
              to={to}
              className={cn(
                "flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold transition-colors",
                active ? "text-indigo-600" : "text-gray-500 hover:text-indigo-600",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", active && to.includes("favorites") && "fill-current")} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
