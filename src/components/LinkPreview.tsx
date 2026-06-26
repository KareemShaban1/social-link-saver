import { Dialog, DialogEmbedContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, Copy, Check, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { detectVideoUrl } from "@/lib/videoUtils";
import { SocialVideoEmbedBody } from "@/components/SocialVideoEmbedBody";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface LinkPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  description?: string;
  platform: string;
}

const prefersGenericIframe = (platform: string): boolean => {
  const p = platform.toLowerCase();
  const ok = ["youtube", "vimeo", "other"];
  if (ok.some((x) => p.includes(x))) return true;
  const social = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "pinterest"];
  if (social.some((x) => p.includes(x))) return false;
  return true;
};

export const LinkPreview = ({ open, onOpenChange, url, title, description, platform }: LinkPreviewProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const videoInfo = useMemo(() => detectVideoUrl(url, platform), [url, platform]);
  const useSocialEmbed = videoInfo.isVideo || Boolean(videoInfo.previewEmbedUrl);
  const allowGenericIframe = prefersGenericIframe(platform);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogEmbedContent
        className={cn(
          "flex max-h-[min(92dvh,900px)] w-full max-w-4xl flex-col gap-0 min-h-0 overflow-x-hidden p-0 sm:max-h-[90vh]",
          "pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-6"
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 px-4 pb-2 pe-14 pt-2 sm:px-6 sm:pb-2 sm:pe-6">
          <DialogTitle className="flex flex-col items-start gap-1 text-start text-base sm:flex-row sm:items-start sm:justify-between sm:text-lg">
            <span className="line-clamp-2 pe-1">{title}</span>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 sm:text-sm">
              {platform}
            </span>
          </DialogTitle>
          {description && (
            <DialogDescription className="text-start text-sm text-gray-600 sm:text-base">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6">
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">{t("linkPreview.linkUrl")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
              <p className="flex-1 break-all font-mono text-sm text-gray-900">{url}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8 shrink-0"
                title={t("common.copyUrl")}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {useSocialEmbed ? (
            <>
              <Alert className="rounded-xl border-indigo-100 bg-indigo-50/50">
                <AlertCircle className="h-4 w-4 text-indigo-600" />
                <AlertDescription className="text-gray-600">{t("linkPreview.socialEmbedNotice")}</AlertDescription>
              </Alert>
              <div
                className={cn(
                  "relative w-full rounded-2xl border border-gray-100 bg-gray-50",
                  "min-h-[min(45vh,320px)] sm:min-h-[360px]"
                )}
              >
                <div className="p-2 sm:p-3">
                  <SocialVideoEmbedBody videoInfo={videoInfo} url={url} title={title} />
                </div>
              </div>
            </>
          ) : allowGenericIframe ? (
            <>
              <Alert className="rounded-xl border-gray-100 bg-gray-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-gray-600">{t("linkPreview.genericIframeNotice")}</AlertDescription>
              </Alert>
              <div className="relative min-h-[min(50vh,400px)] w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 sm:h-[60vh] sm:min-h-[500px]">
                {!iframeError ? (
                  <iframe
                    src={url}
                    className="absolute left-0 top-0 h-full w-full border-0"
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                    onError={() => setIframeError(true)}
                    onLoad={(e) => {
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        if (iframe.contentWindow === null) {
                          setIframeError(true);
                        }
                      } catch {
                        // cross-origin: normal
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
                    <p className="mb-4 text-gray-500">{t("linkPreview.cannotEmbedHere")}</p>
                    <Button asChild className="rounded-full">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="me-2 h-4 w-4" />
                        {t("linkPreview.openInNewTab")}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("linkPreview.noStablePreview", { platform })}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">{t("linkPreview.fullExperienceOriginal")}</div>
            <Button variant="default" size="sm" className="min-h-10 w-full rounded-full touch-manipulation sm:min-h-9 sm:w-auto" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                {t("linkPreview.openInNewTab")}
              </a>
            </Button>
          </div>
        </div>
      </DialogEmbedContent>
    </Dialog>
  );
};
