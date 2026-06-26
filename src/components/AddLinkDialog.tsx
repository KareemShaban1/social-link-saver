import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { extractUrlMetadata, detectPlatformFromUrl } from "@/lib/urlMetadata";
import { useTranslation } from "@/contexts/LanguageContext";
import { formFieldClass } from "@/lib/formStyles";
import type { TranslationKey } from "@/i18n";

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
  createPrefill?: {
    title?: string;
    url?: string;
    description?: string;
    platform?: string;
    categoryId?: string;
    categoryName?: string;
  } | null;
  onCreatePrefillConsumed?: () => void;
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
  "Other",
] as const;

const PLATFORM_I18N: Record<(typeof PLATFORMS)[number], TranslationKey> = {
  Facebook: "platforms.facebook",
  Instagram: "platforms.instagram",
  Twitter: "platforms.twitter",
  LinkedIn: "platforms.linkedin",
  YouTube: "platforms.youtube",
  TikTok: "platforms.tiktok",
  Pinterest: "platforms.pinterest",
  Reddit: "platforms.reddit",
  Other: "platforms.other",
};

/** Depth-first list of categories for selects (unlimited nesting). */
function flattenCategoriesTree(categories: Category[]): { category: Category; depth: number }[] {
  const result: { category: Category; depth: number }[] = [];
  const roots = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const walk = (cat: Category, depth: number) => {
    result.push({ category: cat, depth });
    categories
      .filter((c) => c.parent_id === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((child) => walk(child, depth + 1));
  };
  roots.forEach((r) => walk(r, 0));
  return result;
}

export const AddLinkDialog = ({
  categories,
  onLinkAdded,
  onCategoriesChange,
  linkToEdit,
  onEditComplete,
  createPrefill,
  onCreatePrefillConsumed,
}: AddLinkDialogProps) => {
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
  const { t } = useTranslation();

  const isEditMode = !!linkToEdit;

  const categoriesForSelect = useMemo(() => flattenCategoriesTree(categories), [categories]);

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

  // Load create-mode prefill (e.g. from bookmarklet / share flow)
  useEffect(() => {
    if (isEditMode) return;
    if (!createPrefill) return;

    setTitle(createPrefill.title ?? "");
    setUrl(createPrefill.url ?? "");
    setDescription(createPrefill.description ?? "");
    setPlatform(
      createPrefill.platform ??
        (createPrefill.url ? detectPlatformFromUrl(createPrefill.url) : "")
    );
    setCategoryId(createPrefill.categoryId ?? "");
    setCategoryName(createPrefill.categoryName ?? "");
    setOpen(true);

    // let parent clear URL params/state
    onCreatePrefillConsumed?.();
  }, [isEditMode, createPrefill, onCreatePrefillConsumed]);

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

  /**
   * Resolve category by name, creating only if missing.
   * Always re-fetches categories first so we never create a duplicate after submit/blur races
   * (e.g. Enter submits the form before the name field's blur runs).
   */
  const findOrCreateCategory = async (rawName: string): Promise<string | null> => {
    const trimmed = rawName.trim();
    if (!trimmed || !user) return null;

    let list: Category[] = categories;
    try {
      const { categories: fresh } = await api.getCategories();
      if (fresh) list = fresh as Category[];
    } catch {
      // use prop list
    }

    const existing = list.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return existing.id;
    }

    try {
      const { category: newCategory } = await api.createCategory({
        name: trimmed,
        color: getRandomColor(),
      });

      if (!newCategory?.id) {
        throw new Error("Category creation returned no id");
      }

      if (onCategoriesChange) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        await onCategoriesChange();
      }

      toast({
        title: t("addLink.categoryCreated"),
        description: t("addLink.categoryCreatedDesc", { name: trimmed }),
      });

      return newCategory.id;
    } catch (error: unknown) {
      console.error("Error creating category:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: t("common.error"),
        description: t("addLink.categoryCreateFailed", { message }),
        variant: "destructive",
      });
      return null;
    }
  };

  /** Blur: only attach to an existing category by name — never create (avoids duplicate with form submit). */
  const syncCategoryNameToExisting = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    try {
      const { categories: fresh } = await api.getCategories();
      const list = (fresh ?? categories) as Category[];
      const hit = list.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (hit) {
        setCategoryId(hit.id);
        setCategoryName("");
      }
    } catch {
      const hit = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (hit) {
        setCategoryId(hit.id);
        setCategoryName("");
      }
    }
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
        title: t("addLink.noUrl"),
        description: t("addLink.enterUrlFirst"),
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({
        title: t("addLink.invalidUrl"),
        description: t("addLink.enterValidUrl"),
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
            const { categories: freshCategories } = await api.getCategories();
            
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
        title: t("common.success"),
        description: successMessage,
      });
    } catch (error) {
      console.error("Error fetching metadata:", error);
      toast({
        title: t("common.error"),
        description: t("addLink.metadataFailed"),
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
        title: t("addLink.missingFields"),
        description: t("addLink.fillTitleUrlPlatform"),
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: t("common.error"),
        description: t("addLink.mustBeLoggedIn"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    let submitUrl = url.trim();
    if (needsFacebookShareResolution(submitUrl)) {
      try {
        const { url: resolved } = await api.resolveFacebookShareUrl(submitUrl);
        if (resolved && resolved !== submitUrl) {
          submitUrl = resolved;
          setUrl(resolved);
        }
      } catch {
        /* keep original share URL */
      }
    }

    // If category name is provided but no category ID, create the category
    let finalCategoryId = categoryId;
    if (categoryName.trim() && !categoryId) {
      const newCategoryId = await findOrCreateCategory(categoryName.trim());
      if (newCategoryId) {
        finalCategoryId = newCategoryId;
      }
    }

    try {
      if (isEditMode && linkToEdit) {
        // Update existing link
        await api.updateLink(linkToEdit.id, {
          title,
          url: submitUrl,
          description,
          platform,
          categoryId: finalCategoryId || undefined,
        });

        toast({
          title: t("common.success"),
          description: t("addLink.linkUpdated"),
        });
      } else {
        // Create new link
        await api.createLink({
          title,
          url: submitUrl,
          description,
          platform,
          categoryId: finalCategoryId || undefined,
        });

        toast({
          title: t("common.success"),
          description: t("addLink.linkSaved"),
        });
      }

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : isEditMode ? t("addLink.updateFailed") : t("addLink.saveFailed");
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <Button className="rounded-full shadow-sm hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            {t("addLink.addLink")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("addLink.editLink") : t("addLink.addNewLink")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700">{t("addLink.title")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("addLink.titlePlaceholder")}
              className={formFieldClass}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-700">{t("addLink.url")}</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("addLink.urlPlaceholder")}
                required
                className={`flex-1 ${formFieldClass}`}
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
            <p className="text-xs text-gray-400">{t("addLink.urlHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-gray-700">{t("addLink.platform")}</Label>
            <Select value={platform} onValueChange={setPlatform} required>
              <SelectTrigger className={formFieldClass}>
                <SelectValue placeholder={t("addLink.selectPlatform")} />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(PLATFORM_I18N[p])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-700">{t("addLink.categoryOptional")}</Label>
            <div className="space-y-2">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className={formFieldClass}>
                  <SelectValue placeholder={t("addLink.selectCategory")} />
                </SelectTrigger>
                <SelectContent className="max-h-[min(60vh,320px)]">
                  {categoriesForSelect.map(({ category: cat, depth }) => (
                    <SelectItem key={cat.id} value={cat.id} className="pr-8">
                      <span
                        className="block truncate"
                        style={{ paddingLeft: depth * 14 }}
                        title={cat.name}
                      >
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder={t("addLink.newCategoryPlaceholder")}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className={formFieldClass}
                  onBlur={() => {
                    void syncCategoryNameToExisting();
                  }}
                />
              </div>
              <p className="text-xs text-gray-400">{t("addLink.categoryHint")}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">{t("addLink.descriptionOptional")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("addLink.descriptionPlaceholder")}
              className={formFieldClass}
              rows={3}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading
              ? isEditMode
                ? t("addLink.updating")
                : t("addLink.saving")
              : isEditMode
                ? t("addLink.updateLink")
                : t("addLink.saveLink")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
