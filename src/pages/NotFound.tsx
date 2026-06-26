import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { AppNavbar } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="landing-page min-h-screen bg-gray-50 text-gray-900">
      <AppNavbar />
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="mb-2 text-6xl font-extrabold text-indigo-600">404</p>
          <h1 className="mb-3 text-xl font-bold text-gray-900">{t("notFound.title")}</h1>
          <Link to="/">
            <Button className="rounded-full px-6">{t("notFound.returnHome")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
