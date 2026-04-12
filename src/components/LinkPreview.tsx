import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, Copy, Check, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { detectVideoUrl } from "@/lib/videoUtils";
import { SocialVideoEmbedBody } from "@/components/SocialVideoEmbedBody";
import { cn } from "@/lib/utils";

interface LinkPreviewProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	url: string;
	title: string;
	description?: string;
	platform: string;
}

/** Platforms where loading the raw URL in an iframe usually fails (X-Frame-Options / CSP). */
const prefersGenericIframe = (platform: string): boolean => {
	const p = platform.toLowerCase();
	const ok = ["youtube", "vimeo", "other"];
	if (ok.some((x) => p.includes(x))) return true;
	const social = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "pinterest"];
	if (social.some((x) => p.includes(x))) return false;
	return true;
};

export const LinkPreview = ({ open, onOpenChange, url, title, description, platform }: LinkPreviewProps) => {
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"flex max-h-[min(92dvh,900px)] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh]",
					"pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-6"
				)}
			>
				<DialogHeader className="shrink-0 space-y-2 px-4 pb-2 pr-14 pt-2 sm:px-6 sm:pb-2 sm:pr-6">
					<DialogTitle className="flex flex-col items-start gap-1 text-left text-base sm:flex-row sm:items-start sm:justify-between sm:text-lg">
						<span className="line-clamp-2 pr-1">{title}</span>
						<span className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-normal text-muted-foreground sm:text-sm">
							{platform}
						</span>
					</DialogTitle>
					{description && (
						<DialogDescription className="text-left text-sm text-foreground/80 sm:text-base">{description}</DialogDescription>
					)}
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6">
					<div className="space-y-3 rounded-lg border bg-muted/30 p-4">
						<div className="flex items-center gap-2">
							<Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span className="text-sm font-medium text-muted-foreground">Link URL</span>
						</div>
						<div className="flex items-center gap-2 rounded border bg-background p-2">
							<p className="flex-1 break-all font-mono text-sm text-foreground">{url}</p>
							<Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 shrink-0" title="Copy URL">
								{copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
							</Button>
						</div>
					</div>

					{useSocialEmbed ? (
						<>
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Embedded preview for this network. If it does not load, use <span className="font-medium">Open in new tab</span>{" "}
									— many sites restrict playback outside their app.
								</AlertDescription>
							</Alert>
							<div
								className={cn(
									"relative w-full overflow-hidden rounded-lg border bg-muted/30",
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
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Preview may not work if the site blocks embedding. Use &quot;Open in new tab&quot; if the preview stays blank.
								</AlertDescription>
							</Alert>
							<div className="relative min-h-[min(50vh,400px)] w-full overflow-hidden rounded-lg border bg-muted/30 sm:h-[60vh] sm:min-h-[500px]">
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
										<AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
										<p className="mb-4 text-muted-foreground">This page cannot be embedded here.</p>
										<Button asChild>
											<a href={url} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="mr-2 h-4 w-4" />
												Open in new tab
											</a>
										</Button>
									</div>
								)}
							</div>
						</>
					) : (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								<strong>{platform}</strong> does not expose a stable preview for this link (or it is not a reel, pin, post, or
								video URL we recognize). Open the original site to view it.
							</AlertDescription>
						</Alert>
					)}

					<div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-xs text-muted-foreground">Full experience is always on the original site.</div>
						<Button variant="default" size="sm" className="min-h-10 w-full touch-manipulation sm:min-h-9 sm:w-auto" asChild>
							<a href={url} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="mr-2 h-4 w-4" />
								Open in new tab
							</a>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
