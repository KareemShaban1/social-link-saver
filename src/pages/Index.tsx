import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AddLinkDialog } from "@/components/AddLinkDialog";
import { LinkCard } from "@/components/LinkCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PlatformFilter } from "@/components/PlatformFilter";
import { CategoryManager } from "@/components/CategoryManager";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useTranslation } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Bookmark, Filter, BarChart3, FolderTree, Tags, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { detectPlatformFromUrl, extractUrlMetadata } from "@/lib/urlMetadata";
import { cn } from "@/lib/utils";

interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform: string;
  isFavorite?: boolean;
  category_id?: string;
  categoryId?: string;
  categories?: {
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
}

interface ApiLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform: string;
  isFavorite?: boolean;
  categoryId?: string;
  category_id?: string;
  category?: {
    name: string;
    color: string;
  };
}

const contrastOnHex = (hex: string): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "#ffffff";
  const num = parseInt(normalized, 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#0f172a" : "#ffffff";
};

/** Path from root to the selected category (ids), inclusive. Empty when none selected. */
function categoryPathToSelected(selectedId: string | null, all: Category[]): string[] {
  if (!selectedId || all.length === 0) return [];
  const byId = new Map(all.map((c) => [c.id, c]));
  const path: string[] = [];
  let cur: string | null = selectedId;
  while (cur) {
    const cat = byId.get(cur);
    if (!cat) break;
    path.unshift(cur);
    cur = cat.parent_id;
  }
  return path;
}

function categoryTabIsActive(
  rowIndex: number,
  categoryId: string,
  pathFromRoot: string[],
  selectedCategory: string | null
): boolean {
  if (!selectedCategory || pathFromRoot.length === 0) return false;
  if (rowIndex === 0) return pathFromRoot[0] === categoryId;
  return pathFromRoot.length > rowIndex && pathFromRoot[rowIndex] === categoryId;
}

const LINKS_PER_PAGE = 12;

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

