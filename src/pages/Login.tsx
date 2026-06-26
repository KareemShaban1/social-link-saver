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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("auth.missingFields"),
        description: t("auth.enterEmailPassword"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await api.login(email, password);
      await refreshUser();

      toast({
        title: t("common.success"),
        description: t("auth.loginSuccess"),
      });

      navigate("/app");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("auth.invalidCredentials");
      toast({
        title: t("auth.loginFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
      promoTitle={t("auth.promoLoginTitle")}
      promoHighlight={t("auth.promoLoginHighlight")}
    >
      <form onSubmit={handleLogin} className="space-y-5">
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
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-full text-base transition-transform hover:scale-[1.02] active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500">{t("auth.noAccount")} </span>
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          {t("auth.signUpLink")}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
