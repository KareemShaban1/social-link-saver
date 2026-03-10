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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img src="/pwa-192x192.svg" alt="LinkSaver icon" className="h-6 w-6 rounded-md" />
            <span className="text-lg font-semibold">LinkSaver</span>
          </div>
          <div className="flex items-center gap-2">
            {!isInstalled && deferredPrompt && (
              <Button size="sm" variant="outline" onClick={handleInstallApp} disabled={installing}>
                <Download className="mr-2 h-4 w-4" />
                {installing ? "Installing..." : "Install App"}
              </Button>
            )}
            {user ? (
              <>
                <Link to="/app">
                  <Button size="sm">Open Dashboard</Button>
                </Link>
                <Link to="/account">
                  <Button size="sm" variant="outline">
                    Account
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b bg-[radial-gradient(1200px_circle_at_20%_20%,hsl(var(--primary)/0.20),transparent_55%),radial-gradient(1000px_circle_at_85%_25%,hsl(var(--accent)/0.18),transparent_50%)]">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Professional social link organization
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Organize every social link in one smart workspace.
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">{heroSubtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Link to={user ? "/app" : "/signup"}>
                  <Button size="lg">{user ? "Go to Dashboard" : "Start Free"}</Button>
                </Link>
                <Link to={user ? "/account" : "/login"}>
                  <Button size="lg" variant="outline">
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              New links in last 24 hours:{" "}
              <span className="font-semibold text-foreground">{publicStats.linksLast24Hours}</span>
            </span>
            {lastUpdated && <span>Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/80">
              <CardContent className="pt-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <Bookmark className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Fast Capture</h3>
                <p className="text-sm text-muted-foreground">
                  Save social links in seconds with metadata-ready inputs and cleaner titles.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80">
              <CardContent className="pt-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <FolderTree className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Nested Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Build clear category trees so large link collections stay easy to browse.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80">
              <CardContent className="pt-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <Layers3 className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Smart Filtering</h3>
                <p className="text-sm text-muted-foreground">
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