const Index = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkToEdit, setLinkToEdit] = useState<{
    id: string;
    title: string;
    url: string;
    description?: string;
    platform: string;
    category_id?: string;
    isFavorite?: boolean;
  } | null>(null);
  const [createPrefill, setCreatePrefill] = useState<{
    title?: string;
    url?: string;
    description?: string;
    platform?: string;
    categoryId?: string;
    categoryName?: string;
  } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Fetch categories
      const { categories: categoriesData } = await api.getCategories();
      if (categoriesData) {
        // api.getCategories already normalizes parent_id
        setCategories(categoriesData);
      }

      // Fetch links
      const { links: linksData } = await api.getLinks();
      if (linksData) {
        // Transform links to match expected format
        const transformedLinks = (linksData as ApiLink[]).map((link) => ({
          ...link,
          isFavorite: link.isFavorite ?? false,
          category_id: link.categoryId ?? link.category_id ?? undefined,
          categories: link.category ? {
            name: link.category.name,
            color: link.category.color,
          } : undefined,
        }));
        setLinks(transformedLinks);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Bookmarklet/share flow:
  // Open "Add Link" dialog prefilled from query params like:
  // ?add=1&url=...&title=...&description=...&platform=...
	// If title/description are missing or low-quality, we try to improve them
	// using extractUrlMetadata (OG tags, meta description, etc.).
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const shouldAdd = params.get("add") === "1";
    const urlParam = params.get("url") || "";
    if (!shouldAdd || !urlParam) return;

	  const manualTitle = params.get("title") || undefined;
	  const manualDescription = params.get("description") || undefined;
	  const content = params.get("content") || undefined; // Raw content from bookmarklet
    const platform = params.get("platform") || detectPlatformFromUrl(urlParam);
    const categoryId = params.get("categoryId") || undefined;
    const categoryName = params.get("categoryName") || undefined;

	  (async () => {
		  let finalTitle = manualTitle;
		  let finalDescription = manualDescription;

		  // If bookmarklet/title looks generic or is missing, try to extract better metadata using AI
		  const looksGenericTitle =
			  !finalTitle ||
			  ["linkedin", "facebook", "twitter", "x", "instagram"]
				  .some((word) => finalTitle!.toLowerCase().includes(word) && finalTitle!.split(" ").length <= 3);

		  if (looksGenericTitle || !finalDescription || content) {
			  try {
				  // Pass content to AI service for better title/description generation
				  const metadata = await extractUrlMetadata(urlParam, content);
				  if (!finalTitle && metadata.title) {
					  finalTitle = metadata.title;
				  }
				  if (!finalDescription && metadata.description) {
					  finalDescription = metadata.description;
				  }
			  } catch (error) {
				  console.error("Failed to auto-extract metadata for shared URL:", error);
			  }
		  }

	    setCreatePrefill({
		    url: urlParam,
	      title: finalTitle,
	      description: finalDescription,
	      platform,
	      categoryId,
	      categoryName,
      });

	    // Remove query params to avoid re-opening on refresh
	    window.history.replaceState({}, "", window.location.pathname);
    })();
  }, [user]);

  // Get unique platforms from links
  const availablePlatforms = Array.from(new Set(links.map(link => link.platform)));
  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedPlatform ? 1 : 0) +
    (showFavoritesOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // When a category is selected, show links in that category or any descendant (nested subcategories)
  const getDescendantIds = (catId: string): string[] => {
    const direct = categories.filter((c) => c.parent_id === catId).map((c) => c.id);
    return [...direct, ...direct.flatMap((id) => getDescendantIds(id))];
  };
  const categoryIdMatches = (linkCategoryId: string | undefined): boolean => {
    if (!selectedCategory) return true;
    if (!linkCategoryId) return false;
    const lid = linkCategoryId;
    return lid === selectedCategory || getDescendantIds(selectedCategory).includes(lid);
  };

  // Use client-side filtering (or move to backend)
  const filteredLinks = links
    .filter((link) => {
    const linkCatId = link.category_id ?? link.categoryId;
    const categoryMatch = selectedCategory === null || categoryIdMatches(linkCatId);
    const platformMatch = selectedPlatform === null || link.platform === selectedPlatform;
    const favoritesMatch = !showFavoritesOnly || Boolean(link.isFavorite);
    const searchMatch =
      searchQuery === "" ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && platformMatch && favoritesMatch && searchMatch;
  })
    .sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / LINKS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLinks = useMemo(() => {
    const start = (safePage - 1) * LINKS_PER_PAGE;
    return filteredLinks.slice(start, start + LINKS_PER_PAGE);
  }, [filteredLinks, safePage]);
  const rangeFrom = filteredLinks.length === 0 ? 0 : (safePage - 1) * LINKS_PER_PAGE + 1;
  const rangeTo = Math.min(safePage * LINKS_PER_PAGE, filteredLinks.length);
  const pageNumbers = useMemo(() => getPageNumbers(safePage, totalPages), [safePage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPlatform, showFavoritesOnly, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFavoriteChange = useCallback((id: string, isFavorite: boolean) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, isFavorite } : link))
    );
  }, []);

  const stats = useMemo(() => {
    const categorizedLinks = links.filter((link) => Boolean(link.category_id ?? link.categoryId)).length;
    const topPlatformEntry = Object.entries(
      links.reduce<Record<string, number>>((acc, link) => {
        acc[link.platform] = (acc[link.platform] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      totalLinks: links.length,
      favoriteLinks: links.filter((link) => link.isFavorite).length,
      visibleLinks: filteredLinks.length,
      categorizedLinks,
      categorizedRatio: links.length ? Math.round((categorizedLinks / links.length) * 100) : 0,
      topPlatform: topPlatformEntry?.[0] ?? "N/A",
    };
  }, [links, filteredLinks]);

  const platformBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of links) {
      counts.set(link.platform, (counts.get(link.platform) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [links]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((c) => c.id === selectedCategory)?.name ?? null;
  }, [selectedCategory, categories]);

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const pathFromSelected = useMemo(
    () => categoryPathToSelected(selectedCategory, categories),
    [selectedCategory, categories]
  );

  /** Row 0 = roots; each following row = direct children of path segment at that depth (drill-down). */
  const categoryTabLevels = useMemo(() => {
    type Row = { rowIndex: number; parent: Category | null; items: Category[] };
    const rows: Row[] = [{ rowIndex: 0, parent: null, items: rootCategories }];
    if (!pathFromSelected.length) return rows;
    for (let k = 1; k <= pathFromSelected.length; k++) {
      const parentId = pathFromSelected[k - 1];
      const parent = categories.find((c) => c.id === parentId) ?? null;
      const items = categories
        .filter((c) => c.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (items.length === 0) break;
      rows.push({ rowIndex: k, parent, items });
    }
    return rows;
  }, [categories, pathFromSelected, rootCategories]);

  return (
    <div className="landing-page min-h-screen bg-gray-50 text-gray-900">
      <AppNavbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Dashboard header */}
        <div className="mb-8 animate-fade-in-up opacity-0" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{t("app.dashboard")}</p>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{t("app.myLinks")}</h1>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">{t("app.subtitle")}</p>
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: t("app.totalLinks"), value: stats.totalLinks, color: "text-primary", icon: Bookmark },
            { label: t("app.favorites"), value: stats.favoriteLinks, color: "text-amber-500", icon: Star },
            { label: t("app.categories"), value: categories.length, color: "text-sky-600", icon: FolderTree },
            { label: t("app.platforms"), value: availablePlatforms.length, color: "text-emerald-600", icon: Tags },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white px-4 py-4 opacity-0 shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md sm:px-5 sm:py-5"
              style={{ animationDelay: `${200 + index * 80}ms`, animationFillMode: "forwards" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-gray-300" />
              </div>
              <p className={`text-2xl font-extrabold sm:text-3xl ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div
          className="mb-8 flex animate-fade-in-up flex-wrap items-center gap-3 opacity-0"
          style={{ animationDelay: "450ms", animationFillMode: "forwards" }}
        >
          <AddLinkDialog
            categories={categories}
            onLinkAdded={fetchData}
            onCategoriesChange={fetchData}
            createPrefill={createPrefill}
            onCreatePrefillConsumed={() => setCreatePrefill(null)}
          />
          <CategoryManager categories={categories} onCategoriesChange={fetchData} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setStatsModalOpen(true)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("app.statistics")}
          </Button>
        </div>

        {/* Category drill-down */}
        {categories.length > 0 && (
          <div className="mb-6 -mx-4 space-y-3 px-4 md:mx-0 md:px-0">
            <p className="text-xs font-medium text-gray-500 md:text-sm">{t("app.categoriesLabel")}</p>
            {categoryTabLevels.map((row) => (
              <div key={`cat-row-${row.rowIndex}`}>
                {row.rowIndex > 0 && row.parent && (
                  <p className="mb-1.5 text-[10px] text-gray-400 sm:text-xs">
                    {t("app.subcategoriesOf")}{" "}
                    <span className="font-medium text-gray-800">{row.parent.name}</span>
                  </p>
                )}
                <div className="overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max flex-nowrap gap-2">
                    {row.rowIndex === 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCategory === null ? "default" : "outline"}
                        className={cn(
                          "shrink-0 rounded-full",
                          selectedCategory === null && "bg-primary hover:bg-primary/90",
                        )}
                        onClick={() => setSelectedCategory(null)}
                      >
                        {t("common.all")}
                      </Button>
                    )}
                    {row.items.map((cat) => {
                      const isActive = categoryTabIsActive(
                        row.rowIndex,
                        cat.id,
                        pathFromSelected,
                        selectedCategory
                      );
                      return (
                        <Button
                          key={cat.id}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className={cn(
                            "max-w-[200px] shrink-0 truncate rounded-full border",
                            isActive && "border-transparent"
                          )}
                          style={
                            isActive
                              ? {
                                  backgroundColor: cat.color,
                                  color: contrastOnHex(cat.color),
                                }
                              : {
                                  borderColor: `${cat.color}55`,
                                }
                          }
                          onClick={() => setSelectedCategory(cat.id)}
                          title={cat.name}
                        >
                          <span className="truncate">{cat.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters: mobile = search + sheet; desktop = full bar */}
        <div className="mb-8 space-y-4">
          {/* Mobile: search + Filters button that opens sheet */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("app.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-white pl-10 focus-visible:ring-indigo-500"
              />
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between rounded-xl border-gray-200 bg-white shadow-sm">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Filter className="h-4 w-4" />
                    {t("app.filters")}
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="text-left">
                  <SheetTitle>{t("app.filters")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-6 pb-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">{t("app.favorites")}</div>
                    <Button
                      type="button"
                      variant={showFavoritesOnly ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full",
                        showFavoritesOnly && "bg-amber-500 hover:bg-amber-600",
                      )}
                      onClick={() => setShowFavoritesOnly((prev) => !prev)}
                    >
                      <Star className={cn("mr-2 h-4 w-4", showFavoritesOnly && "fill-current")} />
                      {t("app.favoritesOnly")}
                    </Button>
                  </div>
                  {availablePlatforms.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">{t("app.platform")}</div>
                      <div className="flex flex-wrap gap-2">
                        <PlatformFilter
                          platforms={availablePlatforms}
                          selectedPlatform={selectedPlatform}
                          onSelectPlatform={setSelectedPlatform}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">{t("app.category")}</div>
                    <CategoryFilter
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                      compact
                    />
                  </div>
                  {(selectedCategory !== null || selectedPlatform !== null || showFavoritesOnly || searchQuery.trim() !== "") && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedPlatform(null);
                        setShowFavoritesOnly(false);
                        setSearchQuery("");
                        setFiltersOpen(false);
                      }}
                    >
                      {t("common.clearAll")}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: full horizontal filters bar */}
          <div className="hidden space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:block">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Filter className="h-4 w-4 text-primary" />
              {t("app.filters")}
              {activeFiltersCount > 0 && (
                <Badge className="ms-auto bg-primary/10 text-primary hover:bg-primary/10">
                  {activeFiltersCount} {t("common.active")}
                </Badge>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">{t("app.favorites")}</div>
              <Button
                type="button"
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full",
                  showFavoritesOnly && "border-transparent bg-amber-500 hover:bg-amber-600",
                )}
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
              >
                <Star className={cn("mr-2 h-4 w-4", showFavoritesOnly && "fill-current")} />
                {t("app.favoritesOnly")}
              </Button>
            </div>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("app.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border-input bg-gray-50 pl-10"
              />
            </div>
            {availablePlatforms.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">{t("app.platform")}</div>
                <div className="overflow-x-auto">
                  <div className="min-w-max pr-2">
                    <PlatformFilter
                      platforms={availablePlatforms}
                      selectedPlatform={selectedPlatform}
                      onSelectPlatform={setSelectedPlatform}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">{t("app.category")}</div>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div> */}
            {(selectedCategory !== null || selectedPlatform !== null || showFavoritesOnly || searchQuery.trim() !== "") && (
              <Button
                variant="outline"
                className="rounded-full border-gray-200 hover:border-indigo-200 hover:bg-indigo-50"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPlatform(null);
                  setShowFavoritesOnly(false);
                  setSearchQuery("");
                }}
              >
                {t("common.clearAll")}
              </Button>
            )}
          </div>
        </div>

        {/* Results Count & Pagination */}
        {!loading && links.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
              <span>
                {totalPages > 1
                  ? t("app.showingRange", { from: rangeFrom, to: rangeTo, total: filteredLinks.length })
                  : (
                    <>
                      {t("app.showing", { visible: filteredLinks.length, total: links.length })}{" "}
                      {links.length === 1 ? t("app.link") : t("app.links")}
                    </>
                  )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(selectedCategory !== null || selectedPlatform !== null || showFavoritesOnly || searchQuery.trim() !== "") && (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{t("common.filtered")}</Badge>
                )}
                <AddLinkDialog
                  categories={categories}
                  onLinkAdded={fetchData}
                  onCategoriesChange={fetchData}
                  linkToEdit={linkToEdit}
                  onEditComplete={() => setLinkToEdit(null)}
                />
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400 sm:text-sm">
                  {t("app.pageOf", { current: safePage, total: totalPages })}
                </p>
                <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        size="default"
                        className={cn(
                          "gap-1 rounded-full",
                          safePage === 1 && "pointer-events-none opacity-50",
                        )}
                        aria-disabled={safePage === 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>{t("common.previous")}</span>
                      </PaginationLink>
                    </PaginationItem>
                    {pageNumbers.map((page, idx) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={page === safePage}
                            className="rounded-full min-w-9"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        size="default"
                        className={cn(
                          "gap-1 rounded-full",
                          safePage === totalPages && "pointer-events-none opacity-50",
                        )}
                        aria-disabled={safePage === totalPages}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                      >
                        <span>{t("common.next")}</span>
                        <ChevronRight className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}

        <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
          <DialogContent className="max-h-[min(90vh,640px)] max-w-lg gap-0 overflow-hidden rounded-2xl border-gray-100 p-0 sm:max-w-lg">
            <div className="max-h-[min(90vh,640px)] overflow-y-auto p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-gray-900">{t("app.statsTitle")}</DialogTitle>
                <DialogDescription className="text-gray-500">{t("app.statsDesc")}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="rounded-xl border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-500">{t("app.totalLinksCard")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-extrabold text-primary">{stats.totalLinks}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {t("app.visibleWithFilters", { count: stats.visibleLinks })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-500">{t("app.categorizedCard")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.categorizedRatio}%</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {t("app.categorizedDetail", {
                          count: stats.categorizedLinks,
                          uncategorized: Math.max(0, stats.totalLinks - stats.categorizedLinks),
                        })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-500">{t("app.topPlatform")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">{stats.topPlatform}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {availablePlatforms.length === 1
                          ? t("app.platformsInUseOne")
                          : t("app.platformsInUse", { count: availablePlatforms.length })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-500">{t("app.categoriesCard")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{categories.length}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {rootCategories.length === 1
                          ? t("app.topLevelFolderOne")
                          : t("app.topLevelFolders", { count: rootCategories.length })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{t("app.activeFilters")} </span>
                    {selectedCategoryName && (
                      <span>{t("app.filterCategory", { name: selectedCategoryName })} </span>
                    )}
                    {selectedPlatform && <span>{t("app.filterPlatform", { name: selectedPlatform })} </span>}
                    {showFavoritesOnly && <span>{t("app.filterFavorites")} </span>}
                    {searchQuery.trim() && (
                      <span>{t("app.filterSearch", { query: searchQuery.trim() })}</span>
                    )}
                  </div>
                )}

                {platformBreakdown.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-900">{t("app.linksByPlatform")}</p>
                    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                      {platformBreakdown.map(([name, count]) => (
                        <li key={name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span className="truncate font-medium">{name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Links Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bookmark className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              {links.length === 0
                ? t("app.noLinksYet")
                : showFavoritesOnly && stats.favoriteLinks === 0
                  ? t("app.noFavoritesYet")
                  : t("app.noLinksMatch")}
            </h3>
            <p className="mb-6 text-gray-500">
              {links.length === 0
                ? t("app.noLinksYetDesc")
                : showFavoritesOnly && stats.favoriteLinks === 0
                  ? t("app.noFavoritesYetDesc")
                  : t("app.noLinksMatchDesc")}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {links.length === 0 && (
                <AddLinkDialog categories={categories} onLinkAdded={fetchData} onCategoriesChange={fetchData} />
              )}
              {(links.length > 0 || searchQuery.trim() !== "" || selectedCategory || selectedPlatform || showFavoritesOnly) && (
                <Button
                  variant="outline"
                  className="rounded-full border-gray-200 hover:border-indigo-200 hover:bg-indigo-50"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedPlatform(null);
                    setShowFavoritesOnly(false);
                    setSearchQuery("");
                  }}
                >
                  {t("common.clearAll")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {paginatedLinks.map((link, index) => (
              <div
                key={link.id}
                className="animate-fade-in-up opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationFillMode: "forwards" }}
              >
              <LinkCard
                id={link.id}
                title={link.title}
                url={link.url}
                description={link.description}
                platform={link.platform}
                isFavorite={link.isFavorite}
                category={link.categories}
                categories={categories}
                onDelete={fetchData}
                onFavoriteChange={handleFavoriteChange}
                onEdit={setLinkToEdit}
              />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredLinks.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="default"
                    className={cn(
                      "gap-1 rounded-full",
                      safePage === 1 && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={safePage === 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{t("common.previous")}</span>
                  </PaginationLink>
                </PaginationItem>
                {pageNumbers.map((page, idx) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`bottom-ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`bottom-${page}`}>
                      <PaginationLink
                        href="#"
                        isActive={page === safePage}
                        className="rounded-full min-w-9"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="default"
                    className={cn(
                      "gap-1 rounded-full",
                      safePage === totalPages && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={safePage === totalPages}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                  >
                    <span>{t("common.next")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
