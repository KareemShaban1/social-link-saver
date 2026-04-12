// Utility functions to detect and handle video/reel URLs

export type VideoPlatform =
	| 'youtube'
	| 'instagram'
	| 'tiktok'
	| 'facebook'
	| 'vimeo'
	| 'twitter'
	| 'linkedin'
	| 'pinterest'
	| 'unknown';

export interface VideoInfo {
	isVideo: boolean;
	embedUrl?: string;
	/** Embed URL for Link Preview only (e.g. X post, Pinterest pin). Not used for “Watch video” when isVideo is false. */
	previewEmbedUrl?: string;
	platform: VideoPlatform;
	videoId?: string;
}

/** Canonical host for Facebook’s video embed plugin (`web.` / `m.` → `www.`). */
export function normalizeFacebookVideoPageUrl(url: string): string {
	try {
		const u = new URL(url);
		const h = u.hostname.toLowerCase();
		if (h === "web.facebook.com" || h === "m.facebook.com" || h === "mbasic.facebook.com") {
			u.hostname = "www.facebook.com";
		}
		return u.toString();
	} catch {
		return url;
	}
}

/**
 * Detects if a URL is a video/reel and extracts embed information
 * @param url - The URL to check
 * @param platformHint - Optional platform name from the database to help detection
 */
