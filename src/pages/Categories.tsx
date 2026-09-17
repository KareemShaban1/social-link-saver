import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderTree } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { AppNavbar } from "@/components/app/AppNavbar";
import { AppBottomNav } from "@/components/app/AppBottomNav";
import { CategoryManager } from "@/components/CategoryManager";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
}

const Categories = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      const { categories: categoriesData } = await api.getCategories();
      if (categoriesData) {
        setCategories(categoriesData);
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("categoryManager.loadFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast, user]);

  useEffect(() => {
    if (user) {
      void fetchCategories();
    }
  }, [user, fetchCategories]);

  return (
    <div className="landing-page min-h-screen bg-gray-50 text-gray-900">
      <AppNavbar />

      <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 md:pb-10 lg:px-8 lg:py-10">
        <div
          className="mb-8 animate-fade-in-up opacity-0"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
            {t("nav.categories")}
          </p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                <FolderTree className="h-7 w-7 text-primary" />
                {t("categoryManager.title")}
              </h1>
              <p className="mt-2 text-sm text-gray-500 sm:text-base">
                {t("categoryManager.pageSubtitle")}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-gray-200">
              <Link to="/app">{t("nav.goToDashboard")}</Link>
            </Button>
          </div>
        </div>

        <section
          className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white p-4 opacity-0 shadow-sm sm:p-6"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <p className="text-sm text-gray-500">{t("common.loading")}</p>
              </div>
            </div>
          ) : (
            <CategoryManager
              embedded
              categories={categories}
              onCategoriesChange={fetchCategories}
            />
          )}
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
};

export default Categories;
