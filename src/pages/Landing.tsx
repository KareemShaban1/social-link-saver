import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Download, FolderTree, Layers3, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

interface WorkspaceStats {
  totalLinks: number;
  totalCategories: number;
  totalPlatforms: number;
}

interface PublicStats {
  totalUsers: number;
  totalLinks: number;
  totalCategories: number;
  totalPlatforms: number;
  linksLast24Hours: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const Landing = () => {
  const { user } = useAuth();
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats>({
    totalLinks: 0,
    totalCategories: 0,
    totalPlatforms: 0,
  });
  const [publicStats, setPublicStats] = useState<PublicStats>({
    totalUsers: 0,
    totalLinks: 0,
    totalCategories: 0,
    totalPlatforms: 0,
    linksLast24Hours: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [publicResponse, workspaceResponse] = await Promise.all([
        api.getPublicStats(),
        user ? Promise.all([api.getLinks(), api.getCategories()]) : Promise.resolve(null),
      ]);

      setPublicStats(publicResponse.stats);
      setLastUpdated(publicResponse.generatedAt);

      if (workspaceResponse) {
        const [{ links }, { categories }] = workspaceResponse;
        setWorkspaceStats({
          totalLinks: links.length,
          totalCategories: categories.length,
          totalPlatforms: new Set(links.map((link) => link.platform)).size,
        });
      } else {
        setWorkspaceStats({
          totalLinks: 0,
          totalCategories: 0,
          totalPlatforms: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load landing stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
    const intervalId = window.setInterval(fetchStats, 30000);
    return () => window.clearInterval(intervalId);
  }, [fetchStats]);

  useEffect(() => {
    const inStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(inStandaloneMode);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const heroSubtitle = useMemo(() => {
    if (user) {
      return "Your links, categories, and platforms update live as you organize.";
    }
    return "Capture, organize, and instantly find social links with a clean professional workflow.";
  }, [user]);

  const topStats = user ? workspaceStats : publicStats;
  const subtitleLine = user
    ? "Live from your account"
    : `Live across ${publicStats.totalUsers} registered user${publicStats.totalUsers === 1 ? "" : "s"}`;

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:justify-start sm:gap-2">
            <Link to="/" className="flex min-w-0 items-center gap-2 touch-manipulation">
              <img src="/pwa-192x192.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg sm:h-7 sm:w-7" />
              <span className="truncate text-base font-semibold sm:text-lg">LinkSaver</span>
            </Link>
            <div className="shrink-0 sm:hidden">
              <ModeToggle />
            </div>
          </div>
          {/* <div className="flex flex-wrap items-center justify-end gap-2 sm:min-w-0 sm:flex-nowrap sm:gap-2">
            {!isInstalled && deferredPrompt && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10 touch-manipulation gap-1.5 px-3 sm:min-h-9"
                onClick={handleInstallApp}
                disabled={installing}
                aria-label={installing ? "Installing application" : "Install application"}
              >
                <Download className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{installing ? "Installing…" : "Install app"}</span>
                <span className="sm:hidden">{installing ? "…" : "Install"}</span>
              </Button>
            )}
            {user ? (
              <>
                <Link to="/app" className="min-w-0 shrink-0">
                  <Button type="button" size="sm" className="min-h-10 w-full min-w-[8.5rem] touch-manipulation sm:min-h-9 sm:w-auto">
                    <span className="hidden sm:inline">Open Dashboard</span>
                    <span className="sm:hidden">Dashboard</span>
                  </Button>
                </Link>
                <Link to="/account" className="shrink-0">
                  <Button type="button" size="sm" variant="outline" className="min-h-10 touch-manipulation sm:min-h-9">
                    Account
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="shrink-0">
                  <Button type="button" size="sm" variant="ghost" className="min-h-10 touch-manipulation sm:min-h-9">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" className="min-w-0 shrink-0">
                  <Button type="button" size="sm" className="min-h-10 touch-manipulation sm:min-h-9">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <div className="hidden sm:block">
              <ModeToggle />
            </div>
          </div> */}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b bg-[radial-gradient(900px_circle_at_20%_15%,hsl(var(--primary)/0.22),transparent_55%),radial-gradient(800px_circle_at_90%_20%,hsl(var(--accent)/0.16),transparent_48%)] md:bg-[radial-gradient(1200px_circle_at_20%_20%,hsl(var(--primary)/0.20),transparent_55%),radial-gradient(1000px_circle_at_85%_25%,hsl(var(--accent)/0.18),transparent_50%)]">
          <div className="container mx-auto px-4 py-12 sm:py-16 md:py-28">
            <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border bg-background/85 px-3 py-1.5 text-left text-xs text-muted-foreground shadow-sm backdrop-blur sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                <span className="leading-snug">Professional social link organization</span>
              </div>
              <h1 className="text-[1.65rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl sm:leading-tight md:text-6xl md:leading-[1.05]">
                Organize every social link in one smart workspace.
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                {heroSubtitle}
              </p>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-0">
                <Link to={user ? "/app" : "/signup"} className="w-full sm:w-auto">
                  <Button type="button" size="lg" className="h-12 w-full touch-manipulation sm:h-11 sm:min-w-[10rem]">
                    {user ? "Go to Dashboard" : "Start Free"}
                  </Button>
                </Link>
                <Link to={user ? "/account" : "/login"} className="w-full sm:w-auto">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="h-12 w-full touch-manipulation sm:h-11 sm:min-w-[8rem]"
                  >
                    {user ? "Manage Account" : "Sign In"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

            <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Saved Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{topStats.totalLinks}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {loadingStats ? "Refreshing..." : subtitleLine}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{topStats.totalCategories}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep links structured with nested organization
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Platforms Tracked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{topStats.totalPlatforms}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visibility across every social network you use
                </p>
              </CardContent>
            </Card>
          </div>
          {/* <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              New links in last 24 hours:{" "}
              <span className="font-semibold text-foreground">{publicStats.linksLast24Hours}</span>
            </span>
            {lastUpdated && <span>Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </div> */}
        </section>


        <section className="container mx-auto px-4 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-4 sm:p-6 sm:pt-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <Bookmark className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg">Fast Capture</h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Save social links in seconds with metadata-ready inputs and cleaner titles.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-4 sm:p-6 sm:pt-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <FolderTree className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg">Nested Categories</h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Build clear category trees so large link collections stay easy to browse.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm sm:col-span-2 md:col-span-1">
              <CardContent className="p-4 sm:p-6 sm:pt-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <Layers3 className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg">Smart Filtering</h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Filter by platform, category, and search terms to locate links instantly.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
