import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Activity,
  Bookmark,
  FolderTree,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useInView } from "@/hooks/use-in-view";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimateIn } from "./AnimateIn";

type PublicStats = {
  totalUsers: number;
  totalLinks: number;
  totalCategories: number;
  totalPlatforms: number;
  linksLast24Hours: number;
};

const EMPTY_STATS: PublicStats = {
  totalUsers: 0,
  totalLinks: 0,
  totalCategories: 0,
  totalPlatforms: 0,
  linksLast24Hours: 0,
};

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target === 0) {
      setValue(0);
      return;
    }

    let start: number | null = null;
    let raf = 0;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

function formatStat(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { notation: value >= 10000 ? "compact" : "standard" }).format(
    value,
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: ElementType;
  animate: boolean;
  locale: string;
  className?: string;
  accent?: "indigo" | "sky" | "emerald" | "amber" | "violet";
  featured?: boolean;
  live?: boolean;
  liveLabel?: string;
}

const accentStyles = {
  indigo: {
    ring: "ring-indigo-400/30",
    icon: "bg-indigo-500/20 text-indigo-300",
    glow: "from-indigo-500/20",
    value: "from-white to-indigo-200",
  },
  sky: {
    ring: "ring-sky-400/30",
    icon: "bg-sky-500/20 text-sky-300",
    glow: "from-sky-500/20",
    value: "from-white to-sky-200",
  },
  emerald: {
    ring: "ring-emerald-400/30",
    icon: "bg-emerald-500/20 text-emerald-300",
    glow: "from-emerald-500/20",
    value: "from-white to-emerald-200",
  },
  amber: {
    ring: "ring-amber-400/30",
    icon: "bg-amber-500/20 text-amber-300",
    glow: "from-amber-500/20",
    value: "from-white to-amber-200",
  },
  violet: {
    ring: "ring-violet-400/30",
    icon: "bg-violet-500/20 text-violet-300",
    glow: "from-violet-500/20",
    value: "from-white to-violet-200",
  },
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  animate,
  locale,
  className,
  accent = "indigo",
  featured = false,
  live = false,
  liveLabel,
}: StatCardProps) => {
  const display = useCountUp(value, animate);
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:bg-white/[0.07] sm:p-6",
        featured && "p-6 sm:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          styles.glow,
        )}
      />
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset transition-transform duration-500 group-hover:scale-110",
              styles.icon,
              styles.ring,
              featured ? "h-14 w-14" : "h-11 w-11",
            )}
          >
            <Icon className={featured ? "h-7 w-7" : "h-5 w-5"} />
          </div>
          {live && liveLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {liveLabel}
            </span>
          )}
        </div>
        <div>
          <p
            className={cn(
              "bg-gradient-to-br bg-clip-text font-extrabold tracking-tight text-transparent",
              styles.value,
              featured ? "text-5xl sm:text-6xl lg:text-7xl" : "text-3xl sm:text-4xl",
            )}
          >
            {formatStat(display, locale)}
          </p>
          <p className={cn("mt-1 font-medium text-white/60", featured ? "text-base sm:text-lg" : "text-sm")}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};

export const LandingStats = () => {
  const { t, locale } = useTranslation();
  const { ref, isInView } = useInView({ once: true, threshold: 0.15 });
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await api.getPublicStats();
        if (!cancelled) setStats(data.stats);
      } catch {
        if (!cancelled) setStats(EMPTY_STATS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = stats ?? EMPTY_STATS;
  const hasAnyData = useMemo(
    () => Object.values(resolved).some((n) => n > 0),
    [resolved],
  );

  return (
    <section id="stats" className="relative overflow-hidden bg-gray-950 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.stats.label")}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("landing.stats.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
            {t("landing.stats.subtitle")}
          </p>
        </AnimateIn>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:gap-5">
            <Skeleton className="col-span-2 h-48 rounded-3xl bg-white/5 lg:col-span-5 lg:row-span-2 lg:h-auto lg:min-h-[280px]" />
            <Skeleton className="h-36 rounded-3xl bg-white/5 lg:col-span-3 lg:h-auto lg:min-h-[130px]" />
            <Skeleton className="h-36 rounded-3xl bg-white/5 lg:col-span-4 lg:h-auto lg:min-h-[130px]" />
            <Skeleton className="h-36 rounded-3xl bg-white/5 lg:col-span-4 lg:h-auto lg:min-h-[130px]" />
            <Skeleton className="col-span-2 h-36 rounded-3xl bg-white/5 lg:col-span-8 lg:h-auto lg:min-h-[130px]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
            <AnimateIn variant="scale" delay={0} className="col-span-2 lg:col-span-5 lg:row-span-2">
              <StatCard
                label={t("landing.stats.totalLinks")}
                value={resolved.totalLinks}
                icon={Bookmark}
                animate={isInView}
                locale={locale}
                accent="indigo"
                featured
                className="h-full min-h-[200px] lg:min-h-full"
              />
            </AnimateIn>

            <AnimateIn variant="fade-up" delay={100} className="lg:col-span-3">
              <StatCard
                label={t("landing.stats.totalUsers")}
                value={resolved.totalUsers}
                icon={Users}
                animate={isInView}
                locale={locale}
                accent="sky"
                className="h-full"
              />
            </AnimateIn>

            <AnimateIn variant="fade-up" delay={180} className="lg:col-span-4">
              <StatCard
                label={t("landing.stats.totalCategories")}
                value={resolved.totalCategories}
                icon={FolderTree}
                animate={isInView}
                locale={locale}
                accent="emerald"
                className="h-full"
              />
            </AnimateIn>

            <AnimateIn variant="fade-up" delay={260} className="lg:col-span-4">
              <StatCard
                label={t("landing.stats.totalPlatforms")}
                value={resolved.totalPlatforms}
                icon={Layers}
                animate={isInView}
                locale={locale}
                accent="violet"
                className="h-full"
              />
            </AnimateIn>

            <AnimateIn variant="fade-up" delay={340} className="col-span-2 lg:col-span-8">
              <StatCard
                label={t("landing.stats.linksLast24Hours")}
                value={resolved.linksLast24Hours}
                icon={Activity}
                animate={isInView}
                locale={locale}
                accent="amber"
                live={resolved.linksLast24Hours > 0}
                liveLabel={t("landing.stats.live")}
                className="h-full"
              />
            </AnimateIn>
          </div>
        )}

        {!loading && hasAnyData && (
          <AnimateIn variant="fade" delay={450}>
            <p className="mt-8 text-center text-xs text-white/35">
              {t("landing.stats.footer")}
            </p>
          </AnimateIn>
        )}
      </div>
    </section>
  );
};
