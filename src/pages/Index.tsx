import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AddLinkDialog } from "@/components/AddLinkDialog";
import { LinkCard } from "@/components/LinkCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PlatformFilter } from "@/components/PlatformFilter";
import { CategoryManager } from "@/components/CategoryManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    
    // Fetch categories (filtered by user_id)
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (categoriesData) {
      setCategories(categoriesData);
    }

    // Fetch links (filtered by user_id)
    const { data: linksData } = await supabase
      .from("links")
      .select(`
        *,
        categories (
          name,
          color
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (linksData) {
      setLinks(linksData);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Get unique platforms from links
  const availablePlatforms = Array.from(new Set(links.map(link => link.platform)));

  const filteredLinks = links.filter((link) => {
    const matchesCategory = selectedCategory === null || link.category_id === selectedCategory;
    const matchesPlatform = selectedPlatform === null || link.platform === selectedPlatform;
    const matchesSearch =
      searchQuery === "" ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPlatform && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">LinkSaver</h1>
          </div>
          <Link to="/account">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Account
            </Button>
          </Link>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            
            {/* Category Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">By Category</h3>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
            
            {/* Platform Filter */}
            {availablePlatforms.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">By Platform</h3>
                <PlatformFilter
                  platforms={availablePlatforms}
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={setSelectedPlatform}
                />
              </div>
            )}
            
            {/* Clear Filters */}
            {(selectedCategory !== null || selectedPlatform !== null) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPlatform(null);
                }}
                className="mt-2"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && links.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredLinks.length} of {links.length} link{links.length !== 1 ? 's' : ''}
            {(selectedCategory !== null || selectedPlatform !== null || searchQuery !== "") && (
              <span className="ml-2">
                (filtered)
              </span>
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
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {links.length === 0 ? "No links yet" : "No links match your filters"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {links.length === 0
                ? "Start saving your favorite social media links"
                : "Try adjusting your filters or search query"}
            </p>
            {links.length === 0 && (
              <AddLinkDialog categories={categories} onLinkAdded={fetchData} onCategoriesChange={fetchData} />
            )}
            {links.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPlatform(null);
                  setSearchQuery("");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
