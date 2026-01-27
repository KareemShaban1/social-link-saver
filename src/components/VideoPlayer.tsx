import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";
import { VideoInfo, getVideoPlatformName } from "@/lib/videoUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoPlayerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	videoInfo: VideoInfo;
	url: string;
	title: string;
}

export const VideoPlayer = ({ open, onOpenChange, videoInfo, url, title }: VideoPlayerProps) => {
	const platformName = getVideoPlatformName(videoInfo.platform);

	// Some platforms require special handling
	const getEmbedContent = () => {
		if (!videoInfo.embedUrl) {
			return (
				<div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
					<p className="text-muted-foreground mb-4">
						Unable to embed this {platformName}. Please visit the link to watch.
					</p>
					<Button asChild>
						<a href={url} target="_blank" rel="noopener noreferrer">
							<ExternalLink className="h-4 w-4 mr-2" />
							Open {platformName}
						</a>
					</Button>
				</div>
			);
		}

		// Instagram - Instagram embeds are often restricted
		if (videoInfo.platform === 'instagram') {
			return (
				<div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
					<Alert className="w-full">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Instagram embeds may not work due to privacy settings. If the video doesn't load below, please use the "Open Original" button.
						</AlertDescription>
					</Alert>
					<iframe
						src={videoInfo.embedUrl}
						className="w-full min-h-[500px] border-0 rounded-lg"
						allow="encrypted-media"
						title={title}
						scrolling="no"
						sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					/>
				</div>
			);
		}

		// TikTok - TikTok embeds can be tricky
		if (videoInfo.platform === 'tiktok') {
			return (
				<div className="flex flex-col items-center justify-center min-h-[600px]">
					<iframe
						src={videoInfo.embedUrl}
						className="w-full min-h-[600px] border-0 rounded-lg"
						allow="encrypted-media"
						title={title}
						sandbox="allow-scripts allow-same-origin allow-popups"
					/>
					<p className="text-xs text-muted-foreground mt-2">
						If the video doesn't load, please visit the original TikTok link.
					</p>
				</div>
			);
		}

		// Facebook videos and reels - Facebook embeds are very restricted
		// Most Facebook videos cannot be embedded due to privacy/embedding restrictions
		if (videoInfo.platform === 'facebook') {
			return (
				<div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 space-y-6">
					<Alert variant="destructive" className="w-full max-w-md">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription className="text-left">
							<strong>Facebook videos cannot be embedded here.</strong>
							<br />
							<br />
							Facebook restricts video embedding due to privacy settings. Most videos can only be viewed directly on Facebook's website.
						</AlertDescription>
					</Alert>

					<div className="flex flex-col items-center space-y-4">
						<p className="text-muted-foreground max-w-md">
							Click the button below to open and watch this video on Facebook in a new tab.
						</p>
						<Button size="lg" asChild className="w-full sm:w-auto">
							<a href={url} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="h-4 w-4 mr-2" />
								Watch on Facebook
							</a>
						</Button>
					</div>
				</div>
			);
		}

		// YouTube and Vimeo - standard embed (most reliable)
		return (
			<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
				<iframe
					src={videoInfo.embedUrl}
					className="absolute top-0 left-0 w-full h-full border-0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowFullScreen
					title={title}
					onError={(e) => {
						console.error('Video embed error:', e);
					}}
				/>
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl w-full p-0">
				<DialogHeader className="px-6 pt-6 pb-4">
					<DialogTitle className="flex items-center justify-between">
						<span>{title}</span>
						<span className="text-sm font-normal text-muted-foreground ml-2">
							{platformName}
						</span>
					</DialogTitle>
				</DialogHeader>
				<div className="px-6 pb-6">
					{getEmbedContent()}
					<div className="mt-4 flex items-center justify-between pt-4 border-t">
						<p className="text-sm text-muted-foreground truncate flex-1 mr-4">
							{url}
						</p>
						<Button variant="outline" size="sm" asChild>
							<a href={url} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="h-4 w-4 mr-2" />
								Open Original
							</a>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

