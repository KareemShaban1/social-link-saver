import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Trash2,
  Pencil,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Video,
  ImageIcon,
  Circle,
  Play,
  Eye,
  MoreVertical,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { useEffect, useMemo, useState } from "react";
import { detectVideoUrl, needsFacebookShareResolution } from "@/lib/videoUtils";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LinkPreview } from "@/components/LinkPreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getTextDirection } from "@/lib/utils";

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
  isFavorite?: boolean;
  category?: {
    name: string;
    color: string;
  };
  categories: Category[];
  onDelete: () => void;
  onFavoriteChange?: (id: string, isFavorite: boolean) => void;
  onEdit?: (link: {
    id: string;
    title: string;
    url: string;
    description?: string;
    platform: string;
    category_id?: string;
    isFavorite?: boolean;
  }) => void;
}

const getPlatformColor = (platform: string): { bg: string; bgGradient?: string; icon: string } => {
  const platformLower = platform.toLowerCase();

  switch (platformLower) {
    case "facebook":
      return { bg: "#1877F215", icon: "#1877F2" };
    case "instagram":
      return {
        bg: "#E4405F15",
        bgGradient:
          "linear-gradient(135deg, rgba(131, 58, 180, 0.1) 0%, rgba(253, 29, 29, 0.1) 50%, rgba(252, 176, 69, 0.1) 100%)",
        icon: "#E4405F",
      };
    case "twitter":
    case "x":
      return { bg: "#00000015", icon: "#000000" };
    case "linkedin":
      return { bg: "#0A66C215", icon: "#0A66C2" };
    case "youtube":
      return { bg: "#FF000015", icon: "#FF0000" };
    case "tiktok":
      return { bg: "#00000015", icon: "#000000" };
    case "pinterest":
      return { bg: "#BD081C15", icon: "#BD081C" };
    case "reddit":
      return { bg: "#FF450015", icon: "#FF4500" };
    default:
      return { bg: "hsl(var(--primary) / 0.1)", icon: "hsl(var(--primary))" };
  }
};

const getPlatformIcon = (platform: string, className: string) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return <Facebook className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "twitter":
    case "x":
      return <Twitter className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "tiktok":
      return <Video className={className} />;
    case "pinterest":
      return <ImageIcon className={className} />;
    default:
      return <Circle className={className} />;
  }
};

