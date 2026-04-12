import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { VideoInfo, getVideoPlatformName } from "@/lib/videoUtils";
import { cn } from "@/lib/utils";
import { SocialVideoEmbedBody } from "@/components/SocialVideoEmbedBody";

interface VideoPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoInfo: VideoInfo;
  url: string;
  title: string;
}

export const VideoPlayer = ({ open, onOpenChange, videoInfo, url, title }: VideoPlayerProps) => {
  const platformName = getVideoPlatformName(videoInfo.platform);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden p-0",
          "left-0 top-0 translate-x-0 translate-y-0 rounded-none border-0 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border",
          "pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-0"
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 px-4 pb-3 pr-14 pt-2 sm:px-6 sm:pb-4 sm:pr-6 sm:pt-6">
          <DialogTitle className="flex flex-col items-start gap-1 text-left text-base leading-tight sm:flex-row sm:items-center sm:justify-between sm:text-lg">
            <span className="line-clamp-2 pr-1">{title}</span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground sm:text-sm">{platformName}</span>
          </DialogTitle>
        </DialogHeader>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
          )}
        >
          <div className="min-h-0 flex-1">
            <SocialVideoEmbedBody videoInfo={videoInfo} url={url} title={title} />
          </div>
          <div className="mt-4 flex shrink-0 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 flex-1 break-all text-xs text-muted-foreground sm:text-sm">{url}</p>
            <Button variant="outline" size="sm" asChild className="min-h-11 w-full shrink-0 touch-manipulation sm:min-h-9 sm:w-auto">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open original
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
