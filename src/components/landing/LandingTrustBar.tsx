import { Cloud, Infinity, Lock, Shield } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { AnimateIn } from "./AnimateIn";

export const LandingTrustBar = () => {
  const { t } = useTranslation();

  const trustItems = [
    { icon: Shield, label: t("landing.trust.securePrivate") },
    { icon: Cloud, label: t("landing.trust.cloudSync") },
    { icon: Lock, label: t("landing.trust.secure100") },
    { icon: Infinity, label: t("landing.trust.unlimitedLinks") },
  ];

  return (
    <section className="border-y border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AnimateIn variant="fade">
          <p className="mb-8 text-center text-sm text-gray-500">{t("landing.trust.tagline")}</p>
        </AnimateIn>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {trustItems.map(({ icon: Icon, label }, index) => (
            <AnimateIn key={label} variant="scale" delay={index * 100}>
              <div className="group flex flex-col items-center gap-2.5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
};