export const detectVideoUrl = (url: string, platformHint?: string): VideoInfo => {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		const pathname = urlObj.pathname; // Keep original case for IDs

		// YouTube - handle multiple URL formats
		if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
			let videoId: string | null = null;

			if (hostname.includes('youtu.be')) {
				// youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?t=123
				const path = pathname.slice(1);
				videoId = path.split('?')[0].split('/')[0].split('#')[0];
			} else if (urlObj.searchParams.has('v')) {
				// youtube.com/watch?v=VIDEO_ID
				videoId = urlObj.searchParams.get('v');
			} else if (pathname.includes('/watch/')) {
				// youtube.com/watch/VIDEO_ID
				videoId = pathname.split('/watch/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0];
			} else if (pathname.includes('/embed/')) {
				// Already an embed URL - extract ID
				videoId = pathname.split('/embed/')[1]?.split('?')[0]?.split('#')[0];
			} else if (pathname.includes('/v/')) {
				// youtube.com/v/VIDEO_ID
				videoId = pathname.split('/v/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0];
			} else if (pathname.includes('/shorts/')) {
				// youtube.com/shorts/VIDEO_ID
				videoId = pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0];
			}

			if (videoId) {
				// Clean video ID (remove any extra characters)
				videoId = videoId.split('&')[0].split('#')[0].split('?')[0].trim();
				// YouTube video IDs are typically 11 characters, but accept 8+ for edge cases
				if (videoId.length >= 8 && /^[a-zA-Z0-9_-]+$/.test(videoId)) {
					return {
						isVideo: true,
						embedUrl: `https://www.youtube.com/embed/${videoId}`,
						platform: 'youtube',
						videoId,
					};
				}
			}
		}

		// Instagram Reels and TV posts (not regular posts - they might be photos)
		if (hostname.includes('instagram.com')) {
			// Only mark /reel/ and /tv/ as videos - /p/ posts might be photos
			const reelMatch = pathname.match(/\/(reel|tv)\/([a-zA-Z0-9_-]+)/i);
			if (reelMatch) {
				const kind = reelMatch[1].toLowerCase();
				const reelId = reelMatch[2];
				const embedPath = kind === 'reel' ? `reel/${reelId}` : `tv/${reelId}`;
				return {
					isVideo: true,
					embedUrl: `https://www.instagram.com/${embedPath}/embed/?cr=1&v=14&wp=1080&rd=${encodeURIComponent(url)}`,
					platform: 'instagram',
					videoId: reelId,
				};
			}
			// Don't mark regular /p/ posts as videos - they're often photos
		}

		// TikTok
		if (hostname.includes('tiktok.com')) {
			// TikTok pattern: /@username/video/[id] or /video/[id]
			const tiktokMatch = pathname.match(/\/video\/(\d+)/);
			if (tiktokMatch) {
				const videoId = tiktokMatch[1];
				// TikTok embed - use the full URL
				return {
					isVideo: true,
					embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
					platform: 'tiktok',
					videoId,
				};
			}
		}

		// Facebook Videos and Reels
		if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) {
			// Facebook video patterns:
			// - /watch/?v=VIDEO_ID
			// - /PAGE_NAME/videos/VIDEO_ID
			// - /watch/live/?v=VIDEO_ID
			// - /reel/VIDEO_ID
			// - fb.watch/VIDEO_ID

			let videoId: string | null = null;

			// Check for /videos/ pattern
			const videosMatch = pathname.match(/\/videos\/(\d+)/);
			if (videosMatch) {
				videoId = videosMatch[1];
			}

			// Check for /reel/ pattern (Facebook Reels)
			if (!videoId) {
				const reelMatch = pathname.match(/\/reel\/([a-zA-Z0-9_-]+)/);
				if (reelMatch) {
					videoId = reelMatch[1];
				}
			}

			// Check for ?v= parameter
			if (!videoId && urlObj.searchParams.has('v')) {
				videoId = urlObj.searchParams.get('v');
			}

			// Check for fb.watch format
			if (!videoId && hostname.includes('fb.watch')) {
				videoId = pathname.slice(1).split('?')[0].split('/')[0];
			}

			// If we found a video ID or the URL looks like a video/reel, mark as video
			// Also check for common Facebook video indicators
			const isVideoUrl = videoId ||
				pathname.includes('/watch') ||
				pathname.includes('/reel') ||
				pathname.includes('/videos/') ||
				pathname.includes('/video/') ||
				hostname.includes('fb.watch');

			if (isVideoUrl) {
				const hrefForPlugin = normalizeFacebookVideoPageUrl(url);
				return {
					isVideo: true,
					embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(hrefForPlugin)}&show_text=false&width=500`,
					platform: 'facebook',
					videoId: videoId || undefined,
				};
			}
		}

		// X (Twitter) — post embed (includes video tweets when X allows embedding)
		if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
			const statusMatch = pathname.match(/\/status\/(\d+)/);
			if (statusMatch) {
				const tweetId = statusMatch[1];
				return {
					isVideo: false,
					previewEmbedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`,
					platform: 'twitter',
					videoId: tweetId,
				};
			}
		}

		// Pinterest pin (video or image pins use the same embed)
		if (hostname.includes('pinterest.')) {
			const pinMatch = pathname.match(/\/pin\/(\d+)/);
			if (pinMatch) {
				const pinId = pinMatch[1];
				return {
					isVideo: false,
					previewEmbedUrl: `https://www.pinterest.com/pin/${pinId}/embed/`,
					platform: 'pinterest',
					videoId: pinId,
				};
			}
		}

		// LinkedIn feed update embed (activity or ugc post URN)
		if (hostname.includes('linkedin.com')) {
			let urn: string | null = null;
			const urnDirect = url.match(/(urn:li:(?:activity|ugcPost):\d+)/);
			if (urnDirect) {
				urn = urnDirect[1];
			}
			if (!urn) {
				const activityInPath = pathname.match(/activity[-_:](\d{10,})/i);
				if (activityInPath) {
					urn = `urn:li:activity:${activityInPath[1]}`;
				}
			}
			if (urn) {
				return {
					isVideo: false,
					previewEmbedUrl: `https://www.linkedin.com/embed/feed/update/${encodeURIComponent(urn)}`,
					platform: 'linkedin',
					videoId: urn,
				};
			}
		}

		// Vimeo
		if (hostname.includes('vimeo.com')) {
			const vimeoMatch = pathname.match(/\/(\d+)/);
			if (vimeoMatch) {
				const videoId = vimeoMatch[1];
				return {
					isVideo: true,
					embedUrl: `https://player.vimeo.com/video/${videoId}`,
					platform: 'vimeo',
					videoId,
				};
			}
		}

		// Use platform hint to help detection if URL parsing didn't work
		// BUT only if we can actually extract a video ID - don't mark as video just because platform matches
		if (platformHint) {
			const platformLower = platformHint.toLowerCase();

			// YouTube - only mark as video if we can extract video ID
			if (platformLower === 'youtube' || platformLower.includes('youtube')) {
				// Try to extract video ID one more time with simpler logic
				const simpleMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{8,})/);
				if (simpleMatch && simpleMatch[1]) {
					return {
						isVideo: true,
						embedUrl: `https://www.youtube.com/embed/${simpleMatch[1]}`,
						platform: 'youtube',
						videoId: simpleMatch[1],
					};
				}
				// Don't mark as video if we can't extract ID - YouTube has many non-video pages
			}

			// Instagram - only mark as video if URL contains /reel/ or /tv/ (video indicators)
			// Regular /p/ posts might be photos, not videos
			if (platformLower === 'instagram' || platformLower.includes('instagram')) {
				const reelMatch = url.match(/instagram\.com\/(reel|tv)\/([a-zA-Z0-9_-]+)/i);
				if (reelMatch && reelMatch[2]) {
					const k = reelMatch[1].toLowerCase();
					const id = reelMatch[2];
					const embedPath = k === 'reel' ? `reel/${id}` : `tv/${id}`;
					return {
						isVideo: true,
						embedUrl: `https://www.instagram.com/${embedPath}/embed/`,
						platform: 'instagram',
						videoId: id,
					};
				}
			}

			// TikTok - only mark as video if URL contains /video/
			if (platformLower === 'tiktok' || platformLower.includes('tiktok')) {
				// Try simpler TikTok detection - must have /video/ in URL
				const simpleMatch = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
				if (simpleMatch && simpleMatch[1]) {
					return {
						isVideo: true,
						embedUrl: `https://www.tiktok.com/embed/v2/${simpleMatch[1]}`,
						platform: 'tiktok',
						videoId: simpleMatch[1],
					};
				}
				// Don't mark as video if no /video/ in URL - TikTok has profile pages, etc.
			}

			// Facebook - only mark as video if URL has clear video indicators
			if (platformLower === 'facebook' || platformLower.includes('facebook')) {
				// Only mark as video if URL has /videos/, /reel/, /watch, or fb.watch
				if (url.includes('/videos/') || url.includes('/reel/') || url.includes('/watch') || url.includes('fb.watch')) {
					const hrefForPlugin = normalizeFacebookVideoPageUrl(url);
					return {
						isVideo: true,
						embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(hrefForPlugin)}&show_text=false&width=500`,
						platform: 'facebook',
					};
				}
				// Don't mark regular Facebook pages as videos
			}

			// Vimeo - only mark as video if we can extract video ID
			if (platformLower === 'vimeo' || platformLower.includes('vimeo')) {
				const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
				if (vimeoMatch && vimeoMatch[1]) {
					return {
						isVideo: true,
						embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
						platform: 'vimeo',
						videoId: vimeoMatch[1],
					};
				}
			}

			if (platformLower === 'twitter' || platformLower.includes('twitter') || platformLower === 'x') {
				const m = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
				if (m?.[1]) {
					return {
						isVideo: false,
						previewEmbedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&theme=light`,
						platform: 'twitter',
						videoId: m[1],
					};
				}
			}

			if (platformLower === 'pinterest' || platformLower.includes('pinterest')) {
				const m = url.match(/pinterest\.\w+\/pin\/(\d+)/);
				if (m?.[1]) {
					return {
						isVideo: false,
						previewEmbedUrl: `https://www.pinterest.com/pin/${m[1]}/embed/`,
						platform: 'pinterest',
						videoId: m[1],
					};
				}
			}

			if (platformLower === 'linkedin' || platformLower.includes('linkedin')) {
				let urn: string | null = null;
				const u = url.match(/(urn:li:(?:activity|ugcPost):\d+)/);
				if (u) urn = u[1];
				if (!urn) {
					const a = url.match(/activity[-_:](\d{10,})/i);
					if (a) urn = `urn:li:activity:${a[1]}`;
				}
				if (urn) {
					return {
						isVideo: false,
						previewEmbedUrl: `https://www.linkedin.com/embed/feed/update/${encodeURIComponent(urn)}`,
						platform: 'linkedin',
						videoId: urn,
					};
				}
			}
		}

		// REMOVED: Final fallback that marks all video platform links as videos
		// This was too lenient and caused false positives

		return {
			isVideo: false,
			platform: 'unknown',
		};
	} catch (error) {
		return {
			isVideo: false,
			platform: 'unknown',
		};
	}
};

/**
 * Gets a display-friendly platform name
 */
export const getVideoPlatformName = (platform: VideoInfo['platform']): string => {
	const names: Record<VideoInfo['platform'], string> = {
		youtube: 'YouTube',
		instagram: 'Instagram',
		tiktok: 'TikTok',
		facebook: 'Facebook Video',
		vimeo: 'Vimeo',
		twitter: 'X (Twitter)',
		linkedin: 'LinkedIn',
		pinterest: 'Pinterest',
		unknown: 'Video',
	};
	return names[platform] || 'Video';
};

