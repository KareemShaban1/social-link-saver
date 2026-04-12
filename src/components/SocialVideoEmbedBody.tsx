import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";
import { VideoInfo, getVideoPlatformName } from "@/lib/videoUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/**
 * Radix Dialog + `overflow-hidden` ancestors can steal hit-testing for nested iframes (Facebook / IG / etc.).
 * Promote the embed to its own composited layer and keep touch events on the player.
 */
function InteractiveEmbedSurface({ children }: { children: ReactNode }) {
	return (
		<div className="relative z-[2] isolate touch-auto [transform:translateZ(0)]">{children}</div>
	);
}

export interface SocialVideoEmbedBodyProps {
	videoInfo: VideoInfo;
	url: string;
	title: string;
}

const embedStackClass =
	"w-full min-h-[min(55vh,420px)] max-h-[min(72vh,560px)] sm:min-h-[480px] sm:max-h-none md:min-h-[500px]";

const tiktokEmbedClass =
	"w-full min-h-[min(60vh,520px)] max-h-[min(78vh,640px)] sm:min-h-[560px] sm:max-h-none md:min-h-[600px]";

const tallSocialEmbedClass =
	"w-full min-h-[min(52vh,440px)] max-h-[min(80vh,720px)] sm:min-h-[520px] sm:max-h-[680px] md:min-h-[560px]";

/**
 * Shared embed UI for known social URLs (used by VideoPlayer and LinkPreview).
 */
export function SocialVideoEmbedBody({ videoInfo, url, title }: SocialVideoEmbedBodyProps) {
	const platformName = getVideoPlatformName(videoInfo.platform);
	const src = videoInfo.embedUrl ?? videoInfo.previewEmbedUrl;

	if (!src) {
		return (
			<div className="flex min-h-[min(40vh,240px)] max-h-[50vh] flex-col items-center justify-center p-4 text-center sm:h-[400px] sm:max-h-none sm:p-8">
				<p className="mb-4 max-w-md text-sm text-muted-foreground sm:text-base">
					No embed is available for this link. Open it on {platformName} to view.
				</p>
				<Button asChild className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto">
					<a href={url} target="_blank" rel="noopener noreferrer">
						<ExternalLink className="mr-2 h-4 w-4" />
						Open {platformName}
					</a>
				</Button>
			</div>
		);
	}

	if (videoInfo.platform === "facebook") {
		return (
			<div className="flex min-h-0 flex-col items-stretch space-y-2">
				<Alert className="w-full py-2">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<AlertDescription className="text-xs leading-snug sm:text-sm">
						Reels and videos use Facebook&apos;s embed player below. It may ask you to sign in or stay blank if this browser
						blocks third-party cookies — then use <span className="font-medium">Open original</span> /{" "}
						<span className="font-medium">Open in new tab</span>.
					</AlertDescription>
				</Alert>
				{/* No sandbox: Facebook video.php often fails inside a strict sandbox; src is only our video.php URL. */}
				<InteractiveEmbedSurface>
					<iframe
						src={src}
						className={cn("pointer-events-auto shrink-0 rounded-lg border-0", embedStackClass)}
						allow="autoplay; clipboard-write; encrypted-media; web-share; picture-in-picture"
						allowFullScreen
						title={title}
					/>
				</InteractiveEmbedSurface>
			</div>
		);
	}

	if (videoInfo.platform === "instagram") {
		return (
			<div className="flex min-h-0 flex-col items-stretch justify-center space-y-3 sm:space-y-4">
				<Alert className="w-full py-2">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<AlertDescription className="text-xs leading-snug sm:text-sm">
						Instagram embeds may not load because of privacy or login rules. If it stays blank, use{" "}
						<span className="font-medium">Open in new tab</span>.
					</AlertDescription>
				</Alert>
				<InteractiveEmbedSurface>
					<iframe
						src={src}
						className={cn("pointer-events-auto shrink-0 rounded-lg border-0", embedStackClass)}
						allow="encrypted-media"
						title={title}
						scrolling="no"
						sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					/>
				</InteractiveEmbedSurface>
			</div>
		);
	}

	if (videoInfo.platform === "tiktok") {
		return (
			<div className="flex min-h-0 flex-col items-stretch">
				<iframe
					src={src}
					className={cn("shrink-0 rounded-lg border-0", tiktokEmbedClass)}
					allow="encrypted-media"
					title={title}
					sandbox="allow-scripts allow-same-origin allow-popups"
				/>
				<p className="mt-2 text-center text-[11px] text-muted-foreground sm:text-xs">
					If the video does not load, open the original TikTok link below.
				</p>
			</div>
		);
	}

	if (videoInfo.platform === "twitter") {
		return (
			<div className="flex min-h-0 flex-col items-stretch space-y-2">
				<Alert className="w-full py-2">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<AlertDescription className="text-xs leading-snug sm:text-sm">
						X may block embeds unless you allow cookies or are signed in. Video in posts appears inside the card when
						embedding works.
					</AlertDescription>
				</Alert>
				<InteractiveEmbedSurface>
					<iframe
						src={src}
						className={cn("pointer-events-auto shrink-0 rounded-lg border-0", tallSocialEmbedClass)}
						title={title}
						sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					/>
				</InteractiveEmbedSurface>
			</div>
		);
	}

	if (videoInfo.platform === "linkedin") {
		return (
			<div className="flex min-h-0 flex-col items-stretch space-y-2">
				<Alert className="w-full py-2">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<AlertDescription className="text-xs leading-snug sm:text-sm">
						LinkedIn embeds often require signing in. If the frame is empty, open the post on LinkedIn.
					</AlertDescription>
				</Alert>
				<iframe
					src={src}
					className={cn("shrink-0 rounded-lg border-0", tallSocialEmbedClass)}
					title={title}
					sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				/>
			</div>
		);
	}

	if (videoInfo.platform === "pinterest") {
		return (
			<div className="flex min-h-0 flex-col items-stretch space-y-2">
				<Alert className="w-full py-2">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<AlertDescription className="text-xs leading-snug sm:text-sm">
						Pinterest pins (including video pins) load in the embed below when Pinterest allows it.
					</AlertDescription>
				</Alert>
				<InteractiveEmbedSurface>
					<iframe
						src={src}
						className={cn("pointer-events-auto shrink-0 rounded-lg border-0", tallSocialEmbedClass)}
						title={title}
						sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					/>
				</InteractiveEmbedSurface>
			</div>
		);
	}

	return (
		<div className="relative z-[2] isolate aspect-video w-full max-h-[55dvh] touch-auto overflow-hidden rounded-lg bg-black [transform:translateZ(0)] sm:max-h-none">
			<iframe
				src={src}
				className="pointer-events-auto absolute left-0 top-0 h-full w-full border-0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowFullScreen
				title={title}
			/>
		</div>
	);
}
