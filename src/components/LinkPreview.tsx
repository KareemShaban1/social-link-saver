import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, Copy, Check, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface LinkPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  description?: string;
  platform: string;
}

// Check if platform typically allows iframe embedding
const canEmbedPlatform = (platform: string): boolean => {
  const platformLower = platform.toLowerCase();
  // Platforms that typically allow embedding
  const embeddablePlatforms = ['youtube', 'vimeo', 'other'];
  // Platforms that typically block embedding
  const blockedPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'pinterest'];
  
  if (blockedPlatforms.some(p => platformLower.includes(p))) {
    return false;
  }
  
  if (embeddablePlatforms.some(p => platformLower.includes(p))) {
    return true;
  }
  
  // Default: try to embed for unknown platforms
  return true;
};

export const LinkPreview = ({ open, onOpenChange, url, title, description, platform }: LinkPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const allowEmbed = canEmbedPlatform(platform);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="pr-4">{title}</span>
            <span className="text-sm font-normal text-muted-foreground shrink-0 px-2 py-1 bg-muted rounded">
              {platform}
            </span>
          </DialogTitle>
          {description && (
            <DialogDescription className="mt-3 text-base text-foreground/80">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Link Information Section */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-muted-foreground">Link URL:</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <p className="text-sm text-foreground flex-1 break-all font-mono">
                {url}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="shrink-0 h-8 w-8"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Conditional Preview Section */}
          {allowEmbed ? (
            <>
              {/* Info Alert for embeddable platforms */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Preview may not work if the website blocks embedding. Use "Open in New Tab" if the preview doesn't load.
                </AlertDescription>
              </Alert>

              {/* Link Preview iframe */}
              <div className="relative w-full rounded-lg overflow-hidden border bg-muted/30" style={{ minHeight: '500px', height: '60vh' }}>
                {!iframeError ? (
                  <iframe
                    src={url}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                    onError={() => setIframeError(true)}
                    onLoad={(e) => {
                      // Check if iframe loaded but content is blocked
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        if (iframe.contentWindow === null) {
                          setIframeError(true);
                        }
                      } catch (err) {
                        // Cross-origin error means content loaded but we can't access it
                        // This is normal, not an error
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      This website cannot be embedded in a preview due to security restrictions.
                    </p>
                    <Button asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Message for platforms that don't allow embedding */
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{platform}</strong> typically blocks iframe embedding for security reasons. 
                Please use the button below to view this content on the original website.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              View the full content on the original website
            </div>
            <Button variant="default" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

