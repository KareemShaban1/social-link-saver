import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/** Marketing home — contact lives at `/contact` (see `src/pages/Contact.tsx`). */

const Landing = () => {
  const { locale } = useTranslation();
  const isArabic = locale === "ar";

  return (
    <div
      className={cn(
        "landing-page min-h-screen scroll-smooth bg-white text-gray-900",
        isArabic && "font-arabic",
      )}
      lang={locale}
    >
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingTrustBar />
        {/* <LandingStats /> */}
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
