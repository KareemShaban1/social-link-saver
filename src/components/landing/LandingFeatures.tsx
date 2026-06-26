import { Bookmark, FolderOpen, Search, Smartphone, Star } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { AnimateIn } from "./AnimateIn";

export const LandingFeatures = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Bookmark,
      title: t("landing.features.saveTitle"),
      description: t("landing.features.saveDesc"),
      iconBg: "bg-indigo-100 text-indigo-600",
    },
    {
      icon: FolderOpen,
      title: t("landing.features.organizeTitle"),
      description: t("landing.features.organizeDesc"),
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      icon: Search,
      title: t("landing.features.searchTitle"),
      description: t("landing.features.searchDesc"),
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: Star,
      title: t("landing.features.favoritesTitle"),
      description: t("landing.features.favoritesDesc"),
      iconBg: "bg-amber-100 text-amber-600",
    },
    {
      icon: Smartphone,
      title: t("landing.features.accessTitle"),
      description: t("landing.features.accessDesc"),
      iconBg: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-600">
            {t("landing.features.label")}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {t("landing.features.title")}
          </h2>
        </AnimateIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map(({ icon: Icon, title, description, iconBg }, index) => (
            <AnimateIn key={title} variant="fade-up" delay={index * 100}>
              <div className="group h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg">
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{description}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
};
