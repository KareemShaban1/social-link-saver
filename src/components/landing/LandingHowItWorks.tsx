import {
  ArrowRight,
  Bookmark,
  Check,
  FolderOpen,
  LayoutDashboard,
  Link2,
  Settings,
  Star,
  Tags,
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { AnimateIn } from "./AnimateIn";
import { PlatformIcon } from "./PlatformIcons";

export const LandingHowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      title: t("landing.howItWorks.step1Title"),
      description: t("landing.howItWorks.step1Desc"),
      icon: Link2,
      iconBg: "bg-indigo-600 text-white",
    },
    {
      number: 2,
      title: t("landing.howItWorks.step2Title"),
      description: t("landing.howItWorks.step2Desc"),
      icon: FolderOpen,
      iconBg: "bg-sky-500 text-white",
    },
    {
      number: 3,
      title: t("landing.howItWorks.step3Title"),
      description: t("landing.howItWorks.step3Desc"),
      icon: Check,
      iconBg: "bg-emerald-500 text-white",
    },
  ];

  const recentLinks = [
    { name: t("landing.howItWorks.sampleFacebook"), platform: "facebook" as const, time: t("landing.howItWorks.hoursAgo", { count: 2 }) },
    { name: t("landing.howItWorks.sampleInstagram"), platform: "instagram" as const, time: t("landing.howItWorks.hoursAgo", { count: 5 }) },
    { name: t("landing.howItWorks.sampleLinkedin"), platform: "linkedin" as const, time: t("landing.howItWorks.dayAgo") },
    { name: t("landing.howItWorks.sampleTwitter"), platform: "twitter" as const, time: t("landing.howItWorks.daysAgo", { count: 2 }) },
  ];

  const sidebarItems = [
    { icon: LayoutDashboard, label: t("landing.howItWorks.dashboard"), active: true },
    { icon: Link2, label: t("landing.howItWorks.allLinks"), active: false },
    { icon: Tags, label: t("landing.howItWorks.categories"), active: false },
    { icon: Star, label: t("landing.howItWorks.favorites"), active: false },
    { icon: Settings, label: t("landing.howItWorks.settings"), active: false },
  ];

  return (
    <section id="how-it-works" className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-600">
            {t("landing.howItWorks.label")}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
        </AnimateIn>

        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <AnimateIn key={step.number} variant="fade-up" delay={index * 150}>
              <div className="group relative flex flex-col items-center text-center">
                {index < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+2.5rem)] top-8 hidden h-0.5 w-[calc(100%-5rem)] border-t-2 border-dashed border-indigo-200 md:block" />
                )}
                <div
                  className={`relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${step.iconBg}`}
                >
                  <step.icon className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600 shadow">
                    {step.number}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="mt-4 h-5 w-5 animate-pulse text-indigo-300 md:hidden" />
                )}
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* <AnimateIn variant="scale" delay={200}>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-shadow duration-300 hover:shadow-2xl">
            <div className="flex min-h-[380px]">
              <aside className="hidden w-52 shrink-0 border-r border-gray-100 bg-gray-50 p-4 sm:block">
                <div className="mb-6 flex items-center gap-2 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Bookmark className="h-4 w-4" fill="currentColor" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{t("common.brand")}</span>
                </div>
                <nav className="space-y-1">
                  {sidebarItems.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-indigo-600 font-medium text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  ))}
                </nav>
              </aside>

              <div className="flex-1 p-5 sm:p-6">
                <h3 className="mb-5 text-lg font-bold text-gray-900">{t("landing.howItWorks.dashboard")}</h3>

                <div className="mb-6 grid grid-cols-3 gap-3">
                  {[
                    { label: t("landing.howItWorks.totalLinks"), value: "32", color: "text-indigo-600" },
                    { label: t("landing.howItWorks.categories"), value: "6", color: "text-sky-600" },
                    { label: t("landing.howItWorks.favorites"), value: "12", color: "text-amber-500" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center sm:px-4 sm:py-4"
                    >
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-700">{t("landing.howItWorks.recentLinks")}</h4>
                  <div className="space-y-2">
                    {recentLinks.map((link) => (
                      <div
                        key={link.name}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5"
                      >
                        <PlatformIcon platform={link.platform} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{link.name}</p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">{link.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn> */}
      </div>
    </section>
  );
};
