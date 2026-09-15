import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AppNavbar } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, LogOut, User } from "lucide-react";
import { SaveFromAppsSheet } from "@/components/SaveFromAppsSheet";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Subscription {
  id: string;
  status: string;
  subscription_plans?: {
    name: string;
    description: string | null;
    price_monthly: number;
  };
  current_period_end?: string;
}

const Account = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { user: userData } = await api.getUserProfile();
      const profileData: UserProfile | null = userData?.profile
        ? {
            full_name: userData.profile.fullName ?? null,
            avatar_url: userData.profile.avatarUrl ?? null,
          }
        : null;

      setFullName(profileData?.full_name || userData?.fullName || "");
    } catch {
      toast({
        title: t("common.error"),
        description: t("account.loadProfileFailed"),
        variant: "destructive",
      });
    }
    setProfileLoading(false);
  };

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { user: userData } = await api.getUserProfile();
      const sub = userData?.subscription;
      if (!sub) {
        setSubscription(null);
        return;
      }

      setSubscription({
        id: sub.id,
        status: sub.status,
        current_period_end: sub.currentPeriodEnd,
        subscription_plans: sub.plan
          ? {
              name: sub.plan.name,
              description: sub.plan.description ?? null,
              price_monthly: Number(sub.plan.priceMonthly ?? 0),
            }
          : undefined,
      });
    } catch {
      setSubscription(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);

    try {
      await api.updateUserProfile({
        fullName: fullName || undefined,
      });

      toast({
        title: t("common.success"),
        description: t("account.profileUpdated"),
      });

      fetchProfile();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("account.updateProfileFailed");
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (profileLoading) {
    return (
      <div className="landing-page min-h-screen bg-gray-50">
        <AppNavbar />
        <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-gray-500">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page min-h-screen bg-gray-50 text-gray-900">
      <AppNavbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div
          className="mb-8 animate-fade-in-up opacity-0"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{t("nav.account")}</p>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{t("account.title")}</h1>
        </div>

        <div className="space-y-6">
          <section
            className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white p-6 opacity-0 shadow-sm sm:p-8"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("account.profile")}</h2>
                <p className="text-sm text-gray-500">{t("account.profileDesc")}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  {t("common.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="rounded-xl border-gray-200 bg-gray-50"
                />
                <p className="text-xs text-gray-400">{t("account.emailCannotChange")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700">
                  {t("account.fullName")}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("account.namePlaceholder")}
                  className="rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-indigo-500"
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="rounded-full px-6"
              >
                {loading ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </div>
          </section>

          <section
            className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white p-6 opacity-0 shadow-sm sm:p-8"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("account.subscription")}</h2>
                <p className="text-sm text-gray-500">{t("account.subscriptionDesc")}</p>
              </div>
            </div>

            {subscription && subscription.subscription_plans ? (
              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {subscription.subscription_plans.name} {t("account.planSuffix")}
                    </p>
                    {subscription.subscription_plans.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {subscription.subscription_plans.description}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-end">
                    <p className="font-semibold text-indigo-600">
                      ${subscription.subscription_plans.price_monthly}
                      {t("account.perMonth")}
                    </p>
                    <p className="mt-1 text-xs capitalize text-gray-500">
                      {t("account.status")} {subscription.status}
                    </p>
                  </div>
                </div>
                {subscription.current_period_end && (
                  <>
                    <Separator />
                    <p className="text-sm text-gray-500">
                      {t("account.periodEnds")}{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                {t("account.noSubscription")}
              </p>
            )}
          </section>

          <section
            className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white p-6 opacity-0 shadow-sm sm:p-8"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("shareFromApps.title")}</h2>
                <p className="text-sm text-gray-500">{t("shareFromApps.subtitle")}</p>
              </div>
              <SaveFromAppsSheet className="rounded-full" />
            </div>
          </section>

          <section
            className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white p-6 opacity-0 shadow-sm"
            style={{ animationDelay: "450ms", animationFillMode: "forwards" }}
          >
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="h-11 w-full rounded-full"
            >
              <LogOut className="me-2 h-4 w-4" />
              {t("account.signOut")}
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Account;
