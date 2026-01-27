import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Pencil, Facebook, Instagram, Twitter, Linkedin, Youtube, Video, ImageIcon, Circle, Play, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { detectVideoUrl } from "@/lib/videoUtils";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LinkPreview } from "@/components/LinkPreview";

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

// Get platform brand color
const getPlatformColor = (platform: string): { bg: string; bgGradient?: string; icon: string } => {
	const platformLower = platform.toLowerCase();

	switch (platformLower) {
		case "facebook":
			return { bg: "#1877F215", icon: "#1877F2" }; // Facebook blue
		case "instagram":
			return {
				bg: "#E4405F15",
				bgGradient: "linear-gradient(135deg, rgba(131, 58, 180, 0.1) 0%, rgba(253, 29, 29, 0.1) 50%, rgba(252, 176, 69, 0.1) 100%)",
				icon: "#E4405F"
			}; // Instagram gradient
		case "twitter":
		case "x":
			return { bg: "#00000015", icon: "#000000" }; // Twitter/X black
		case "linkedin":
			return { bg: "#0A66C215", icon: "#0A66C2" }; // LinkedIn blue
		case "youtube":
			return { bg: "#FF000015", icon: "#FF0000" }; // YouTube red
		case "tiktok":
			return { bg: "#00000015", icon: "#000000" }; // TikTok black
		case "pinterest":
			return { bg: "#BD081C15", icon: "#BD081C" }; // Pinterest red
		case "reddit":
			return { bg: "#FF450015", icon: "#FF4500" }; // Reddit orange
		default:
			return { bg: "hsl(var(--primary) / 0.1)", icon: "hsl(var(--primary))" }; // Default primary color
	}
};

const getPlatformIcon = (platform: string) => {
  const iconClass = "h-5 w-5";
  switch (platform.toLowerCase()) {
    case "facebook":
      return <Facebook className={iconClass} />;
    case "instagram":
      return <Instagram className={iconClass} />;
    case "twitter":
	  case "x":
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
	const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
	const [linkPreviewOpen, setLinkPreviewOpen] = useState(false);
	const videoInfo = detectVideoUrl(url, platform);

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
    try {
      await api.deleteLink(id);
      toast({
        title: "Deleted",
        description: "Link removed successfully",
      });
      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete link",
        variant: "destructive",
      });
    }
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
				  <div
					  className="p-2.5 rounded-lg shrink-0 transition-all duration-200 group-hover:scale-105"
					  style={{
						  background: getPlatformColor(platform).bgGradient || getPlatformColor(platform).bg,
					  }}
				  >
					  <div style={{ color: getPlatformColor(platform).icon }}>
						  {getPlatformIcon(platform)}
					  </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-lg mb-1 truncate">{title}</h3>
            <p className="text-sm text-muted-foreground truncate">{platform}</p>
          </div>
        </div>
        {/* Always visible on touch/mobile; hover-reveal on desktop */}
        <div className="flex gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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

      <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
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
			  <div className="flex gap-2 ml-auto flex-wrap justify-end">
				  {videoInfo.isVideo && (
					  <Button
						  variant="default"
						  size="sm"
						  onClick={() => setVideoPlayerOpen(true)}
						  className="text-white hover:bg-primary/90"
					  >
						  <Play className="h-4 w-4 mr-2" />
						  Watch
					  </Button>
				  )}
				  <Button
					  variant="outline"
					  size="sm"
					  onClick={() => setLinkPreviewOpen(true)}
					  className="hover:bg-accent"
				  >
					  <Eye className="h-4 w-4 mr-2" />
					  Show
				  </Button>
				  <Button
					  variant="ghost"
					  size="sm"
					  asChild
					  className="text-primary hover:text-primary hover:bg-primary/10"
				  >
					  <a href={url} target="_blank" rel="noopener noreferrer">
						  <ExternalLink className="h-4 w-4 mr-2" />
						  Visit
					  </a>
				  </Button>
			  </div>
		  </div>

		  {/* Video Player Modal */}
		  {videoInfo.isVideo && (
			  <VideoPlayer
				  open={videoPlayerOpen}
				  onOpenChange={setVideoPlayerOpen}
				  videoInfo={videoInfo}
				  url={url}
				  title={title}
			  />
		  )}

		  {/* Link Preview Modal */}
		  <LinkPreview
			  open={linkPreviewOpen}
			  onOpenChange={setLinkPreviewOpen}
			  url={url}
			  title={title}
			  description={description}
			  platform={platform}
		  />
    </Card>
  );
};
