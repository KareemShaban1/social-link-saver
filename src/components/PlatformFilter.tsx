import { Button } from "@/components/ui/button";
import { Check, Facebook, Instagram, Twitter, Linkedin, Youtube, Video, ImageIcon, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface PlatformFilterProps {
  platforms: string[];
  selectedPlatform: string | null;
  onSelectPlatform: (platform: string | null) => void;
}

const getPlatformIcon = (platform: string) => {
  const iconClass = "h-4 w-4";
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

export const PlatformFilter = ({ platforms, selectedPlatform, onSelectPlatform }: PlatformFilterProps) => {
  const { t } = useTranslation();
  const sortedPlatforms = [...platforms].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedPlatform === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectPlatform(null)}
        className={cn(
          "rounded-full",
          selectedPlatform === null && "bg-primary hover:bg-primary/90",
        )}
      >
        {selectedPlatform === null && <Check className="me-1 h-3 w-3" />}
        {t("platforms.allPlatforms")}
      </Button>
      {sortedPlatforms.map((platform) => (
        <Button
          key={platform}
          variant={selectedPlatform === platform ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectPlatform(platform)}
          className={cn(
            "flex items-center gap-2 rounded-full",
            selectedPlatform === platform && "bg-primary hover:bg-primary/90",
          )}
        >
          {selectedPlatform === platform && <Check className="h-3 w-3" />}
          {getPlatformIcon(platform)}
          <span>{platform}</span>
        </Button>
      ))}
    </div>
  );
};
