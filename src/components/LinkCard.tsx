import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Pencil, Facebook, Instagram, Twitter, Linkedin, Youtube, Video, ImageIcon, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
}

interface LinkCardProps {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform: string;
  category?: {
    name: string;
    color: string;
  };
  categories: Category[];
  onDelete: () => void;
  onEdit?: (link: {
    id: string;
    title: string;
    url: string;
    description?: string;
    platform: string;
    category_id?: string;
  }) => void;
}

const getPlatformIcon = (platform: string) => {
  const iconClass = "h-5 w-5";
  switch (platform.toLowerCase()) {
    case "facebook":
      return <Facebook className={iconClass} />;
    case "instagram":
      return <Instagram className={iconClass} />;
    case "twitter":
      return <Twitter className={iconClass} />;
    case "linkedin":
      return <Linkedin className={iconClass} />;
    case "youtube":
      return <Youtube className={iconClass} />;
    case "tiktok":
      return <Video className={iconClass} />;
    case "pinterest":
      return <ImageIcon className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
};

export const LinkCard = ({ id, title, url, description, platform, category, categories, onDelete, onEdit }: LinkCardProps) => {
  const { toast } = useToast();

  const getCategoryDisplay = () => {
    if (!category) return null;
    
    // Find the category in the full list to check if it has a parent
    const fullCategory = categories.find(c => c.name === category.name);
    if (fullCategory && fullCategory.parent_id) {
      const parent = categories.find(c => c.id === fullCategory.parent_id);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    return category.name;
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("links").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Link removed successfully",
    });
    onDelete();
  };

  const handleEdit = () => {
    if (onEdit) {
      const categoryId = categories.find(c => c.name === category?.name)?.id;
      onEdit({
        id,
        title,
        url,
        description,
        platform,
        category_id: categoryId,
      });
    }
  };

  return (
    <Card className="p-5 shadow-card hover:shadow-md transition-all duration-300 bg-gradient-card border-border/50 animate-fade-in group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            {getPlatformIcon(platform)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-lg mb-1 truncate">{title}</h3>
            <p className="text-sm text-muted-foreground truncate">{platform}</p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center justify-between gap-3 mt-4">
        {category && (
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${category.color}15`,
              color: category.color,
            }}
          >
            {getCategoryDisplay()}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="ml-auto text-primary hover:text-primary hover:bg-primary/10"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit
          </a>
        </Button>
      </div>
    </Card>
  );
};
