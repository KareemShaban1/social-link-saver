import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => (
  <div className="landing-page min-h-screen scroll-smooth bg-white text-gray-900">
    <LandingNavbar />
    <main>
      <LandingHero />
      <LandingTrustBar />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCTA />
    </main>
    <LandingFooter />
  </div>
);

export default Landing;