function safeHostname(linkUrl: string): string | null {
  try {
    return new URL(linkUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const LinkCard = ({
  id,
  title,
  url,
  description,
  platform,
  isFavorite = false,
  category,
  categories,
  onDelete,
  onFavoriteChange,
  onEdit,
}: LinkCardProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [linkPreviewOpen, setLinkPreviewOpen] = useState(false);
  const [effectiveUrl, setEffectiveUrl] = useState(url);
  const [favorite, setFavorite] = useState(isFavorite);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  useEffect(() => {
    setEffectiveUrl(url);
    if (!needsFacebookShareResolution(url)) return;
    let cancelled = false;
    void (async () => {
      try {
        const { url: resolved } = await api.resolveFacebookShareUrl(url);
        if (!cancelled && typeof resolved === "string" && resolved.length > 0) {
          setEffectiveUrl(resolved);
        }
      } catch {
        /* keep stored url */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const videoInfo = useMemo(() => detectVideoUrl(effectiveUrl, platform), [effectiveUrl, platform]);
  const platformTheme = useMemo(() => getPlatformColor(platform), [platform]);
  const hostname = useMemo(() => safeHostname(effectiveUrl), [effectiveUrl]);
  const titleDirection = useMemo(() => getTextDirection(title), [title]);
  const descriptionDirection = useMemo(
    () => (description ? getTextDirection(description) : "ltr"),
    [description],
  );

  const getCategoryDisplay = () => {
    if (!category) return null;

    const fullCategory = categories.find((c) => c.name === category.name);
    if (fullCategory && fullCategory.parent_id) {
      const parent = categories.find((c) => c.id === fullCategory.parent_id);
      return parent ? `${parent.name} › ${category.name}` : category.name;
    }
    return category.name;
  };

  const handleDelete = async () => {
    try {
      await api.deleteLink(id);
      toast({
        title: t("linkCard.deleted"),
        description: t("linkCard.deletedDesc"),
      });
      onDelete();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("linkCard.deleteFailed");
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      const categoryId = categories.find((c) => c.name === category?.name)?.id;
      onEdit({
        id,
        title,
        url,
        description,
        platform,
        category_id: categoryId,
        isFavorite: favorite,
      });
    }
  };

  const handleToggleFavorite = async () => {
    const next = !favorite;
    setTogglingFavorite(true);
    try {
      const { link } = await api.toggleLinkFavorite(id, next);
      const saved = Boolean(link.isFavorite);
      setFavorite(saved);
      toast({
        title: saved ? t("linkCard.favoriteAdded") : t("linkCard.favoriteRemoved"),
      });
      onFavoriteChange?.(id, saved);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("linkCard.favoriteFailed");
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setTogglingFavorite(false);
    }
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
        "sm:p-5"
      )}
    >
      {/* Header: title block + secondary actions */}
      <div className="flex gap-2 sm:gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.02] sm:h-12 sm:w-12"
          style={{
            background: platformTheme.bgGradient || platformTheme.bg,
          }}
          aria-label={hostname ? `${platform}, ${hostname}` : platform}
        >
          <div style={{ color: platformTheme.icon }} aria-hidden>
            {getPlatformIcon(platform, "h-5 w-5 sm:h-[22px] sm:w-[22px]")}
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
             
              {/* sm+: platform name + hostname; below sm only the icon tile (left) indicates platform */}
              <div className="mt-1 hidden flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground sm:flex sm:text-xs">
                <span className="font-medium uppercase tracking-wide text-foreground/80">{platform}</span>
                {hostname && (
                  <>
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                    <span className="max-w-[200px] truncate md:max-w-[260px]" title={hostname}>
                      {hostname}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 sm:h-9 sm:w-9",
                  favorite
                    ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                    : "text-muted-foreground hover:bg-accent hover:text-amber-500",
                )}
                aria-label={favorite ? t("linkCard.removeFavorite") : t("linkCard.addFavorite")}
                disabled={togglingFavorite}
                onClick={() => {
                  void handleToggleFavorite();
                }}
              >
                <Star className={cn("h-4 w-4", favorite && "fill-current")} />
              </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:h-9 sm:w-9"
                  aria-label="Link actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {t("linkCard.openNewTab")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    window.setTimeout(() => setLinkPreviewOpen(true), 0);
                  }}
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  {t("linkCard.preview")}
                </DropdownMenuItem>
                {videoInfo.isVideo && (
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      window.setTimeout(() => setVideoPlayerOpen(true), 0);
                    }}
                  >
                    <Play className="h-4 w-4 shrink-0" />
                    {t("linkCard.watchVideo")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={() => {
                      handleEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    {t("linkCard.edit")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => {
                    void handleDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  {t("linkCard.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <h3
          dir={titleDirection}
          className={cn(
            "line-clamp-2 text-[12px] font-semibold leading-snug text-black sm:text-lg sm:leading-tight",
            titleDirection === "rtl" ? "text-right" : "text-left",
          )}
        >
          {title}
        </h3>
      </div>

      {description && (
        <p
          dir={descriptionDirection}
          className={cn(
            "mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:line-clamp-3 sm:text-sm",
            descriptionDirection === "rtl" ? "text-right" : "text-left",
          )}
        >
          {description}
        </p>
      )}

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 sm:mt-4">
        {category && (
          <span
            className="inline-flex max-w-full items-center self-start truncate rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs"
            style={{
              backgroundColor: `${category.color}18`,
              color: category.color,
              border: `1px solid ${category.color}35`,
            }}
            title={getCategoryDisplay() ?? category.name}
          >
            <span className="truncate">{getCategoryDisplay()}</span>
          </span>
        )}
        {videoInfo.isVideo && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 w-full gap-2 touch-manipulation sm:h-8 sm:w-auto sm:self-start"
            onClick={() => setVideoPlayerOpen(true)}
          >
            <Play className="h-4 w-4 shrink-0" aria-hidden />
            {t("linkCard.watchVideo")}
          </Button>
        )}
      </div>

      {videoInfo.isVideo && (
        <VideoPlayer
          open={videoPlayerOpen}
          onOpenChange={setVideoPlayerOpen}
          videoInfo={videoInfo}
          url={effectiveUrl}
          title={title}
        />
      )}

      <LinkPreview
        open={linkPreviewOpen}
        onOpenChange={setLinkPreviewOpen}
        url={effectiveUrl}
        title={title}
        description={description}
        platform={platform}
      />
    </Card>
  );
};
