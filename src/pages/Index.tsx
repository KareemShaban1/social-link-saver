import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AddLinkDialog } from "@/components/AddLinkDialog";
import { LinkCard } from "@/components/LinkCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PlatformFilter } from "@/components/PlatformFilter";
import { CategoryManager } from "@/components/CategoryManager";
import { ModeToggle } from "@/components/mode-toggle";
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
import { Search, Bookmark, User, Filter, BarChart3, FolderTree, ChartColumnBig } from "lucide-react";
import { detectPlatformFromUrl, extractUrlMetadata } from "@/lib/urlMetadata";
import { cn } from "@/lib/utils";

interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform: string;
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

const Index = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkToEdit, setLinkToEdit] = useState<{
    id: string;
    title: string;
    url: string;
    description?: string;
    platform: string;
    category_id?: string;
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
    (selectedCategory ? 1 : 0) + (selectedPlatform ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

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
  const filteredLinks = links.filter((link) => {
    const linkCatId = link.category_id ?? link.categoryId;
    const categoryMatch = selectedCategory === null || categoryIdMatches(linkCatId);
    const platformMatch = selectedPlatform === null || link.platform === selectedPlatform;
    const searchMatch =
      searchQuery === "" ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && platformMatch && searchMatch;
  });

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
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">LinkSaver</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Link to="/account">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section - links/bookmarks themed background */}
      <div className="relative hero-links-bg text-white overflow-hidden">
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Bookmark className="h-12 w-12" />
              <h1 className="text-4xl md:text-5xl font-bold">LinkSaver</h1>
            </div>
            <p className="text-normal md:text-2xl opacity-95 mb-6">
              Save, organize, and access your social media links in one beautiful place
            </p>
            <div className="flex flex-wrap gap-3">
              <AddLinkDialog
                categories={categories}
                onLinkAdded={fetchData}
                onCategoriesChange={fetchData}
                createPrefill={createPrefill}
                onCreatePrefillConsumed={() => setCreatePrefill(null)}
              />
              <CategoryManager categories={categories} onCategoriesChange={fetchData} />
            </div>

		<div className="mt-4">
		<Button type="button" className="bg-white text-black" size="sm" onClick={() => setStatsModalOpen(true)}>
			<BarChart3 className="mr-2 h-4 w-4" />
			Show statistics
			</Button>
		</div>

            <div className="mt-8 flex flex-wrap gap-2 text-white/90">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
                {links.length} link{links.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
                {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
              </span>
              {availablePlatforms.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
                  {availablePlatforms.length} platform{availablePlatforms.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        

        {/* Category drill-down: parents first, then each chosen level’s children on the row below */}
        {categories.length > 0 && (
          <div className="mb-6 -mx-4 space-y-3 px-4 md:mx-0 md:px-0">
            <p className="text-xs font-medium text-muted-foreground md:text-sm">Categories</p>
            {categoryTabLevels.map((row) => (
              <div key={`cat-row-${row.rowIndex}`}>
                {row.rowIndex > 0 && row.parent && (
                  <p className="mb-1.5 text-[10px] text-muted-foreground sm:text-xs">
                    Subcategories of{" "}
                    <span className="font-medium text-foreground">{row.parent.name}</span>
                  </p>
                )}
                <div className="overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max flex-nowrap gap-2">
                    {row.rowIndex === 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCategory === null ? "default" : "outline"}
                        className="shrink-0 rounded-full"
                        onClick={() => setSelectedCategory(null)}
                      >
                        All
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
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between rounded-xl border bg-card shadow-sm">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Filter className="h-4 w-4" />
                    Filters
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
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-6 pb-6">
                  {availablePlatforms.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Platform</div>
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
                    <div className="text-sm font-medium text-muted-foreground">Category</div>
                    <CategoryFilter
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                      compact
                    />
                  </div>
                  {(selectedCategory !== null || selectedPlatform !== null || searchQuery.trim() !== "") && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedPlatform(null);
                        setSearchQuery("");
                        setFiltersOpen(false);
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: full horizontal filters bar */}
          <div className="hidden md:block rounded-xl border bg-card p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            <Separator />
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {availablePlatforms.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Platform</div>
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
              <div className="text-sm font-medium text-muted-foreground">Category</div>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div> */}
            {(selectedCategory !== null || selectedPlatform !== null || searchQuery.trim() !== "") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPlatform(null);
                  setSearchQuery("");
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && links.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing <span className="font-medium text-foreground">{filteredLinks.length}</span> of{" "}
              <span className="font-medium text-foreground">{links.length}</span> link
              {links.length !== 1 ? "s" : ""}
            </span>
            {(selectedCategory !== null || selectedPlatform !== null || searchQuery.trim() !== "") && (
              <Badge variant="secondary">Filtered</Badge>
            )}

  <AddLinkDialog
          categories={categories}
          onLinkAdded={fetchData}
          onCategoriesChange={fetchData}
          linkToEdit={linkToEdit}
          onEditComplete={() => setLinkToEdit(null)}
        />
          </div>
        )}

      

        <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
          <DialogContent className="max-h-[min(90vh,640px)] max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
            <div className="max-h-[min(90vh,640px)] overflow-y-auto p-6">
              <DialogHeader className="text-left">
                <DialogTitle>Dashboard statistics</DialogTitle>
                <DialogDescription>
                  Current numbers for your library. Totals reflect all saved links; visibility counts respect active
                  filters.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Total links</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalLinks}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stats.visibleLinks} visible with current filters
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Categorized</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.categorizedRatio}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stats.categorizedLinks} with a category ·{" "}
                        {Math.max(0, stats.totalLinks - stats.categorizedLinks)} uncategorized
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Top platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">{stats.topPlatform}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {availablePlatforms.length} distinct platform{availablePlatforms.length !== 1 ? "s" : ""} in use
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{categories.length}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rootCategories.length} top-level folder{rootCategories.length !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Active filters: </span>
                    {selectedCategoryName && <span>Category: {selectedCategoryName}. </span>}
                    {selectedPlatform && <span>Platform: {selectedPlatform}. </span>}
                    {searchQuery.trim() && <span>Search: &quot;{searchQuery.trim()}&quot;.</span>}
                  </div>
                )}

                {platformBreakdown.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Links by platform</p>
                    <ul className="divide-y rounded-lg border">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-5">
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
          <div className="text-center py-12 rounded-xl border bg-card">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {links.length === 0 ? "No links yet" : "No links match your filters"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {links.length === 0
                ? "Start saving your favorite social media links"
                : "Try adjusting your filters or search query"}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {links.length === 0 && (
                <AddLinkDialog categories={categories} onLinkAdded={fetchData} onCategoriesChange={fetchData} />
              )}
              {(links.length > 0 || searchQuery.trim() !== "" || selectedCategory || selectedPlatform) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedPlatform(null);
                    setSearchQuery("");
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.id}
                id={link.id}
                title={link.title}
                url={link.url}
                description={link.description}
                platform={link.platform}
                category={link.categories}
                categories={categories}
                onDelete={fetchData}
                onEdit={setLinkToEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
