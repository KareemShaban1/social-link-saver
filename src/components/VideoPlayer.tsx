import { Dialog, DialogEmbedContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { VideoInfo, getVideoPlatformName } from "@/lib/videoUtils";
import { cn } from "@/lib/utils";
import { SocialVideoEmbedBody } from "@/components/SocialVideoEmbedBody";
import { useTranslation } from "@/contexts/LanguageContext";

interface VideoPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoInfo: VideoInfo;
  url: string;
  title: string;
}

export const VideoPlayer = ({ open, onOpenChange, videoInfo, url, title }: VideoPlayerProps) => {
  const { t } = useTranslation();
  const platformName = getVideoPlatformName(videoInfo.platform);

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogEmbedContent
        className={cn(
          "flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 min-h-0 overflow-x-hidden p-0",
          "left-0 top-0 translate-x-0 translate-y-0 rounded-none border-0 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:border-gray-100",
          "pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-0"
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 px-4 pb-3 pe-14 pt-2 sm:px-6 sm:pb-4 sm:pe-6 sm:pt-6">
          <DialogTitle className="flex flex-col items-start gap-1 text-start text-base leading-tight sm:flex-row sm:items-center sm:justify-between sm:text-lg">
            <span className="line-clamp-2 pe-1">{title}</span>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 sm:text-sm">
              {platformName}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
          )}
        >
          <div className="min-h-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-2 sm:p-3">
            <SocialVideoEmbedBody videoInfo={videoInfo} url={url} title={title} />
          </div>
          <div className="mt-4 flex shrink-0 flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 flex-1 break-all text-xs text-gray-500 sm:text-sm">{url}</p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="min-h-11 w-full shrink-0 rounded-full border-gray-200 touch-manipulation sm:min-h-9 sm:w-auto"
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                {t("videoPlayer.openOriginal")}
              </a>
            </Button>
          </div>
        </div>
      </DialogEmbedContent>
    </Dialog>
  );
};
