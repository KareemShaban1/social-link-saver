import { Button } from "@/components/ui/button";
import { Check, Facebook, Instagram, Twitter, Linkedin, Youtube, Video, ImageIcon, Circle } from "lucide-react";

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
  // Sort platforms alphabetically
  const sortedPlatforms = [...platforms].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedPlatform === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectPlatform(null)}
        className={selectedPlatform === null ? "bg-primary" : ""}
      >
        {selectedPlatform === null && <Check className="h-3 w-3 mr-1" />}
        All Platforms
      </Button>
      {sortedPlatforms.map((platform) => (
        <Button
          key={platform}
          variant={selectedPlatform === platform ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectPlatform(platform)}
          className="flex items-center gap-2"
        >
          {selectedPlatform === platform && <Check className="h-3 w-3" />}
          {getPlatformIcon(platform)}
          <span>{platform}</span>
        </Button>
      ))}
    </div>
  );
};





