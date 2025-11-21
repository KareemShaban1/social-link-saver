import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { extractUrlMetadata, detectPlatformFromUrl } from "@/lib/urlMetadata";

interface Category {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
}

interface LinkToEdit {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform: string;
  category_id?: string;
}

interface AddLinkDialogProps {
  categories: Category[];
  onLinkAdded: () => void;
  onCategoriesChange?: () => Promise<void> | void;
  linkToEdit?: LinkToEdit | null;
  onEditComplete?: () => void;
}

const PLATFORMS = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Pinterest",
  "Reddit",
  "Other"
];

export const AddLinkDialog = ({ categories, onLinkAdded, onCategoriesChange, linkToEdit, onEditComplete }: AddLinkDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!linkToEdit;

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Load link data when editing
  useEffect(() => {
    if (linkToEdit && open) {
      setTitle(linkToEdit.title);
      setUrl(linkToEdit.url);
      setDescription(linkToEdit.description || "");
      setPlatform(linkToEdit.platform);
      setCategoryId(linkToEdit.category_id || "");
      setCategoryName("");
    }
  }, [linkToEdit, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setUrl("");
      setDescription("");
      setPlatform("");
      setCategoryId("");
      setCategoryName("");
    }
  }, [open]);

  // Find or create category by name
  const findOrCreateCategory = async (categoryName: string): Promise<string | null> => {
    if (!categoryName.trim() || !user) return null;

    // First, try to find existing category (case-insensitive)
    const existingCategory = categories.find(
      c => c.name.toLowerCase() === categoryName.trim().toLowerCase()
    );

    if (existingCategory) {
      return existingCategory.id;
    }

    // Category doesn't exist, create it
    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert({
        name: categoryName.trim(),
        color: getRandomColor(),
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !newCategory) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: `Failed to create category: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return null;
    }

    // Refresh categories if callback provided
    if (onCategoriesChange) {
      // Wait a bit for the database to update, then refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      await onCategoriesChange();
    }

    toast({
      title: "Category created",
      description: `Created new category: ${categoryName.trim()}`,
    });

    return newCategory.id;
  };

  // Generate a random color for new categories
  const getRandomColor = (): string => {
    const colors = [
      '#3b82f6', // blue
      '#ec4899', // pink
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle auto-fill from URL
  const handleFetchFromUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "No URL",
        description: "Please enter a URL first",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setFetchingMetadata(true);

    try {
      console.log("Fetching metadata for URL:", url);
      const metadata = await extractUrlMetadata(url);
      console.log("Extracted metadata:", metadata);
      
      // Auto-fill form fields
      if (metadata.title) {
        setTitle(metadata.title);
      }
      if (metadata.description) {
        setDescription(metadata.description);
      }
      if (metadata.platform) {
        setPlatform(metadata.platform);
      }

      // Auto-detect and create category based on platform
      // First check if user provided a category name
      if (categoryName.trim()) {
        const newCategoryId = await findOrCreateCategory(categoryName.trim());
        if (newCategoryId) {
          setCategoryId(newCategoryId);
        }
      } else {
        // Auto-create or select category based on platform
        const suggestedCategory = metadata.platform;
        if (suggestedCategory && suggestedCategory !== 'Other') {
          // Refresh categories first to get the latest list
          if (onCategoriesChange) {
            await onCategoriesChange();
            // Wait a moment for state to update
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Re-fetch categories from the updated list (we need to get fresh data)
          // Since categories prop might not be updated yet, we'll query directly
          if (user) {
            const { data: freshCategories } = await supabase
              .from("categories")
              .select("*")
              .eq("user_id", user.id)
              .order("name");
            
            const categoriesToUse = freshCategories || categories;
            const existingCategory = categoriesToUse.find(
              c => c.name.toLowerCase() === suggestedCategory.toLowerCase()
            );
            
            if (existingCategory) {
              // Category exists, use it
              setCategoryId(existingCategory.id);
              console.log("Using existing category:", existingCategory.name);
            } else {
              // Category doesn't exist, create it automatically
              console.log("Creating new category:", suggestedCategory);
              const newCategoryId = await findOrCreateCategory(suggestedCategory);
              if (newCategoryId) {
                setCategoryId(newCategoryId);
              }
            }
          }
        }
      }

      const successMessage = metadata.title 
        ? `Fetched: ${metadata.title.substring(0, 50)}${metadata.title.length > 50 ? '...' : ''}`
        : "Link metadata fetched successfully";
      
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      console.error("Error fetching metadata:", error);
      toast({
        title: "Error",
        description: "Failed to fetch link metadata. You can still fill the form manually.",
        variant: "destructive",
      });
      // Still set platform from URL detection
      const detectedPlatform = detectPlatformFromUrl(url);
      setPlatform(detectedPlatform);
      
      // Still try to set category based on detected platform
      if (detectedPlatform && detectedPlatform !== 'Other') {
        const existingCategory = categories.find(
          c => c.name.toLowerCase() === detectedPlatform.toLowerCase()
        );
        if (existingCategory) {
          setCategoryId(existingCategory.id);
        }
      }
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !url || !platform) {
      toast({
        title: "Missing fields",
        description: "Please fill in title, URL, and platform",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save links",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // If category name is provided but no category ID, create the category
    let finalCategoryId = categoryId;
    if (categoryName.trim() && !categoryId) {
      const newCategoryId = await findOrCreateCategory(categoryName.trim());
      if (newCategoryId) {
        finalCategoryId = newCategoryId;
      }
    }

    if (isEditMode && linkToEdit) {
      // Update existing link
      const { error } = await supabase
        .from("links")
        .update({
          title,
          url,
          description,
          platform,
          category_id: finalCategoryId || null,
        })
        .eq("id", linkToEdit.id);

      setLoading(false);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update link",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Link updated successfully",
      });

      // Reset form
      setTitle("");
      setUrl("");
      setDescription("");
      setPlatform("");
      setCategoryId("");
      setCategoryName("");
      setOpen(false);
      if (onEditComplete) {
        onEditComplete();
      }
      onLinkAdded();
    } else {
      // Create new link
      const { error } = await supabase.from("links").insert({
        title,
        url,
        description,
        platform,
        category_id: finalCategoryId || null,
        user_id: user.id,
      });

      setLoading(false);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save link",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Link saved successfully",
      });

      // Reset form
      setTitle("");
      setUrl("");
      setDescription("");
      setPlatform("");
      setCategoryId("");
      setCategoryName("");
      setOpen(false);
      onLinkAdded();
    }
    
    // Refresh categories if callback provided
    if (onCategoriesChange) {
      onCategoriesChange();
    }
  };

  // Control dialog open state from external prop (for edit mode)
  useEffect(() => {
    if (linkToEdit !== undefined) {
      setOpen(!!linkToEdit);
    }
  }, [linkToEdit]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setTitle("");
      setUrl("");
      setDescription("");
      setPlatform("");
      setCategoryId("");
      setCategoryName("");
      // Notify parent that edit is complete
      if (isEditMode && onEditComplete) {
        onEditComplete();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Link" : "Add New Link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter link title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
                className="flex-1"
              />
              
	    {/* <Button
                type="button"
                variant="outline"
                onClick={handleFetchFromUrl}
                disabled={fetchingMetadata || !url.trim()}
                className="shrink-0"
              >
                {fetchingMetadata ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Auto-fill
                  </>
                )}
              </Button> */}
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a URL and click "Auto-fill" to automatically extract title, description, and platform
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={setPlatform} required>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <div className="space-y-2">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing category" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((cat) => (
                    <React.Fragment key={cat.id}>
                      <SelectItem value={cat.id}>{cat.name}</SelectItem>
                      {getSubcategories(cat.id).map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          └─ {subcat.name}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="Or type new category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onBlur={async () => {
                    if (categoryName.trim()) {
                      const newCategoryId = await findOrCreateCategory(categoryName.trim());
                      if (newCategoryId) {
                        setCategoryId(newCategoryId);
                        setCategoryName("");
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Select an existing category or type a new name to create one
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this link..."
              rows={3}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Link" : "Save Link")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
