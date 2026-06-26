import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !fullName) {
      toast({
        title: t("auth.missingFields"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("auth.weakPassword"),
        description: t("auth.passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await api.register(email, password, fullName);
      await refreshUser();

      toast({
        title: t("common.success"),
        description: t("auth.signupSuccess"),
      });

      navigate("/app");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("auth.createAccountFailed");
      toast({
        title: t("auth.signupFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.createAccount")}
      subtitle={t("auth.signupSubtitle")}
      promoTitle={t("auth.promoSignupTitle")}
      promoHighlight={t("auth.promoSignupHighlight")}
    >
      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-gray-700">
            {t("auth.fullName")}
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t("auth.namePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-indigo-500"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            {t("common.email")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-indigo-500"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700">
            {t("auth.password")}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-indigo-500"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-400">{t("auth.passwordHint")}</p>
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-full text-base transition-transform hover:scale-[1.02] active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? t("auth.creatingAccount") : t("auth.signUpFree")}
        </Button>
      </form>

      <p className="mt-3 text-center text-xs text-gray-400">{t("common.noCreditCard")}</p>

      <div className="mt-4 text-center text-sm">
        <span className="text-gray-500">{t("auth.hasAccount")} </span>
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          {t("auth.signInLink")}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Signup;
