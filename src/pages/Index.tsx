import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AddLinkDialog } from "@/components/AddLinkDialog";
import { LinkCard } from "@/components/LinkCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PlatformFilter } from "@/components/PlatformFilter";
import { CategoryManager } from "@/components/CategoryManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Bookmark, User, Filter } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform: string;
  category_id?: string;
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

  const fetchData = async () => {
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
        const transformedLinks = linksData.map((link: any) => ({
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
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Get unique platforms from links
  const availablePlatforms = Array.from(new Set(links.map(link => link.platform)));
  const activeFiltersCount =
    (selectedCategory ? 1 : 0) + (selectedPlatform ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  // Use client-side filtering (or move to backend)
  const filteredLinks = links.filter((link) => {
    const categoryMatch = selectedCategory === null || 
      link.category_id === selectedCategory || 
      link.categoryId === selectedCategory;
    const platformMatch = selectedPlatform === null || link.platform === selectedPlatform;
    const searchMatch =
      searchQuery === "" ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && platformMatch && searchMatch;
  });

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
            <Link to="/account">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-hero text-white overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Bookmark className="h-12 w-12" />
              <h1 className="text-4xl md:text-5xl font-bold">LinkSaver</h1>
            </div>
            <p className="text-xl md:text-2xl opacity-95 mb-6">
              Save, organize, and access your social media links in one beautiful place
            </p>
            <div className="flex flex-wrap gap-3">
              <AddLinkDialog categories={categories} onLinkAdded={fetchData} onCategoriesChange={fetchData} />
              <CategoryManager categories={categories} onCategoriesChange={fetchData} />
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
        {/* Horizontal Filters Bar */}
        <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm space-y-4">
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

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Platform row (already horizontal) */}
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

          {/* Category row (will be horizontal after component update) */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Category</div>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

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

        {/* Results Count */}
        {!loading && links.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredLinks.length}</span> of{" "}
              <span className="font-medium text-foreground">{links.length}</span> link
              {links.length !== 1 ? "s" : ""}
            </div>
            {(selectedCategory !== null || selectedPlatform !== null || searchQuery.trim() !== "") && (
              <Badge variant="secondary">Filtered</Badge>
            )}
          </div>
        )}

        {/* Edit Link Dialog */}
        <AddLinkDialog
          categories={categories}
          onLinkAdded={fetchData}
          onCategoriesChange={fetchData}
          linkToEdit={linkToEdit}
          onEditComplete={() => setLinkToEdit(null)}
        />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
