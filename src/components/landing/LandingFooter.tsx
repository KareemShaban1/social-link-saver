import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimateIn } from "./AnimateIn";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "./PlatformIcons";
import type { TranslationKey } from "@/i18n";

const footerSections: {
  titleKey: TranslationKey;
  linkKeys: TranslationKey[];
  id?: string;
}[] = [
  {
    titleKey: "landing.footer.product",
    linkKeys: [
      "landing.footer.features",
      "landing.footer.pricing",
      "landing.footer.integrations",
      "landing.footer.changelog",
    ],
  },
  {
    titleKey: "landing.footer.company",
    linkKeys: [
      "landing.footer.aboutUs",
      "landing.footer.blog",
      "landing.footer.careers",
      "landing.footer.press",
    ],
    id: "blog",
  },
  {
    titleKey: "landing.footer.support",
    linkKeys: [
      "landing.footer.helpCenter",
      "landing.footer.contact",
      "landing.footer.privacyPolicy",
      "landing.footer.termsOfService",
    ],
  },
];

export const LandingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer id="contact" className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <AnimateIn variant="fade-up" className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition-transform hover:scale-105">
                <Bookmark className="h-5 w-5" fill="currentColor" />
              </div>
              <span className="text-lg font-bold text-gray-900">{t("common.brand")}</span>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-gray-500">{t("landing.footer.tagline")}</p>
            <div className="flex gap-3">
              {[
                { Icon: FacebookIcon, label: "Facebook" },
                { Icon: InstagramIcon, label: "Instagram" },
                { Icon: LinkedInIcon, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:scale-110 hover:bg-indigo-100 hover:text-indigo-600"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </AnimateIn>

          {footerSections.map(({ titleKey, linkKeys, id }, colIndex) => (
            <AnimateIn key={titleKey} variant="fade-up" delay={100 + colIndex * 80}>
              <div id={id}>
                <h4 className="mb-4 text-sm font-bold text-gray-900">{t(titleKey)}</h4>
                <ul className="space-y-2.5">
                  {linkKeys.map((linkKey) => (
                    <li key={linkKey}>
                      <a
                        href={linkKey === "landing.footer.blog" ? "#blog" : "#"}
                        className="text-sm text-gray-500 transition-colors hover:translate-x-0.5 hover:text-indigo-600"
                      >
                        {t(linkKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          ))}

          <AnimateIn variant="fade-up" delay={340}>
            <div id="pricing">
              <h4 className="mb-4 text-sm font-bold text-gray-900">{t("landing.footer.stayInLoop")}</h4>
              <p className="mb-3 text-sm text-gray-500">{t("landing.footer.newsletterDesc")}</p>
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <Input
                  type="email"
                  placeholder={t("landing.footer.emailPlaceholder")}
                  className="rounded-full border-gray-200 bg-gray-50 transition-shadow focus:shadow-md"
                />
                <Button type="submit" className="rounded-full bg-indigo-600 transition-transform hover:scale-105 hover:bg-indigo-700 active:scale-95">
                  {t("common.subscribe")}
                </Button>
              </form>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn variant="fade" delay={200}>
          <div className="mt-12 border-t border-gray-100 pt-8 text-center">
            <p className="text-sm text-gray-400">
              {t("common.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </AnimateIn>
      </div>
    </footer>
  );
};
